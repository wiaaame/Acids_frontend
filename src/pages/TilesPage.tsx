import "./TilesPage.css";
import { FC, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ReactionCard } from "../components/ReactionCard";
import { DualRangeSlider } from "../components/DualRangeSlider";
import LoadingOverlay from "../components/LoadingOverlay";
import { AcidReaction } from "../modules/types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  MAX_MOLAR_MASS,
  MIN_MOLAR_MASS,
  deleteReaction,
  fetchReactions,
  setMassRange,
  toggleReactionLike,
} from "../store/slices/reactionsSlice";

// Страница «Плитка»: каталог карточек с единственным фильтром —
// по диапазону молярной массы. Значения фильтра хранятся в Redux
// и уходят в запрос к бэкенду как min/max (GET /api/acids).
const TilesPage: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items, filters, loading, saving } = useAppSelector(
    (state) => state.reactions
  );
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);

  // В каталоге показываем только опубликованные услуги:
  // черновики и логически удалённые записи клиенту недоступны.
  const visibleItems = items.filter(
    (item) => item.status !== "черновик" && item.status !== "удален"
  );

  // Автоматического поиска нет: список загружается только по кнопке.
  // Флаг нужен, чтобы отличить «ещё не искали» от «ничего не найдено».
  const [hasSearched, setHasSearched] = useState(false);

  // Кнопка «Найти» применяет выбранный диапазон молярной массы:
  // значения уже лежат в Redux, остаётся выполнить запрос к веб-сервису.
  const handleSearch = () => {
    setHasSearched(true);
    dispatch(fetchReactions());
  };

  // Клик по карточке — переход в ленту с выбранной реакцией
  const handleCardClick = (id: number) => {
    navigate(`/?id=${id}`);
  };

  const handleLike = (reaction: AcidReaction) => {
    if (!isAuthenticated) return;
    dispatch(toggleReactionLike(reaction));
  };

  const handleDelete = (id: number) => {
    if (!isAuthenticated) return;
    if (window.confirm("Удалить эту услугу?")) {
      dispatch(deleteReaction(id));
    }
  };

  return (
    <div className="tilesPage">
      <h1 className="pageTitle">Каталог реакций</h1>

      {/* Единственный фильтр — по молярной массе */}
      <div className="massFilter">
        <div className="massRangeLabels">
          <span>Молярная масса</span>
          <span className="massRangeValue">
            {filters.massRange[0]}–{filters.massRange[1]} г/моль
          </span>
        </div>
        <DualRangeSlider
          min={MIN_MOLAR_MASS}
          max={MAX_MOLAR_MASS}
          value={filters.massRange}
          onChange={(value) => dispatch(setMassRange(value))}
        />

        {/* Кнопка того же цвета, что и «Войти» на странице авторизации */}
        <button
          type="button"
          className="massSearchBtn"
          onClick={handleSearch}
          disabled={loading}
        >
          Найти
        </button>
      </div>

      {loading && !visibleItems.length ? (
        <div className="pageLoader">
          <Spinner animation="border" />
        </div>
      ) : !visibleItems.length && !hasSearched ? (
        <div className="emptyState">
          <h5>Нажмите «Найти»</h5>
          <p>Выберите диапазон молярной массы и запустите поиск</p>
        </div>
      ) : !visibleItems.length ? (
        <div className="emptyState">
          <h5>Ничего не найдено :(</h5>
          <p>Попробуйте изменить диапазон молярной массы</p>
        </div>
      ) : (
        <div className="tilesGrid">
          {visibleItems.map((item) => (
            <ReactionCard
              key={item.id}
              reaction={item}
              onClick={handleCardClick}
              isAuthenticated={isAuthenticated}
              onLike={handleLike}
              onDelete={handleDelete}
              actionsDisabled={saving}
            />
          ))}
        </div>
      )}

      {/* Блокирующая анимация на время AJAX-запроса */}
      <LoadingOverlay
        show={loading || saving}
        text={saving ? "Сохранение..." : "Загрузка..."}
      />
    </div>
  );
};

export default TilesPage;
