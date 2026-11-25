import "./FeedPage.css";
import { FC, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { AcidReaction } from "../modules/types";
import { FeedItem } from "../components/FeedItem";
import LoadingOverlay from "../components/LoadingOverlay";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchReactions,
  toggleReactionLike,
} from "../store/slices/reactionsSlice";

// Страница «Лента»: одна реакция на весь экран (как в TikTok).
// Название реакции (reaction_name) выводится текстом в самой карточке ленты.
// Данные и лайки — через Redux Toolkit + redux-thunk.
const FeedPage: FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, saving } = useAppSelector((state) => state.reactions);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);

  // В ленте показываем только опубликованные услуги:
  // черновики и логически удалённые записи клиенту недоступны.
  const visibleItems = items.filter(
    (item) => item.status !== "черновик" && item.status !== "удален"
  );

  // Индекс текущей реакции, показываемой в ленте
  const [currentIndex, setCurrentIndex] = useState(0);
  // id реакции, выбранной на странице «Плитка»
  const [searchParams] = useSearchParams();
  const selectedId = Number(searchParams.get("id"));

  // Запрос к веб-сервису (thunk) при монтировании страницы
  useEffect(() => {
    dispatch(fetchReactions());
  }, [dispatch]);

  // Переход из «Плитки»: показать реакцию с ?id=...
  useEffect(() => {
    if (!visibleItems.length) return;
    const idx = visibleItems.findIndex((r) => r.id === selectedId);
    setCurrentIndex(idx >= 0 ? idx : 0);
  }, [selectedId, visibleItems.length]);

  // После удаления список может стать короче — не выходим за границы
  useEffect(() => {
    if (visibleItems.length && currentIndex >= visibleItems.length) {
      setCurrentIndex(0);
    }
  }, [visibleItems.length, currentIndex]);

  // «Следующий» — переход к следующей реакции (по кругу)
  const handleNext = () => {
    setCurrentIndex((i) =>
      visibleItems.length ? (i + 1) % visibleItems.length : 0
    );
  };

  // Лайк доступен только авторизованному пользователю
  const handleLike = (reaction: AcidReaction) => {
    if (!isAuthenticated) return;
    dispatch(toggleReactionLike(reaction));
  };

  return (
    <div className="feedPage">
      {loading && !visibleItems.length ? (
        <div className="pageLoader">
          <Spinner animation="border" />
        </div>
      ) : visibleItems.length ? (
        <div className="feedList">
          {/* key — сброс isExpanded/лайка при смене реакции */}
          <FeedItem
            key={(visibleItems[currentIndex] ?? visibleItems[0]).id}
            reaction={visibleItems[currentIndex] ?? visibleItems[0]}
            onNext={handleNext}
            isAuthenticated={isAuthenticated}
            onLike={handleLike}
            actionsDisabled={saving}
          />
        </div>
      ) : (
        <div className="pageLoader">Реакций пока нет</div>
      )}

      {/* Блокирующая анимация на время любого AJAX-запроса (загрузка, лайк) */}
      <LoadingOverlay
        show={loading || saving}
        text={saving ? "Сохранение..." : "Загрузка..."}
      />
    </div>
  );
};

export default FeedPage;
