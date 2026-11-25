import { FC } from "react";
import "./DualRangeSlider.css";

interface Props {
  min: number;
  max: number;
  step?: number;
  // Текущий выбранный диапазон [от, до]
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

// Двойной ползунок: два наложенных <input type="range">
// с подсветкой выбранного диапазона на общем треке
export const DualRangeSlider: FC<Props> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
}) => {
  const [lo, hi] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div className="dualRange">
      <div className="dualRangeTrack" />
      <div
        className="dualRangeFill"
        style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
      />
      {/* Левый (минимальный) бегунок */}
      <input
        type="range"
        className="dualRangeInput"
        min={min}
        max={max}
        step={step}
        value={lo}
        onChange={(e) =>
          onChange([Math.min(Number(e.target.value), hi), hi])
        }
      />
      {/* Правый (максимальный) бегунок */}
      <input
        type="range"
        className="dualRangeInput"
        min={min}
        max={max}
        step={step}
        value={hi}
        onChange={(e) =>
          onChange([lo, Math.max(Number(e.target.value), lo)])
        }
      />
    </div>
  );
};

export default DualRangeSlider;
