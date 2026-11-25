import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Состояние интерфейса после авторизации: гость или пользователь.
// Авторизация выполняется вручную через axios, поэтому здесь только
// синхронные редьюсеры — без createAsyncThunk.
export interface UserState {
  username: string;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  username: "",
  isAuthenticated: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Успешный вход: кладём имя пользователя и включаем интерфейс пользователя
    setUser: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    // Выход: сбрасываем интерфейс в состояние гостя
    clearUser: (state) => {
      state.username = "";
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setUser, clearUser, setAuthLoading, setAuthError } =
  userSlice.actions;
export default userSlice.reducer;
