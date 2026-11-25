import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { api } from "../../api";
import { fromAcidDTO } from "../../modules/acidMapper";
import { IS_GITHUB_PAGES } from "../../modules/deploy";
import { filterAcidReactions } from "../../modules/mock";
import type { AcidReaction, AcidReactionCreate } from "../../modules/types";
import type { RootState } from "../index";

// На GitHub Pages бэкенда нет: все операции чтения идут в mock,
// а изменяющие операции сразу возвращают понятную ошибку.
const PAGES_DEMO_ERROR =
  "Демо-режим GitHub Pages: изменения доступны только при запуске с бэкендом";

// Коды ответов, означающие, что веб-сервис недоступен:
// 503 отдаёт Vite-прокси, 502/504 — прокси при недоступном апстриме.
const isBackendUnavailable = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return !status || [404, 405, 501, 502, 503, 504].includes(status);
};

// Границы двойного ползунка по молярной массе, г/моль
export const MIN_MOLAR_MASS = 0;
export const MAX_MOLAR_MASS = 200;

// Значения фильтров хранятся в Redux Toolkit.
// В интерфейсе оставлен только фильтр по молярной массе.
export interface ReactionsFilters {
  massRange: [number, number];
}

export interface ReactionsState {
  items: AcidReaction[];
  filters: ReactionsFilters;
  loading: boolean;
  saving: boolean;
  error: string | null;
  // Откуда получены данные: из веб-сервиса или из локальной коллекции
  source: "api" | "mock" | null;
}

const initialState: ReactionsState = {
  items: [],
  filters: {
    massRange: [MIN_MOLAR_MASS, MAX_MOLAR_MASS],
  },
  loading: false,
  saving: false,
  error: null,
  source: null,
};

// Список услуг через кодогенерированный клиент (redux-thunk middleware).
// Mock-коллекция — только для гостя: авторизованный пользователь должен
// видеть реальные данные веб-сервиса, а при недоступности бэкенда — ошибку.
export const fetchReactions = createAsyncThunk<
  { items: AcidReaction[]; source: "api" | "mock" },
  void,
  { state: RootState; rejectValue: string }
>("reactions/fetchReactions", async (_, { getState, rejectWithValue }) => {
  const { reactions, user } = getState();
  const [massMin, massMax] = reactions.filters.massRange;

  // GitHub Pages — только mock, без сетевых запросов к /api.
  if (IS_GITHUB_PAGES) {
    return {
      items: filterAcidReactions(reactions.filters),
      source: "mock" as const,
    };
  }

  try {
    // secure: true — даже публичный список получает JWT, чтобы бэкенд
    // вернул признаки is_mine и liked для текущего пользователя.
    const response = await api.api.acidsList(
      { min: massMin, max: massMax },
      { timeout: 1500, secure: true }
    );

    return {
      items: response.data.map(fromAcidDTO),
      source: "api" as const,
    };
  } catch (error) {
    // Реальная ошибка API или авторизованный пользователь:
    // mock не подставляем, показываем ошибку загрузки.
    if (!isBackendUnavailable(error) || user.isAuthenticated) {
      return rejectWithValue("Не удалось загрузить список услуг");
    }

    // Гость без доступа к веб-сервису видит локальную коллекцию.
    return {
      items: filterAcidReactions(reactions.filters),
      source: "mock" as const,
    };
  }
});

// Создание услуги — кодогенерация + thunk (multipart/form-data)
export const createReaction = createAsyncThunk<
  AcidReaction,
  AcidReactionCreate,
  { rejectValue: string }
>("reactions/createReaction", async (data, { rejectWithValue }) => {
  if (IS_GITHUB_PAGES) {
    return rejectWithValue(PAGES_DEMO_ERROR);
  }

  try {
    // Файлы добавляем только если они выбраны: иначе сгенерированный
    // createFormData отправит строку "undefined" в поле файла.
    const payload = {
      reaction_name: data.acid_name,
      acid_name: data.acid_name,
      acid_formula: "",
      molar_mass: data.molar_mass ?? 0,
      concentration: data.concentration ?? 0,
      calcium_carbonate_mass: 0,
      description: data.description ?? "",
      ...(data.image ? { image: data.image } : {}),
      ...(data.video ? { video: data.video } : {}),
    };

    const response = await api.api.acidsCreate(payload);

    return fromAcidDTO(response.data);
  } catch {
    return rejectWithValue("Не удалось добавить услугу. Попробуйте ещё раз.");
  }
});

