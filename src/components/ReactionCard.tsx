import { FC, MouseEvent } from "react";
import { Card } from "react-bootstrap";
import { localAsset, toMediaUrl } from "../modules/media";
import { AcidReaction } from "../modules/types";
import "./ReactionCard.css";

// Путь учитывает base сборки (GitHub Pages: /acid_PWA/DefaultImage.svg)
const defaultImage = localAsset("DefaultImage.svg");

interface Props {
  reaction: AcidReaction;
  onClick: (id: number) => void;
  // Интерфейс гостя: лайк и удаление недоступны
  isAuthenticated: boolean;
  onLike: (reaction: AcidReaction) => void;
  onDelete: (id: number) => void;
  // Блокировка кнопок на время AJAX-запроса
  actionsDisabled?: boolean;
}

// Карточка для страницы «Плитка»: фото, характеристики, лайк и удаление
export const ReactionCard: FC<Props> = ({
  reaction,
  onClick,
  isAuthenticated,
  onLike,
  onDelete,
  actionsDisabled = false,
}) => {
  const stop = (e: MouseEvent) => e.stopPropagation();

  // Если поля не заполнены, показываем 0, а не скрываем строку:
  // так строки во всех плитках стоят на одном уровне.
  const molarMass = Number(reaction.molar_mass) || 0;
  const concentration = Number(reaction.concentration) || 0;

  return (
    <Card className="reactionCard" onClick={() => onClick(reaction.id)}>
      <Card.Img
        className="cardImage"
        variant="top"
        // Ссылки Silo/MinIO идут через прокси /s3, пустое поле — локальный ассет
        src={toMediaUrl(reaction.image_url) || defaultImage}
        alt={reaction.acid_name}
        onError={(event) => {
          event.currentTarget.src = defaultImage;
        }}
      />
      <Card.Body className="cardBody">
        <div className="cardName">
          {reaction.acid_name || reaction.reaction_name}
          {reaction.acid_formula ? ` — ${reaction.acid_formula}` : ""}
        </div>
        <div className="cardMeta">{molarMass} г/моль</div>
        <div className="cardMeta">Конц.: {concentration}%</div>

        {/* Переход к подробному экрану (клик по всей карточке) */}
        <div className="cardDetails">Подробнее →</div>

        <div className="cardActions">
          <button
            type="button"
            className={`cardLike ${reaction.liked ? "cardLikeActive" : ""}`}
            onClick={(e) => {
              stop(e);
              onLike(reaction);
            }}
            disabled={!isAuthenticated || actionsDisabled}
            title={
              isAuthenticated
                ? reaction.liked
                  ? "Убрать лайк"
                  : "Поставить лайк"
                : "Лайк доступен после входа"
            }
          >
            ❤ {reaction.likes}
          </button>

          {/* Удалять можно только свои услуги (is_mine с бэкенда) */}
          {isAuthenticated && reaction.is_mine && (
            <button
              type="button"
              className="cardDelete"
              onClick={(e) => {
                stop(e);
                onDelete(reaction.id);
              }}
              disabled={actionsDisabled}
              title="Удалить услугу"
            >
              Удалить
            </button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ReactionCard;
