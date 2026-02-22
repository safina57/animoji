import asyncio
import base64
import io
import json
import logging

from nats.aio.msg import Msg
from PIL import Image, ImageDraw, ImageFilter
from pydantic_ai import Agent, BinaryContent

from core.flux_client import FluxClient, get_flux_client
from core.logger import get_logger
from core.minio_client import MinioClient, get_minio_client
from core.nats_client import NatsClient, get_nats_client
from core.prompt_agent import get_emoji_prompt_agent
from core.settings import Settings, get_settings
from models.image_generation import EmojiBaseStyle, FluxRequest
from models.job import EmojiJobMessage
from prompts import get_emotion_cue

_DEFAULT_EMOTIONS: list[str] = ["happy", "sad", "surprised"]

_MAX_EMOTIONS: int = 3


def _remove_white_background(
    img: Image.Image,
    threshold: int = 230,
    edge_sample_step: int = 1,
) -> Image.Image:
    """
    Convert a white-background RGBA image to a transparent RGBA image using Pillow.

    Three-stage approach:
    1. Border flood fill — seeds every N pixels along all 4 edges.
    2. Direct border cleanup — kills near-white border pixels missed by the fill.
    3. Soft alpha fringe removal — GaussianBlur + re-threshold on alpha channel.

    Args:
        img: RGBA Image opened from FLUX output.
        threshold: All-channel minimum to treat a pixel as near-white. Default 230.
        edge_sample_step: Pixel stride for border seed points. Default 1 (every pixel).
    """
    img = img.convert("RGBA")
    w, h = img.size

    # Stage 1: flood fill from all border pixels.
    work = img.convert("RGB")
    sentinel = (2, 3, 4)
    fill_thresh = 255 - threshold

    border_pixels = (
        [(x, 0) for x in range(0, w, edge_sample_step)] +
        [(x, h - 1) for x in range(0, w, edge_sample_step)] +
        [(0, y) for y in range(0, h, edge_sample_step)] +
        [(w - 1, y) for y in range(0, h, edge_sample_step)]
    )
    for pt in border_pixels:
        pixel = work.getpixel(pt)
        if pixel == sentinel:
            continue
        if all(c >= threshold for c in pixel):
            ImageDraw.floodfill(work, pt, sentinel, thresh=fill_thresh)

    # Stage 2: direct border cleanup for pixels missed by the fill.
    border_threshold = threshold - 15
    orig_data = list(img.getdata())
    work_data = list(work.getdata())

    border_indices: set[int] = set()
    for x in range(w):
        border_indices.add(x)
        border_indices.add((h - 1) * w + x)
    for y in range(h):
        border_indices.add(y * w)
        border_indices.add(y * w + w - 1)

    new_data = []
    for i, (r, g, b, a) in enumerate(orig_data):
        if work_data[i] == sentinel:
            new_data.append((r, g, b, 0))
        elif i in border_indices and all(c >= border_threshold for c in (r, g, b)):
            new_data.append((r, g, b, 0))
        else:
            new_data.append((r, g, b, a))
    img.putdata(new_data)

    # Stage 3: soft fringe removal via GaussianBlur + re-threshold on alpha.
    r_ch, g_ch, b_ch, a_ch = img.split()
    a_ch = a_ch.filter(ImageFilter.GaussianBlur(radius=1.0))
    a_ch = a_ch.point(lambda p: 255 if p > 220 else 0)
    return Image.merge("RGBA", (r_ch, g_ch, b_ch, a_ch))


def _add_sticker_border(
    img: Image.Image,
    border_width: int = 2,
    border_color: tuple[int, int, int, int] = (0, 0, 0, 255),
) -> Image.Image:
    """
    Add a solid border around the character by dilating the alpha mask.

    The border is composited behind the original image so it only appears
    in the transparent region adjacent to the character, covering residual
    edge noise and giving the classic LINE/WhatsApp sticker outline finish.

    Args:
        img: RGBA Image with background already removed.
        border_width: Thickness of the border in pixels. Default 2.
        border_color: RGBA colour of the border. Default opaque black.
    """
    _, _, _, a = img.split()

    # MaxFilter(2n+1) dilates the opaque region by n pixels in all directions.
    dilated_a = a.filter(ImageFilter.MaxFilter(2 * border_width + 1))

    border_layer = Image.new("RGBA", img.size, border_color)
    border_layer.putalpha(dilated_a)

    return Image.alpha_composite(border_layer, img)


