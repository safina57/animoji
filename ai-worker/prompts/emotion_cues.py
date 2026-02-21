"""
Deterministic FLUX emotion cues for anime chibi sticker generation.

These cues are appended to the shared character style anchor to produce
emotion-specific FLUX prompts. Keeping them hardcoded guarantees the only
difference between the 3 FLUX prompts per job is the emotion section, so
the character design stays consistent across variants.
"""

from typing import Literal

EmotionName = Literal[
    "happy",
    "sad",
    "surprised",
    "angry",
    "crying",
    "excited",
    "laughing",
    "love",
    "embarrassed",
    "confused",
    "scared",
    "sleepy",
    "cool",
]

EMOTION_CUES: dict[str, str] = {
    "happy": (
        "expressing pure joy: huge upward-curved crescent anime eyes sparkling with star-shaped highlights, "
        "wide toothy grin, round rosy blush circles on the cheeks, tiny arms raised jubilantly. "
        "Warm yellow and soft pink accent tones amplify the happiness."
    ),
    "sad": (
        "expressing deep sadness: half-closed drooping anime eyes with large glistening teardrops "
        "at the corners, quivering downturned mouth, slumped posture with tiny hands held together forlornly. "
        "Cool blue-grey desaturated tones deepen the melancholy."
    ),
    "surprised": (
        "expressing shock: enormous wide circular anime eyes with shrunken pupils amid large white sclerae, "
        "perfect O-shaped open mouth mid-gasp, stiff body with tiny arms flung outward, "
        "small sweat drop on the temple. High-contrast whites and vivid accent tones heighten the drama."
    ),
    "angry": (
        "expressing intense anger: sharply angled V-shaped brows pressed down hard over narrowed eyes, "
        "clenched teeth bared in a grimace, flushed red cheeks, tiny fists clenched at sides, "
        "jagged lightning-bolt vein on temple. Hot orange and red accent tones radiate fury."
    ),
    "crying": (
        "expressing heartbreak: tightly shut eyes squeezed into arcs with rivers of tears streaming down, "
        "wide open sobbing mouth, both tiny hands pressing against cheeks, "
        "large watery tear droplets spraying outward. Deep blue shadow tones reinforce the anguish."
    ),
    "excited": (
        "expressing wild excitement: huge shimmering starry anime eyes wide open with spinning highlights, "
        "enormous open-mouthed grin showing all teeth, both tiny arms pumping upward, "
        "speed-line radiating aura around the body. Vivid warm yellow and bright orange pulse with energy."
    ),
    "laughing": (
        "laughing uncontrollably: eyes squinted shut into happy crescents with laugh-tears at the corners, "
        "wide open mouth mid-cackle, one tiny hand slapping the knee, body leaning forward. "
        "Warm golden tones and scattered sparkle marks fill the scene."
    ),
    "love": (
        "expressing adoration: enormous sparkling heart-shaped pupils glowing pink, rosy blush covering "
        "both cheeks, tiny hands clasped together under the chin, soft pink floating hearts drifting upward. "
        "Pastel rose and soft red accent tones flood the palette."
    ),
    "embarrassed": (
        "expressing deep embarrassment: eyes darting sideways and half-averted, enormous circular blush "
        "marks covering most of both cheeks, tiny hands raised to cover the face, posture curled inward. "
        "Warm pink and dusty rose tones wash over the character."
    ),
    "confused": (
        "expressing confusion: one eyebrow raised high, the other furrowed, mouth a wobbly uncertain line, "
        "head tilted at an angle, a large blue sweat drop on the side of the head, "
        "cartoon question marks floating nearby. Muted cool tones underscore the uncertainty."
    ),
    "scared": (
        "expressing fear: enormous wide eyes with tiny shrunken pupils and pale white sclerae dominating, "
        "mouth agape in a silent scream, fur/hair standing on end, body trembling with motion lines, "
        "cold sweat drops flying off. Icy blue-white tones and dark shadows heighten the terror."
    ),
    "sleepy": (
        "expressing exhaustion: one eye fully closed, the other drooping to a thin half-crescent, "
        "small 'zzz' bubbles floating from the nose, tiny body slumped with head lolling to one side, "
        "a tiny pillow appearing beside. Soft lavender and muted grey-blue tones signal drowsiness."
    ),
    "cool": (
        "expressing effortless coolness: one eye closed in a relaxed half-lidded squint, subtle smirk "
        "at the corner of the mouth, arms loosely crossed, sunglasses optionally perched on the nose, "
        "a small sparkle near the smirk. Deep navy and cool silver tones project calm confidence."
    ),
}


def get_emotion_cue(emotion: str) -> str:
    """Return the FLUX cue for a known emotion, or a generic anime fallback."""
    key = emotion.lower().strip()
    if key in EMOTION_CUES:
        return EMOTION_CUES[key]
    return (
        f"expressing {emotion} with highly exaggerated anime chibi facial features — "
        f"large expressive eyes, clear emotion-specific mouth shape, and chibi body language "
        f"that instantly conveys the feeling to the viewer."
    )
