import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { imageService, GALLERY_PAGE_SIZE } from "@services/imageService";
import type { ImageFeedItem } from "@customTypes/image";
import type { RootState } from "@store/store";

export type GalleryVisibility = "public" | "private";

interface GalleryState {
  visibility: GalleryVisibility;
  images: ImageFeedItem[];
  offset: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

const initialState: GalleryState = {
  visibility: "public",
  images: [],
  offset: 0,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
};

export const loadGallery = createAsyncThunk(
  "gallery/loadGallery",
  async (visibility: GalleryVisibility) => {
    return imageService.fetchMyImages(visibility, GALLERY_PAGE_SIZE, 0);
  }
);

export const loadMoreGallery = createAsyncThunk(
  "gallery/loadMoreGallery",
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { offset, visibility } = state.gallery;
    return imageService.fetchMyImages(visibility, GALLERY_PAGE_SIZE, offset);
  }
);

const gallerySlice = createSlice({
  name: "gallery",
  initialState,
  reducers: {
    setVisibility(state, action: PayloadAction<GalleryVisibility>) {
      state.visibility = action.payload;
    },
    updateLikedStatus(
      state,
      action: PayloadAction<{ imageId: string; liked: boolean }>
    ) {
      const item = state.images.find((img) => img.id === action.payload.imageId);
      if (item) {
        item.is_liked_by_user = action.payload.liked;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGallery.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.images = [];
        state.offset = 0;
      })
      .addCase(loadGallery.fulfilled, (state, action) => {
        state.isLoading = false;
        state.images = action.payload.images;
        state.offset = action.payload.images.length;
        state.hasMore = action.payload.has_more;
      })
      .addCase(loadGallery.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? "Failed to load gallery";
      })
      .addCase(loadMoreGallery.pending, (state) => {
        state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(loadMoreGallery.fulfilled, (state, action) => {
        state.isLoadingMore = false;
        state.images = [...state.images, ...action.payload.images];
        state.offset = state.images.length;
        state.hasMore = action.payload.has_more;
      })
      .addCase(loadMoreGallery.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.error = action.error.message ?? "Failed to load more";
      });
  },
});

export const { setVisibility, updateLikedStatus: updateGalleryLikedStatus } =
  gallerySlice.actions;
export default gallerySlice.reducer;
