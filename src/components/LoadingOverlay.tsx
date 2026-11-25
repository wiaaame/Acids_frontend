import { FC } from "react";
import { Spinner } from "react-bootstrap";
import "./LoadingOverlay.css";

interface Props {
  show: boolean;
  text?: string;
}

// Блокирующий анимационный слой: перекрывает экран и кнопки,
// пока выполняется AJAX-запрос (redux-thunk pending).
export const LoadingOverlay: FC<Props> = ({ show, text = "Загрузка..." }) => {
  if (!show) return null;

  return (
    <div className="loadingOverlay" role="status" aria-live="polite">
      <Spinner animation="border" className="loadingOverlaySpinner" />
      <span className="loadingOverlayText">{text}</span>
    </div>
  );
};

export default LoadingOverlay;
