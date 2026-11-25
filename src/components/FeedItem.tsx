import { FC, useState } from "react";
import { localAsset, toMediaUrl } from "../modules/media";
import { AcidReaction } from "../modules/types";
import "./FeedItem.css";

// Пути учитывают base сборки (GitHub Pages: /acid_PWA/...)
const defaultImage = localAsset("DefaultImage.svg"); // постер по умолчанию
const defaultVideo = localAsset("DefaultVideo.mp4"); // видео по умолчанию

interface Props {
  reaction: AcidReaction;
  // «След» — показать следующую реакцию в ленте
  onNext: () => void;
  // Интерфейс гостя: лайк недоступен
  isAuthenticated: boolean;
  onLike: (reaction: AcidReaction) => void;
  // Блокировка кнопок на время AJAX-запроса
  actionsDisabled?: boolean;
}

// Элемент ленты — одна полноэкранная карточка (как в TikTok):
// видео на всю ширину, заголовок кислоты крупным шрифтом, текст поверх,
// мелкие квадратные чипы М.м. и Конц., справа — лайк (для авторизованного
// пользователя) и кнопка-иконка «След» (всегда видима)
export const FeedItem: FC<Props> = ({
  reaction,
  onNext,
  isAuthenticated,
  onLike,
  actionsDisabled = false,
}) => {
  // Раскрыт ли текст описания (по умолчанию — свёрнут до 2 строк)
  const [isExpanded, setIsExpanded] = useState(false);
  // Ссылка на видео: если ключа нет или объект в Silo не найден,
  // сначала подставляем DefaultVideo.mp4, и только если и он не
  // загрузился — показываем постер/DefaultImage.svg.
  const [videoSrc, setVideoSrc] = useState(
    toMediaUrl(reaction.video_url) || defaultVideo
  );
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="feedItem">
      <div className="feedMedia">
        {/* Медиа из карточки: видео из ссылки, затем DefaultVideo.mp4,
            и только потом постер/DefaultImage.svg. */}
        {!videoFailed ? (
          <video
            className="feedMediaContent"
            src={videoSrc}
            poster={toMediaUrl(reaction.image_url) || defaultImage}
            autoPlay
            muted
            loop
            playsInline
            onError={() => {
              if (videoSrc !== defaultVideo) {
                setVideoSrc(defaultVideo);
              } else {
                setVideoFailed(true);
              }
            }}
          />
        ) : (
          <img
            className="feedMediaContent"
            src={toMediaUrl(reaction.image_url) || defaultImage}
            alt={reaction.reaction_name}
            onError={(event) => {
              event.currentTarget.src = defaultImage;
            }}
          />
        )}

        {/* Правая панель, как в TikTok: лайк, «→» и чипы М.м./Конц. */}
        <div className="feedActions">
          <button
            type="button"
            className={`feedActionBtn ${reaction.liked ? "feedLikeActive" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
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
            <span className="feedActionIcon">❤</span>
            <span className="feedActionCount">{reaction.likes}</span>
          </button>

          <button
            className="feedNextBtn"
            aria-label="Следующая реакция"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            →
          </button>

          {/* Чипы М.м. и Конц. — под кнопкой «→», друг под друга */}
          <div className="feedStats">
            <div className="feedStatChip">
              <span className="feedStatLabel">М.м.</span>
              <span className="feedStatValue">{reaction.molar_mass}</span>
            </div>
            <div className="feedStatChip">
              <span className="feedStatLabel">Конц.</span>
              <span className="feedStatValue">{reaction.concentration}%</span>
            </div>
          </div>
        </div>

        {/* Градиентный оверлей: заголовок, свёрнутый текст, кнопка раскрытия */}
        <div className="feedOverlay">
          {(reaction.acid_name || reaction.acid_formula) && (
            <div className="feedAcid">
              {reaction.acid_name}
              {reaction.acid_name && reaction.acid_formula ? " " : ""}
              {reaction.acid_formula ? `(${reaction.acid_formula})` : ""}
            </div>
          )}

          {/* Клик по тексту: разворачивает/сворачивает описание */}
          <p
            className={`feedDescription ${
              isExpanded ? "feedDescriptionExpanded" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
          >
            {reaction.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedItem;
