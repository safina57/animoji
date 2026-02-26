import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { imageService, FEED_PAGE_SIZE } from "@services/imageService"
import type { ImageFeedItem } from "@customTypes/image"
import type { RootState } from "@store/store"

interface FeedState {
  images: ImageFeedItem[]
  offset: number
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
}

const initialState: FeedState = {
  images: [],
  offset: 0,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
}

export const loadFeed = createAsyncThunk("feed/loadFeed", async () => {
  return imageService.fetchPublicImages(FEED_PAGE_SIZE, 0)
})

export const loadMoreFeed = createAsyncThunk("feed/loadMoreFeed", async (_, { getState }) => {
  const state = getState() as RootState
  const { offset } = state.feed
  return imageService.fetchPublicImages(FEED_PAGE_SIZE, offset)
})

const feedSlice = createSlice({
  name: "feed",
  initialState,
  reducers: {
    updateLikedStatus(state, action: PayloadAction<{ imageId: string; liked: boolean }>) {
      const item = state.images.find((img) => img.id === action.payload.imageId)
      if (item) {
        item.is_liked_by_user = action.payload.liked
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFeed.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.images = []
        state.offset = 0
      })
      .addCase(loadFeed.fulfilled, (state, action) => {
        state.isLoading = false
        state.images = action.payload.images
        state.offset = action.payload.images.length
        state.hasMore = action.payload.has_more
      })
      .addCase(loadFeed.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? "Failed to load feed"
      })
      .addCase(loadMoreFeed.pending, (state) => {
        state.isLoadingMore = true
        state.error = null
      })
      .addCase(loadMoreFeed.fulfilled, (state, action) => {
        state.isLoadingMore = false
        state.images = [...state.images, ...action.payload.images]
        state.offset = state.images.length
        state.hasMore = action.payload.has_more
      })
      .addCase(loadMoreFeed.rejected, (state, action) => {
        state.isLoadingMore = false
        state.error = action.error.message ?? "Failed to load more"
      })
  },
})

export const { updateLikedStatus } = feedSlice.actions
export default feedSlice.reducer
