import { FC, useState } from "react";
import { AcidReaction } from "../modules/types";
import "./FeedItem.css";

const defaultVideo = "/DefaultVideo.mp4"; // видео по умолчанию
const defaultImage = "/DefaultImage.png"; // изображение по умолчанию (постер)

interface Props {
  reaction: AcidReaction;
  // «След» — показать следующую реакцию в ленте
  onNext: () => void;
}

// Элемент ленты — одна полноэкранная карточка (как в TikTok):
// видео на всю ширину, заголовок кислоты крупным шрифтом, текст поверх,
// мелкие квадратные чипы М.м. и Конц., справа — иконка лайка (только
// отображение, ставить лайк нельзя) и кнопка-иконка «След» (всегда видима)
export const FeedItem: FC<Props> = ({ reaction, onNext }) => {
  // Раскрыт ли текст описания (по умолчанию — свёрнут до 2 строк)
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="feedItem">
      <div className="feedMedia">
        {/* Видео: если поле пустое — видео по умолчанию, постер — фото */}
        <video
          className="feedMediaContent"
          src={reaction.video_url || defaultVideo}
          poster={reaction.image_url || defaultImage}
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Правая панель, как в TikTok: лайк (без клика), «→» и чипы М.м./Конц. */}
        <div className="feedActions">
          <div className="feedActionBtn feedLikeStatic">
            <span className="feedActionIcon">❤</span>
            <span className="feedActionCount">{reaction.likes}</span>
          </div>

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
          <div className="feedAcid">
            {reaction.acid_name} ({reaction.acid_formula})
          </div>

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