// Черновик текущего пользователя: не более одной записи.
export const fetchDraft = createAsyncThunk<AcidReaction | null, void>(
  "reactions/fetchDraft",
  async () => {
    if (IS_GITHUB_PAGES) return null;

    try {
      const response = await api.api.acidsDraftList({ timeout: 1500 });
      return fromAcidDTO(response.data);
    } catch {
      // 404 — черновика нет; остальные ошибки также не блокируют форму
      return null;
    }
  }
);

export interface PublishReactionInput {
  id: number;
  acid_name: string;
  description: string;
  molar_mass: number;
  concentration: number;
}

// Публикация карточки: сохраняем поля в черновик и переводим draft → published.
export const publishReaction = createAsyncThunk<
  AcidReaction,
  PublishReactionInput,
  { rejectValue: string }
>("reactions/publishReaction", async (data, { rejectWithValue }) => {
  if (IS_GITHUB_PAGES) {
    return rejectWithValue(PAGES_DEMO_ERROR);
  }

  try {
    // POST /api/acids обновляет существующий черновик пользователя
    await api.api.acidsCreate({
      reaction_name: data.acid_name,
      acid_name: data.acid_name,
      acid_formula: "",
      molar_mass: data.molar_mass,
      concentration: data.concentration,
      calcium_carbonate_mass: 0,
      description: data.description,
    });

    const response = await api.api.acidsPublishUpdate(data.id);
    return fromAcidDTO(response.data);
  } catch {
    return rejectWithValue(
      "Не удалось опубликовать услугу. Попробуйте ещё раз."
    );
  }
});

// Удаление услуги — кодогенерация + thunk
export const deleteReaction = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("reactions/deleteReaction", async (id, { rejectWithValue }) => {
  if (IS_GITHUB_PAGES) {
    return rejectWithValue(PAGES_DEMO_ERROR);
  }

  try {
    await api.api.acidsDelete(id);
    return id;
  } catch {
    return rejectWithValue("Не удалось удалить услугу. Попробуйте ещё раз.");
  }
});

// Лайк/анлайк — кодогенерация + thunk
export const toggleReactionLike = createAsyncThunk<
  AcidReaction,
  AcidReaction,
  { rejectValue: string }
>("reactions/toggleReactionLike", async (reaction, { rejectWithValue }) => {
  if (IS_GITHUB_PAGES) {
    return rejectWithValue(PAGES_DEMO_ERROR);
  }

  try {
    const response = await api.api.acidsLikeCreate(reaction.id, {
      value: reaction.liked ? 0 : 1,
    });

    const liked = response.data.liked === 1;
    const likes =
      typeof response.data.like_count === "number"
        ? response.data.like_count
        : reaction.likes;

    return { ...reaction, liked, likes };
  } catch {
    return rejectWithValue("Не удалось обновить лайк. Попробуйте ещё раз.");
  }
});

const reactionsSlice = createSlice({
  name: "reactions",
  initialState,
  reducers: {
    setMassRange: (state, action: PayloadAction<[number, number]>) => {
      state.filters.massRange = action.payload;
    },
    // Сброс фильтров пользователя при выходе
    resetFilters: (state) => {
      state.filters = {
        massRange: [MIN_MOLAR_MASS, MAX_MOLAR_MASS],
      };
    },
    clearReactionsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReactions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.source = action.payload.source;
      })
      .addCase(fetchReactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Не удалось загрузить данные";
      })

      .addCase(createReaction.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createReaction.fulfilled, (state, action) => {
        state.saving = false;
        // Черновик не показываем в каталоге — он появится после публикации
        if (action.payload.status !== "черновик") {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createReaction.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Не удалось добавить услугу";
      })

      .addCase(publishReaction.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(publishReaction.fulfilled, (state, action) => {
        state.saving = false;
        state.items = [
          action.payload,
          ...state.items.filter((item) => item.id !== action.payload.id),
        ];
      })
      .addCase(publishReaction.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Не удалось опубликовать услугу";
      })

      .addCase(deleteReaction.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteReaction.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deleteReaction.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Не удалось удалить услугу";
      })

      // Лайк — тоже AJAX-запрос: на время выполнения блокируем интерфейс
      .addCase(toggleReactionLike.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(toggleReactionLike.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
      })
      .addCase(toggleReactionLike.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Не удалось обновить лайк";
      });
  },
});

export const { setMassRange, resetFilters, clearReactionsError } =
  reactionsSlice.actions;
export default reactionsSlice.reducer;
