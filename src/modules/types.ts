// Типы данных приложения "Кислоты и реакции"

// Поля коллекции услуг (реакций):
// id, reaction_name, acid_name, acid_formula, molar_mass,
// concentration, calcium_carbonate_mass, description, status,
// image_url, video_url, likes, created_at
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
}

export interface AcidReactionsResult {
  count: number;
  results: AcidReaction[];
}
