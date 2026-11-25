import type { InternalApiAcidDTO } from "../api/Api";
import type { AcidReaction } from "./types";

// Статусы бэкенда → статусы интерфейса
const STATUS_MAP: Record<string, string> = {
  draft: "черновик",
  published: "проверено",
  deleted: "удален",
};

// DTO веб-сервиса → карточка интерфейса
export const fromAcidDTO = (dto: InternalApiAcidDTO): AcidReaction => ({
  id: dto.id ?? 0,
  reaction_name: dto.reaction_name ?? "",
  acid_name: dto.acid_name ?? "",
  acid_formula: dto.acid_formula ?? "",
  molar_mass: dto.molar_mass ?? 0,
  concentration: dto.concentration ?? 0,
  calcium_carbonate_mass: dto.calcium_carbonate_mass ?? 0,
  description: dto.description ?? "",
  status: STATUS_MAP[dto.status ?? ""] ?? dto.status ?? "",
  image_url: dto.image_url ?? "",
  video_url: dto.video_url ?? "",
  likes: dto.like_count ?? 0,
  created_at: dto.created_at ?? "",
  liked: dto.liked === 1,
  is_mine: dto.is_mine === 1,
  creator_name: dto.creator_name ?? "",
});
