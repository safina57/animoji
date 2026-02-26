import { useEffect, useRef } from "react"
import { useSSE } from "@hooks/useSSE"
import { useAppDispatch } from "@hooks/redux"
import {
  variantsInitialized,
  variantReady,
  variantFailed,
  allVariantsComplete,
  failEmojiGeneration,
} from "@store/slices/emojiSlice"
import { getEmojiStatusStreamUrl } from "@services/emojiService"
import type { EmojiSSEEvent } from "@customTypes/emoji"

export function useEmojiStatus(jobId: string | null, enabled: boolean) {
  const dispatch = useAppDispatch()
  const handledJobRef = useRef<string | null>(null)

  const url = enabled && jobId ? getEmojiStatusStreamUrl(jobId) : null

  useEffect(() => {
    if (!enabled) {
      handledJobRef.current = null
    }
  }, [enabled])

  useEffect(() => {
    if (enabled && jobId && handledJobRef.current !== jobId) {
      handledJobRef.current = jobId
    }
  }, [jobId, enabled])

  const { isConnected, disconnect } = useSSE(url, {
    onMessage: (data: EmojiSSEEvent) => {
      if (data.type === "started") {
        dispatch(variantsInitialized(data.total))
      } else if (data.type === "variant_ready") {
        dispatch(
          variantReady({
            emotion: data.emotion,
            variantId: data.variant_id,
            variantUrl: data.variant_url,
            total: data.total,
          })
        )
      } else if (data.type === "all_complete") {
        dispatch(
          allVariantsComplete({ variantUrls: data.variant_urls, variantIds: data.variant_ids })
        )
        disconnect()
      } else if (data.type === "variant_failed") {
        dispatch(variantFailed(data.emotion))
      } else if (data.type === "timeout") {
        dispatch(failEmojiGeneration("Generation timed out. Please try again."))
        disconnect()
      }
    },
    onError: (error: string) => {
      dispatch(failEmojiGeneration(error))
    },
  })

  return { isConnected }
}
