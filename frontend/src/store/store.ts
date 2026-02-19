import { configureStore } from "@reduxjs/toolkit";
import generationReducer from "./slices/generationSlice";
import authReducer from "./slices/authSlice";
import feedReducer from "./slices/feedSlice";

export const store = configureStore({
  reducer: {
    generation: generationReducer,
    auth: authReducer,
    feed: feedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Allow File objects in state (referenceImage)
        ignoredPaths: ["generation.referenceImage"],
        ignoredActions: ["generation/setReferenceImage"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
