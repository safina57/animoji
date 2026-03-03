import { validate as isUUID } from "uuid"

import type { ImageDetailItem, PublicImagesResponse } from "@customTypes/image"

const API_URL = import.meta.env.VITE_API_URL

function assertValidId(id: string, name = "id"): void {
  if (!isUUID(id)) throw new Error(`Invalid ${name} format`)
}

export const FEED_PAGE_SIZE = 20
export const GALLERY_PAGE_SIZE = 20

export const imageService = {
  async fetchMyImages(
    visibility: "public" | "private",
    limit: number,
    offset: number
  ): Promise<PublicImagesResponse> {
    const response = await fetch(
      `${API_URL}/images/me?visibility=${visibility}&limit=${limit}&offset=${offset}`,
      { credentials: "include" }
    )
    if (!response.ok) {
      throw new Error("Failed to fetch your images")
    }
    return response.json()
  },

  async fetchPublicImages(limit: number, offset: number): Promise<PublicImagesResponse> {
    const response = await fetch(`${API_URL}/images/public?limit=${limit}&offset=${offset}`, {
      credentials: "include",
    })
    if (!response.ok) {
      throw new Error("Failed to fetch public images")
    }
    return response.json()
  },

  async fetchImageDetail(imageId: string): Promise<ImageDetailItem> {
    assertValidId(imageId, "image_id")
    const response = await fetch(`${API_URL}/images/${imageId}`, {
      credentials: "include",
    })
    if (!response.ok) {
      throw new Error("Failed to fetch image")
    }
    return response.json()
  },

  async likeImage(imageId: string): Promise<void> {
    assertValidId(imageId, "image_id")
    const response = await fetch(`${API_URL}/images/${imageId}/like`, {
      method: "POST",
      credentials: "include",
    })
    if (!response.ok) {
      throw new Error("Failed to like image")
    }
  },

  async unlikeImage(imageId: string): Promise<void> {
    assertValidId(imageId, "image_id")
    const response = await fetch(`${API_URL}/images/${imageId}/like`, {
      method: "DELETE",
      credentials: "include",
    })
    if (!response.ok) {
      throw new Error("Failed to unlike image")
    }
  },

  async checkLiked(imageId: string): Promise<boolean> {
    assertValidId(imageId, "image_id")
    const response = await fetch(`${API_URL}/images/${imageId}/liked`, {
      credentials: "include",
    })
    if (!response.ok) {
      return false
    }
    const data = (await response.json()) as { liked: boolean }
    return data.liked
  },
}
