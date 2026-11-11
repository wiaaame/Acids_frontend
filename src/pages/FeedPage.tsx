import "./FeedPage.css";
import { FC, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { getAcidReactions } from "../modules/mock";
import { AcidReaction } from "../modules/types";
import { FeedItem } from "../components/FeedItem";
import { AppOutletContext } from "../AppLayout";

// Страница «Лента»: одна реакция на весь экран (как в TikTok), без списка
// и без заголовка. Кнопка «Следующий» листает реакции по кругу
const FeedPage: FC = () => {
  const [reactions, setReactions] = useState<AcidReaction[]>([]);
  const [loading, setLoading] = useState(true);
  // Индекс текущей реакции, показываемой в ленте
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setCards } = useOutletContext<AppOutletContext>();
  // id реакции, выбранной на странице «Плитка»
  const [searchParams] = useSearchParams();
  const selectedId = Number(searchParams.get("id"));

  // useEffect — загрузка данных из mock-коллекции при монтировании компонента
  useEffect(() => {
    getAcidReactions().then((data) => {
      setReactions(data.results);
      setCards(data.results);
      setLoading(false);
    });
  }, [setCards]);

  // useEffect — переход из «Плитки»: показать реакцию с ?id=...
  useEffect(() => {
    if (!reactions.length) return;
    const idx = reactions.findIndex((r) => r.id === selectedId);
    setCurrentIndex(idx >= 0 ? idx : 0);
  }, [selectedId, reactions.length]);

  // «Следующий» — переход к следующей реакции (по кругу)
  const handleNext = () => {
    setCurrentIndex((i) => (reactions.length ? (i + 1) % reactions.length : 0));
  };

  return (
    <div className="feedPage">
      {loading ? (
        <div className="pageLoader">
          <Spinner animation="border" />
        </div>
      ) : reactions.length ? (
        <div className="feedList">
          {/* key — сброс isExpanded/лайка при смене реакции */}
          <FeedItem
            key={reactions[currentIndex].id}
            reaction={reactions[currentIndex]}
            onNext={handleNext}
          />
        </div>
      ) : (
        <div className="pageLoader">Реакций пока нет</div>
      )}
    </div>
  );
};

export default FeedPage;
