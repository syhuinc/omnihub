const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

export function DiceFace({ value, sides = 6, tilt = 0 }: { value: number; sides?: number; tilt?: number }) {
  if (sides === 6) {
    const pips = PIP_POSITIONS[value] ?? [];
    return (
      <div className="dice-face" style={{ transform: `rotate(${tilt}deg)` }}>
        {Array.from({ length: 9 }, (_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const active = pips.some(([r, c]) => r === row && c === col);
          return <span key={i} className={`dice-face__pip${active ? ' dice-face__pip--on' : ''}`} />;
        })}
      </div>
    );
  }

  return (
    <div className="dice-face dice-face--numeral" style={{ transform: `rotate(${tilt}deg)` }}>
      <span className="dice-face__value">{value}</span>
      <span className="dice-face__sides">d{sides}</span>
    </div>
  );
}