class EmojiConsumer:
    """
    Consumes emoji job messages from the emoji.generate NATS subject.

    One NATS message triggers all 3 emotion variants. A single GPT-4o call
    extracts the character style anchor; 3 FLUX calls then run in parallel
    using deterministic emotion prompts built from that shared anchor.
    """

    def __init__(
        self,
        nats_client: NatsClient,
        minio_client: MinioClient,
        flux_client: FluxClient,
        prompt_agent: Agent,
        settings: Settings,
        logger: logging.Logger,
    ) -> None:
        self.nats_client = nats_client
        self.minio_client = minio_client
        self.flux_client = flux_client
        self.prompt_agent = prompt_agent
        self.settings = settings
        self.logger = logger

    async def start(self) -> None:
        """Start consuming emoji generation messages from NATS."""
        await self.nats_client.connect()
        await self.nats_client.subscribe(
            subject=self.settings.emoji_nats_subject,
            callback=self._handle_message,
        )
        self.logger.info("Emoji consumer started", extra={"subject": self.settings.emoji_nats_subject})


    async def _handle_message(self, msg: Msg) -> None:
        """Process a single emoji job"""
        job_id: str | None = None
        active_emotions: list[tuple[int, str]] = list(enumerate(_DEFAULT_EMOTIONS))
        try:
            data = json.loads(msg.data.decode())
            job = EmojiJobMessage(**data)
            job_id = job.job_id

            self.logger.info("Received emoji job", extra={"job_id": job_id})

            # Step 1: Download reference image
            image_data = await self.minio_client.download_file(job.input_key)
            self.logger.info(
                "Reference image downloaded",
                extra={"job_id": job_id, "size": len(image_data)},
            )

            # Step 2: Single LLM call → shared character style anchor
            agent_result = await self.prompt_agent.run(
                [job.prompt, BinaryContent(data=image_data, media_type=job.mime_type)]
            )
            base_style: EmojiBaseStyle = agent_result.output

            # Resolve which emotions to generate.
            # User-specified emotions take priority; fall back to defaults if none given.
            # Hard cap: never exceed _MAX_EMOTIONS variants.
            emotions = (
                base_style.emotions[:_MAX_EMOTIONS]
                if base_style.emotions
                else _DEFAULT_EMOTIONS
            )
            active_emotions = list(enumerate(emotions))

            self.logger.info(
                "Emoji base style extracted",
                extra={
                    "job_id": job_id,
                    "art_style": base_style.art_style,
                    "emotions": emotions,
                    "character": base_style.character_description[:80],
                },
            )

            # Notify the gateway of the actual variant count before any FLUX calls start.
            await self._publish_status(job_id, "started", total_variants=len(active_emotions))

            # Step 3: Generate all emotion variants in parallel
            input_image_b64 = base64.b64encode(image_data).decode("utf-8")
            await asyncio.gather(
                *[
                    self._generate_variant(job_id, variant_index, emotion, base_style, input_image_b64)
                    for variant_index, emotion in active_emotions
                ]
            )

        except json.JSONDecodeError as exc:
            self.logger.error(
                "Invalid JSON in emoji message",
                extra={"error": str(exc), "raw_data": msg.data.decode()},
            )
        except Exception as exc:
            self.logger.error(
                "Error processing emoji job",
                extra={"job_id": job_id, "error": str(exc)},
                exc_info=True,
            )
            if job_id:
                # Publish failure for all variants that didn't complete
                await asyncio.gather(
                    *[
                        self._publish_status(job_id, "failed", emotion, idx)
                        for idx, emotion in active_emotions
                    ],
                    return_exceptions=True,
                )

    async def _generate_variant(
        self,
        job_id: str,
        variant_index: int,
        emotion: str,
        base_style: EmojiBaseStyle,
        input_image_b64: str,
    ) -> None:
        """Run the full pipeline for one emotion variant and publish its result."""
        try:
            flux_prompt = self._build_flux_prompt(base_style, emotion)

            flux_request = FluxRequest(
                prompt=flux_prompt,
                input_image=input_image_b64,
                model=self.settings.flux_model,
                width=self.settings.emoji_width,
                height=self.settings.emoji_height,
            )
            image_bytes = await self.flux_client.generate(flux_request)

            self.logger.info(
                "FLUX image generated",
                extra={"job_id": job_id, "emotion": emotion, "output_size": len(image_bytes)},
            )

            # Open once, pipe through both steps, serialize once.
            img = Image.open(io.BytesIO(image_bytes))
            img = _remove_white_background(img)
            img = _add_sticker_border(img)

            out = io.BytesIO()
            img.save(out, format="PNG")

            output_key = f"tmp/{job_id}/emoji_{emotion}.png"
            await self.minio_client.upload_file(output_key, out.getvalue(), "image/png")

            await self._publish_status(job_id, "completed", emotion, variant_index, output_key)

            self.logger.info(
                "Emoji variant completed",
                extra={"job_id": job_id, "emotion": emotion, "output_key": output_key},
            )

        except Exception as exc:
            self.logger.error(
                "Error generating emoji variant",
                extra={"job_id": job_id, "emotion": emotion, "error": str(exc)},
                exc_info=True,
            )
            await self._publish_status(job_id, "failed", emotion, variant_index)

    def _build_flux_prompt(self, base: EmojiBaseStyle, emotion: str) -> str:
        """
        Build a deterministic FLUX prompt for one emotion variant.

        All 3 prompts share the same character_description, art_style, and
        color_palette prefix — only the emotion cue section differs.
        """
        style_note = (
            f"in the style of {base.art_style} with {base.style_hallmarks}, "
            if base.style_hallmarks
            else f"in {base.art_style} style, "
        )
        return (
            f"Anime chibi sticker of {base.character_description}, "
            f"{style_note}"
            f"colour palette: {base.color_palette}, "
            f"{get_emotion_cue(emotion)} "
            f"Bold solid black ink outline 3-4px thick enclosing the entire character silhouette, "
            f"hard crisp edge with no anti-aliasing between character and background, "
            f"flat anime cel-shading, "
            f"pure solid white (#FFFFFF) background — absolutely no gradients, shadows, textures, "
            f"glow effects, or colour bleed into the background, "
            f"character fully isolated on white, sticker-ready for clean segmentation, "
            f"centred square composition, LINE sticker–quality finish."
        )

    async def _publish_status(
        self,
        job_id: str,
        status: str,
        emotion: str = "",
        variant_index: int = 0,
        result_key: str | None = None,
        total_variants: int | None = None,
    ) -> None:
        """Publish a variant status or the job-level 'started' event to NATS."""
        payload: dict = {"status": status}
        if emotion:
            payload["emotion"] = emotion
            payload["variant_index"] = variant_index
        if result_key:
            payload["result_key"] = result_key
        if total_variants is not None:
            payload["total_variants"] = total_variants

        subject = f"emoji.status.{job_id}"
        await self.nats_client.publish(subject, json.dumps(payload).encode())

        self.logger.info(
            "Published emoji status",
            extra={"job_id": job_id, "emotion": emotion, "status": status},
        )


_emoji_consumer: EmojiConsumer | None = None


def get_emoji_consumer() -> EmojiConsumer:
    """Get the singleton EmojiConsumer instance."""
    global _emoji_consumer
    if _emoji_consumer is not None:
        return _emoji_consumer

    settings = get_settings()
    _emoji_consumer = EmojiConsumer(
        nats_client=get_nats_client(),
        minio_client=get_minio_client(),
        flux_client=get_flux_client(),
        prompt_agent=get_emoji_prompt_agent(),
        settings=settings,
        logger=get_logger(),
    )
    return _emoji_consumer
