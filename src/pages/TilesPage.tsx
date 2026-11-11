import "./TilesPage.css";
import { FC, useEffect, useMemo, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getAcidReactions } from "../modules/mock";
import { AcidReaction } from "../modules/types";
import { ReactionCard } from "../components/ReactionCard";
import { DualRangeSlider } from "../components/DualRangeSlider";
import { AppOutletContext } from "../AppLayout";

// Границы двойного ползунка по молярной массе, г/моль
const MIN_MASS = 0;
const MAX_MASS = 200;

// Страница «Плитка»: каталог карточек с единственным фильтром —
// двойным ползунком по диапазону молярной массы.
// Клик по карточке открывает реакцию в ленте
const TilesPage: FC = () => {
  const [reactions, setReactions] = useState<AcidReaction[]>([]);
  const [loading, setLoading] = useState(true);
  // Диапазон двойного ползунка по молярной массе [от, до]
  const [massRange, setMassRange] = useState<[number, number]>([
    MIN_MASS,
    MAX_MASS,
  ]);

  const { setCards } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();

  // useEffect — первичная загрузка mock-данных (монтирование компонента)
  useEffect(() => {
    getAcidReactions().then((data) => {
      setReactions(data.results);
      setCards(data.results);
      setLoading(false);
    });
  }, [setCards]);

  // useMemo — фильтрация пересчитывается только при изменении
  // reactions или massRange
  const filtered = useMemo(() => {
    const [lo, hi] = massRange;
    // Двойной ползунок: молярная масса внутри выбранного диапазона
    return reactions.filter(
      (item) => item.molar_mass >= lo && item.molar_mass <= hi
    );
  }, [reactions, massRange]);

  useEffect(() => {
    setCards(filtered);
  }, [filtered, setCards]);

  // Клик по карточке — переход в ленту с выбранной реакцией
  const handleCardClick = (id: number) => {
    navigate(`/?id=${id}`);
  };

  return (
    <div className="tilesPage">
      <h1 className="pageTitle">Каталог реакций</h1>

      {/* Единственный фильтр — двойной ползунок по молярной массе */}
      <div className="massRangeLabels">
        <span>
          Молярная масса: от {massRange[0]} до {massRange[1]} г/моль
        </span>
      </div>
      <DualRangeSlider
        min={MIN_MASS}
        max={MAX_MASS}
        value={massRange}
        onChange={setMassRange}
      />

      {loading ? (
        <div className="pageLoader">
          <Spinner animation="border" />
        </div>
      ) : !filtered.length ? (
        <div className="emptyState">
          <h5>Ничего не найдено :(</h5>
          <p>Попробуйте изменить диапазон фильтра</p>
        </div>
      ) : (
        <div className="tilesGrid">
          {filtered.map((item) => (
            <ReactionCard
              key={item.id}
              reaction={item}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TilesPage;
