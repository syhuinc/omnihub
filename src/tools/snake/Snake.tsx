import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { hapticTap, hapticSelect, hapticWarning } from '../../haptics';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { SNAKE_ASSETS } from '../../assets/snake';
import './Snake.css';

interface Point {
  x: number;
  y: number;
}

type Status = 'idle' | 'playing' | 'paused' | 'over';

const GRID_SIZE = 15;
const CELL_PCT = 100 / GRID_SIZE;
const SWIPE_THRESHOLD = 24;

const UP: Point = { x: 0, y: -1 };
const DOWN: Point = { x: 0, y: 1 };
const LEFT: Point = { x: -1, y: 0 };
const RIGHT: Point = { x: 1, y: 0 };

function initialSnake(): Point[] {
  const mid = Math.floor(GRID_SIZE / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

function randomFood(snake: Point[]): Point {
  let candidate: Point;
  do {
    candidate = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
  } while (snake.some((seg) => seg.x === candidate.x && seg.y === candidate.y));
  return candidate;
}

// Speeds up as the snake eats, like the original — floors out so it never
// becomes literally unplayable at a high score.
function speedForScore(score: number): number {
  const foodEaten = score / 10;
  return Math.max(70, 150 - foodEaten * 4);
}

// The sprites' native pose faces down (south) — rotate from there to match
// whichever way this segment is actually facing on the board.
function angleForDir(dir: Point): number {
  if (dir.y === 1) return 0;
  if (dir.y === -1) return 180;
  if (dir.x === -1) return 90;
  return -90;
}

function dirBetween(from: Point, to: Point): Point {
  return { x: Math.sign(to.x - from.x), y: Math.sign(to.y - from.y) };
}

export function Snake() {
  const { back } = useRouter();
  const [snake, setSnake] = useState<Point[]>(initialSnake);
  const [food, setFood] = useState<Point>(() => randomFood(initialSnake()));
  const [status, setStatus] = useState<Status>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => storageGet(StorageKeys.snakeHighScore, 0));
  const [isNewBest, setIsNewBest] = useState(false);

  // Mirrors of the latest values, read synchronously from the tick loop so
  // it never acts on a stale closure or a not-yet-committed React state.
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const scoreRef = useRef(score);
  const statusRef = useRef(status);
  const dirRef = useRef<Point>(RIGHT);
  const pendingDirRef = useRef<Point>(RIGHT);
  const touchStartRef = useRef<Point | null>(null);

  function setDirection(dir: Point) {
    if (statusRef.current === 'idle') {
      startGame(dir);
      return;
    }
    if (statusRef.current !== 'playing') return;
    pendingDirRef.current = dir;
    hapticSelect();
  }

  function tick() {
    const cur = dirRef.current;
    const pending = pendingDirRef.current;
    // Ignore a queued 180-degree reversal — turning straight into your own
    // neck would end the game on a move the player didn't really choose.
    if (!(pending.x === -cur.x && pending.y === -cur.y)) {
      dirRef.current = pending;
    }
    const dir = dirRef.current;
    const head = snakeRef.current[0];
    const newHead: Point = { x: head.x + dir.x, y: head.y + dir.y };

    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      endGame();
      return;
    }

    const willGrow = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;
    const body = willGrow ? snakeRef.current : snakeRef.current.slice(0, -1);
    if (body.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
      endGame();
      return;
    }

    const newSnake = [newHead, ...snakeRef.current];
    if (!willGrow) newSnake.pop();
    snakeRef.current = newSnake;
    setSnake(newSnake);

    if (willGrow) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      hapticSelect();
      const nextFood = randomFood(newSnake);
      foodRef.current = nextFood;
      setFood(nextFood);
    }
  }

  useEffect(() => {
    if (status !== 'playing') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    function loop() {
      if (cancelled) return;
      tick();
      if (statusRef.current !== 'playing') return;
      timer = setTimeout(loop, speedForScore(scoreRef.current));
    }
    timer = setTimeout(loop, speedForScore(scoreRef.current));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function startGame(dir: Point = RIGHT) {
    hapticTap();
    const snakeStart = initialSnake();
    const foodStart = randomFood(snakeStart);
    dirRef.current = dir;
    pendingDirRef.current = dir;
    scoreRef.current = 0;
    snakeRef.current = snakeStart;
    foodRef.current = foodStart;
    setSnake(snakeStart);
    setFood(foodStart);
    setScore(0);
    setIsNewBest(false);
    setStatusBoth('playing');
  }

  function endGame() {
    hapticWarning();
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      storageSet(StorageKeys.snakeHighScore, scoreRef.current);
      setIsNewBest(true);
    }
    setStatusBoth('over');
  }

  function setStatusBoth(next: Status) {
    statusRef.current = next;
    setStatus(next);
  }

  function togglePause() {
    if (status === 'playing') {
      hapticTap();
      setStatusBoth('paused');
    } else if (status === 'paused') {
      hapticTap();
      setStatusBoth('playing');
    }
  }

  function handleTouchStart(e: ReactTouchEvent) {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: ReactTouchEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? RIGHT : LEFT);
    } else {
      setDirection(dy > 0 ? DOWN : UP);
    }
  }

  return (
    <div className="screen sn">
      <ScreenHeader
        title="Snake"
        subtitle="Swipe or use the pad to steer."
        onBack={back}
        action={
          status === 'playing' || status === 'paused' ? (
            <button type="button" className="sn__pause-btn" onClick={togglePause} aria-label={status === 'paused' ? 'Resume' : 'Pause'}>
              <img src={status === 'paused' ? SNAKE_ASSETS.iconPlay : SNAKE_ASSETS.iconPause} alt="" />
            </button>
          ) : undefined
        }
      />

      <div className="sn__body">
        <div className="sn__stats">
          <div className="sn__stat">
            <span className="sn__stat-label">Score</span>
            <span className="sn__stat-value">{score}</span>
          </div>
          <div className="sn__stat sn__stat--best">
            <Icon name="star" size={14} />
            <span className="sn__stat-label">Best</span>
            <span className="sn__stat-value">{highScore}</span>
          </div>
        </div>

        <div className="sn__board-wrap" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="sn__board">
            {snake.map((seg, i) => {
              const isHead = i === 0;
              const isTail = i === snake.length - 1;
              const sprite = isHead ? SNAKE_ASSETS.head : isTail ? SNAKE_ASSETS.tail : SNAKE_ASSETS.body;
              const dir = isHead ? dirRef.current : dirBetween(seg, snake[i - 1]);
              return (
                <div
                  key={i}
                  className="sn__seg"
                  style={{
                    left: `${seg.x * CELL_PCT}%`,
                    top: `${seg.y * CELL_PCT}%`,
                    width: `${CELL_PCT}%`,
                    height: `${CELL_PCT}%`,
                    backgroundImage: `url(${sprite})`,
                    transform: `rotate(${angleForDir(dir)}deg)`,
                  }}
                />
              );
            })}
            <div
              className="sn__food"
              style={{
                left: `${food.x * CELL_PCT}%`,
                top: `${food.y * CELL_PCT}%`,
                width: `${CELL_PCT}%`,
                height: `${CELL_PCT}%`,
                backgroundImage: `url(${SNAKE_ASSETS.egg})`,
              }}
            />
          </div>

          {status !== 'playing' && (
            <div className="sn__overlay">
              {status === 'idle' && (
                <>
                  <span className="sn__overlay-icon">
                    <Icon name="gamepad" size={30} />
                  </span>
                  <p className="sn__overlay-title">Ready?</p>
                  <p className="sn__overlay-hint">Swipe or tap the pad to move</p>
                  <button type="button" className="sn__cta-btn" onClick={() => startGame()}>
                    <img src={SNAKE_ASSETS.btnPlay} alt="Tap to Start" />
                  </button>
                  {highScore > 0 && <p className="sn__overlay-best">Best: {highScore}</p>}
                </>
              )}
              {status === 'paused' && (
                <>
                  <span className="sn__overlay-icon">
                    <Icon name="pause" size={30} />
                  </span>
                  <p className="sn__overlay-title">Paused</p>
                  <button type="button" className="sn__cta-btn" onClick={togglePause}>
                    <img src={SNAKE_ASSETS.btnPlay} alt="Resume" />
                  </button>
                </>
              )}
              {status === 'over' && (
                <>
                  <p className="sn__overlay-title">Game Over</p>
                  <p className="sn__overlay-score">Score: {score}</p>
                  {isNewBest && <p className="sn__overlay-best sn__overlay-best--new">New Best!</p>}
                  <div className="sn__cta-row">
                    <button type="button" className="sn__cta-btn" onClick={() => startGame()}>
                      <img src={SNAKE_ASSETS.btnRestart} alt="Play Again" />
                    </button>
                    <button type="button" className="sn__cta-btn" onClick={back}>
                      <img src={SNAKE_ASSETS.btnHome} alt="Home" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="sn__pad">
          <button type="button" className="sn__pad-btn sn__pad-btn--up" onClick={() => setDirection(UP)} aria-label="Up">
            <Icon name="chevron-right" size={22} />
          </button>
          <button type="button" className="sn__pad-btn sn__pad-btn--left" onClick={() => setDirection(LEFT)} aria-label="Left">
            <Icon name="chevron-right" size={22} />
          </button>
          <span className="sn__pad-center" />
          <button type="button" className="sn__pad-btn sn__pad-btn--right" onClick={() => setDirection(RIGHT)} aria-label="Right">
            <Icon name="chevron-right" size={22} />
          </button>
          <button type="button" className="sn__pad-btn sn__pad-btn--down" onClick={() => setDirection(DOWN)} aria-label="Down">
            <Icon name="chevron-right" size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
