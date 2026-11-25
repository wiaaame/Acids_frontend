import { configureStore } from "@reduxjs/toolkit";
import reactionsReducer from "./slices/reactionsSlice";
import userReducer from "./slices/userSlice";

// Единый store Redux Toolkit.
// configureStore автоматически подключает redux-thunk (createAsyncThunk)
// и расширение Redux DevTools в браузере.
export const store = configureStore({
  reducer: {
    reactions: reactionsReducer,
    user: userReducer,
  },
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
