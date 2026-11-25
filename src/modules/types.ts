// Типы данных приложения "Кислоты и реакции"

// Карточка услуги в интерфейсе. Поля приведены к виду, который
// используют компоненты, а статусы бэкенда (draft/published/deleted)
// переведены в русские значения в acidMapper.ts.
export interface AcidReaction {
  id: number;
  reaction_name: string;
  acid_name: string;
  acid_formula: string;
  molar_mass: number;
  concentration: number;
  calcium_carbonate_mass: number;
  description: string;
  status: string;
  image_url: string;
  video_url: string;
  likes: number;
  created_at: string;
  /** Признак лайка текущего пользователя */
  liked?: boolean;
  /** Услуга создана текущим пользователем (можно удалять) */
  is_mine?: boolean;
  creator_name?: string;
}

// Данные формы добавления услуги
export interface AcidReactionCreate {
  acid_name: string;
  description?: string;
  molar_mass?: number;
  concentration?: number;
  image?: File | null;
  video?: File | null;
}

export interface AcidReactionsResult {
  count: number;
  results: AcidReaction[];
}
