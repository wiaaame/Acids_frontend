import { FC } from "react";
import { Card } from "react-bootstrap";
import { AcidReaction } from "../modules/types";
import "./ReactionCard.css";

const defaultImage = "/DefaultImage.png"; // изображение по умолчанию

interface Props {
  reaction: AcidReaction;
  onClick: (id: number) => void;
}

// Карточка для страницы «Плитка»: фото + молярная масса, лайки, концентрация
export const ReactionCard: FC<Props> = ({ reaction, onClick }) => {
  return (
    <Card className="reactionCard" onClick={() => onClick(reaction.id)}>
      <Card.Img
        className="cardImage"
        variant="top"
        src={reaction.image_url || defaultImage} // если поле пустое — дефолтная картинка
        alt={reaction.acid_name}
      />
      <Card.Body className="cardBody">
        <div className="cardName">{reaction.acid_name}</div>
        <div className="cardMeta">М.м.: {reaction.molar_mass} г/моль</div>
        <div className="cardMeta">Конц.: {reaction.concentration}%</div>
        <div className="cardLikes">❤ {reaction.likes}</div>
      </Card.Body>
    </Card>
  );
};

export default ReactionCard;
