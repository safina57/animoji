import { configureStore } from "@reduxjs/toolkit"
import generationReducer from "./slices/generationSlice"
import authReducer from "./slices/authSlice"
import feedReducer from "./slices/feedSlice"
import galleryReducer from "./slices/gallerySlice"
import emojiReducer from "./slices/emojiSlice"
import emojiGalleryReducer from "./slices/emojiGallerySlice"

export const store = configureStore({
  reducer: {
    generation: generationReducer,
    auth: authReducer,
    feed: feedReducer,
    gallery: galleryReducer,
    emoji: emojiReducer,
    emojiGallery: emojiGalleryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Allow File objects in state (referenceImage)
        ignoredPaths: ["generation.referenceImage", "emoji.referenceImage"],
        ignoredActions: ["generation/setReferenceImage", "emoji/setEmojiReferenceImage"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
