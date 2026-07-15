import { useEffect, useMemo, useState } from "react";

// Cell shape functions that return JSX instead of SVG strings
const Cell1 = ({ colors }) => (
  <circle cx="50" cy="50" r="9.44" fill={colors[0]} fillRule="evenodd" />
);

const Cell2 = ({ colors, strokeWidth }) => (
  <>
    <line x1="25" x2="75" y1="25" y2="25" stroke={colors[0]} strokeWidth={strokeWidth} />
    <line x1="25" x2="75" y1="50" y2="50" stroke={colors[0]} strokeWidth={strokeWidth} />
    <line x1="25" x2="75" y1="75" y2="75" stroke={colors[0]} strokeWidth={strokeWidth} />
  </>
);

const Cell3 = ({ colors, strokeWidth }) => (
  <>
    <line x1="25" x2="75" y1="25" y2="75" stroke={colors[0]} strokeWidth={strokeWidth} />
    <line x1="25" x2="75" y1="75" y2="25" stroke={colors[0]} strokeWidth={strokeWidth} />
  </>
);

const Cell4 = ({ colors, strokeWidth }) => (
  <rect
    width="50"
    height="50"
    x="25"
    y="25"
    fill="none"
    stroke={colors[0]}
    strokeWidth={strokeWidth}
  />
);

const Cell5 = ({ colors, strokeWidth }) => (
  <line x1="25" x2="75" y1="75" y2="25" fill="none" stroke={colors[0]} strokeWidth={strokeWidth} />
);

const Cell6 = () => null;

const Cell7 = () => <rect width="75" height="75" x="12.5" y="12.5" fill="rgba(255,255,255,0.1)" />;

// Simple seeded random number generator
const seedPRNG = (seed) => {
  let seedValue = seed;
  return () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };
};

const shapesConfig = [
  { shape: Cell1, weight: 1 },
  { shape: Cell2, weight: 1 },
  { shape: Cell3, weight: 1 },
  { shape: Cell4, weight: 1 },
  { shape: Cell5, weight: 1 },
  { shape: Cell6, weight: 5 },
  { shape: Cell7, weight: 3 },
];

// Create weighted selector
const createWeightedSelector = (items, seededRandom) => {
  const weightedArray = [];

  for (const item of items) {
    for (let i = 0; i < item.weight; i++) {
      weightedArray.push(item);
    }
  }

  return () =>
    weightedArray[Math.floor(seededRandom() * weightedArray.length)] ?? items[0];
};

const Shape = ({
  x,
  y,
  colors,
  strokeWidth,
  scale,
  shapeId,
  minInterval = 0,
  maxInterval = 5000,
}) => {
  const [currentShape, setCurrentShape] = useState(() => {
    const seededRandom = seedPRNG(Math.random() * 1000);
    const pickShape = createWeightedSelector(shapesConfig, seededRandom);
    return pickShape();
  });

  useEffect(() => {
    const getRandomInterval = () => Math.random() * (maxInterval - minInterval) + minInterval;

    const updateShape = () => {
      const seededRandom = seedPRNG(Math.random() * 1000);
      const pickShape = createWeightedSelector(shapesConfig, seededRandom);
      setCurrentShape(pickShape());
    };

    let timeoutId = setTimeout(() => {
      updateShape();

      const setNextTimeout = () => {
        timeoutId = setTimeout(() => {
          updateShape();
          setNextTimeout();
        }, getRandomInterval());
      };

      setNextTimeout();
    }, getRandomInterval());

    return () => clearTimeout(timeoutId);
  }, [minInterval, maxInterval]);

  const ShapeComponent = currentShape.shape;

  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`scale(${scale})`}>
        <ShapeComponent colors={colors} strokeWidth={strokeWidth} />
      </g>
    </g>
  );
};

export const BackgroundShapes = ({
  width = 500,
  height = 500,
  cellSize = 20,
  strokeWidth = 10,
  colors = ["white"],
  className = "",
  minInterval = 1000,
  maxInterval = 5000,
}) => {
  const borderSize = cellSize * 2;
  const scale = 0.2;
  const colorsKey = colors.join("|");

  const shapes = useMemo(() => {
    const list = [];
    for (let x = borderSize; x < width / 2; x += cellSize) {
      for (let y = borderSize; y < height - borderSize; y += cellSize) {
        list.push(
          <Shape
            key={`left-${x}-${y}`}
            x={x}
            y={y}
            colors={colors}
            strokeWidth={strokeWidth}
            scale={scale}
            shapeId={`left-${x}-${y}`}
            minInterval={minInterval}
            maxInterval={maxInterval}
          />,
          <Shape
            key={`right-${x}-${y}`}
            x={width - cellSize - x}
            y={y}
            colors={colors}
            strokeWidth={strokeWidth}
            scale={scale}
            shapeId={`right-${x}-${y}`}
            minInterval={minInterval}
            maxInterval={maxInterval}
          />,
        );
      }
    }
    return list;
  }, [width, height, cellSize, strokeWidth, colorsKey, borderSize, minInterval, maxInterval]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      {shapes}
    </svg>
  );
};

export default BackgroundShapes;
