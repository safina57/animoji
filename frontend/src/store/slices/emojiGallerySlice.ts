import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { fetchMyEmojiPacks, EMOJI_GALLERY_PAGE_SIZE } from "@services/emojiService"
import type { EmojiPackGalleryItem } from "@customTypes/emoji"
import type { RootState } from "@store/store"

interface EmojiGalleryState {
  packs: EmojiPackGalleryItem[]
  offset: number
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
}

const initialState: EmojiGalleryState = {
  packs: [],
  offset: 0,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
}

export const loadEmojiGallery = createAsyncThunk("emojiGallery/load", async () =>
  fetchMyEmojiPacks(EMOJI_GALLERY_PAGE_SIZE, 0)
)

export const loadMoreEmojiGallery = createAsyncThunk(
  "emojiGallery/loadMore",
  async (_, { getState }) => {
    const state = getState() as RootState
    return fetchMyEmojiPacks(EMOJI_GALLERY_PAGE_SIZE, state.emojiGallery.offset)
  }
)

const emojiGallerySlice = createSlice({
  name: "emojiGallery",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadEmojiGallery.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.packs = []
        state.offset = 0
      })
      .addCase(loadEmojiGallery.fulfilled, (state, action) => {
        state.isLoading = false
        state.packs = action.payload.packs
        state.offset = action.payload.packs.length
        state.hasMore = action.payload.has_more
      })
      .addCase(loadEmojiGallery.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? "Failed to load emoji gallery"
      })
      .addCase(loadMoreEmojiGallery.pending, (state) => {
        state.isLoadingMore = true
      })
      .addCase(loadMoreEmojiGallery.fulfilled, (state, action) => {
        state.isLoadingMore = false
        state.packs = [...state.packs, ...action.payload.packs]
        state.offset = state.packs.length
        state.hasMore = action.payload.has_more
      })
      .addCase(loadMoreEmojiGallery.rejected, (state, action) => {
        state.isLoadingMore = false
        state.error = action.error.message ?? "Failed to load more emoji packs"
      })
  },
})

export default emojiGallerySlice.reducer
