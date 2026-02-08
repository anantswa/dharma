import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

type Entity = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Invader = Entity & {
  id: number;
  points: number;
  alive: boolean;
};

const GAME_WIDTH = Math.min(420, Dimensions.get('window').width - 20);
const GAME_HEIGHT = 680;
const PLAYER_WIDTH = 52;
const PLAYER_HEIGHT = 20;
const PLAYER_Y = GAME_HEIGHT - 60;
const PLAYER_SPEED = 240;
const BULLET_SPEED = 430;
const ENEMY_BULLET_SPEED = 280;
const INVADER_ROWS = 5;
const INVADER_COLS = 11;
const INVADER_WIDTH = 24;
const INVADER_HEIGHT = 18;
const INVADER_GAP_X = 8;
const INVADER_GAP_Y = 10;
const INVADER_START_X = 30;
const INVADER_START_Y = 70;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const intersects = (a: Entity, b: Entity) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

function buildInvaders(): Invader[] {
  const invaders: Invader[] = [];
  let id = 0;

  for (let row = 0; row < INVADER_ROWS; row += 1) {
    for (let col = 0; col < INVADER_COLS; col += 1) {
      let points = 10;
      if (row < 1) points = 30;
      else if (row < 3) points = 20;

      invaders.push({
        id,
        points,
        alive: true,
        x: INVADER_START_X + col * (INVADER_WIDTH + INVADER_GAP_X),
        y: INVADER_START_Y + row * (INVADER_HEIGHT + INVADER_GAP_Y),
        width: INVADER_WIDTH,
        height: INVADER_HEIGHT,
      });
      id += 1;
    }
  }

  return invaders;
}

export default function App() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [message, setMessage] = useState('Press SPACE to start');
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  const playerRef = useRef<Entity>({
    x: (GAME_WIDTH - PLAYER_WIDTH) / 2,
    y: PLAYER_Y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });
  const bulletRef = useRef<Entity | null>(null);
  const enemyBulletRef = useRef<Entity | null>(null);
  const invadersRef = useRef<Invader[]>(buildInvaders());

  const leftPressedRef = useRef(false);
  const rightPressedRef = useRef(false);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const enemyDirectionRef = useRef<1 | -1>(1);
  const enemyStepAccumulatorRef = useRef(0);

  const aliveInvaders = useMemo(() => invadersRef.current.filter((i) => i.alive), [tick]);

  const resetGame = useCallback(() => {
    playerRef.current = {
      x: (GAME_WIDTH - PLAYER_WIDTH) / 2,
      y: PLAYER_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    };
    bulletRef.current = null;
    enemyBulletRef.current = null;
    invadersRef.current = buildInvaders();
    enemyDirectionRef.current = 1;
    enemyStepAccumulatorRef.current = 0;
    setScore(0);
    setLives(3);
    setMessage('Use ← → to move, SPACE to fire');
    setTick((v) => v + 1);
  }, []);

  const shoot = useCallback(() => {
    if (!running) {
      resetGame();
      setRunning(true);
      setMessage('Use ← → to move, SPACE to fire');
      return;
    }

    if (!bulletRef.current) {
      bulletRef.current = {
        x: playerRef.current.x + playerRef.current.width / 2 - 2,
        y: playerRef.current.y - 12,
        width: 4,
        height: 12,
      };
      setTick((v) => v + 1);
    }
  }, [running]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.code === 'ArrowLeft') {
        leftPressedRef.current = true;
      } else if (event.code === 'ArrowRight') {
        rightPressedRef.current = true;
      } else if (event.code === 'Space') {
        event.preventDefault();
        shoot();
      }
    };

    const keyUp = (event: KeyboardEvent) => {
      if (event.code === 'ArrowLeft') {
        leftPressedRef.current = false;
      } else if (event.code === 'ArrowRight') {
        rightPressedRef.current = false;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', keyDown);
      window.addEventListener('keyup', keyUp);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', keyDown);
        window.removeEventListener('keyup', keyUp);
      }
    };
  }, [shoot]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const frame = (now: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = now;
      }
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const movement = (rightPressedRef.current ? 1 : 0) - (leftPressedRef.current ? 1 : 0);
      if (movement !== 0) {
        playerRef.current.x = clamp(
          playerRef.current.x + movement * PLAYER_SPEED * dt,
          0,
          GAME_WIDTH - PLAYER_WIDTH,
        );
      }

      if (bulletRef.current) {
        bulletRef.current.y -= BULLET_SPEED * dt;
        if (bulletRef.current.y + bulletRef.current.height < 0) {
          bulletRef.current = null;
        }
      }

      if (enemyBulletRef.current) {
        enemyBulletRef.current.y += ENEMY_BULLET_SPEED * dt;
        if (enemyBulletRef.current.y > GAME_HEIGHT) {
          enemyBulletRef.current = null;
        }
      }

      const alive = invadersRef.current.filter((i) => i.alive);
      if (alive.length === 0) {
        setRunning(false);
        setMessage('You win! Press SPACE to restart');
      } else {
        const stepInterval = Math.max(0.08, 0.55 - (55 - alive.length) * 0.008);
        enemyStepAccumulatorRef.current += dt;

        if (enemyStepAccumulatorRef.current >= stepInterval) {
          enemyStepAccumulatorRef.current = 0;
          const dir = enemyDirectionRef.current;
          let shouldDrop = false;

          for (const invader of alive) {
            const nextX = invader.x + dir * 12;
            if (nextX <= 4 || nextX + invader.width >= GAME_WIDTH - 4) {
              shouldDrop = true;
              break;
            }
          }

          if (shouldDrop) {
            enemyDirectionRef.current = dir === 1 ? -1 : 1;
            for (const invader of alive) {
              invader.y += 14;
              if (invader.y + invader.height >= PLAYER_Y) {
                setRunning(false);
                setMessage('Game over! Press SPACE to restart');
              }
            }
          } else {
            for (const invader of alive) {
              invader.x += dir * 12;
            }
          }

          if (!enemyBulletRef.current) {
            const shootersByColumn = new Map<number, Invader>();
            for (const invader of alive) {
              const col = Math.round((invader.x - INVADER_START_X) / (INVADER_WIDTH + INVADER_GAP_X));
              const existing = shootersByColumn.get(col);
              if (!existing || invader.y > existing.y) {
                shootersByColumn.set(col, invader);
              }
            }

            const shooters = Array.from(shootersByColumn.values());
            if (shooters.length > 0 && Math.random() < 0.32) {
              const chosen = shooters[Math.floor(Math.random() * shooters.length)];
              enemyBulletRef.current = {
                x: chosen.x + chosen.width / 2 - 2,
                y: chosen.y + chosen.height,
                width: 4,
                height: 12,
              };
            }
          }
        }
      }

      if (bulletRef.current) {
        for (const invader of invadersRef.current) {
          if (invader.alive && intersects(invader, bulletRef.current)) {
            invader.alive = false;
            bulletRef.current = null;
            setScore((s) => s + invader.points);
            break;
          }
        }
      }

      if (enemyBulletRef.current && intersects(enemyBulletRef.current, playerRef.current)) {
        enemyBulletRef.current = null;
        setLives((v) => {
          const next = v - 1;
          if (next <= 0) {
            setRunning(false);
            setMessage('Game over! Press SPACE to restart');
            return 0;
          }
          return next;
        });
      }

      setTick((v) => v + 1);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [running]);

  const currentPlayer = playerRef.current;
  const currentBullet = bulletRef.current;
  const currentEnemyBullet = enemyBulletRef.current;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Text style={styles.title}>Space Invaders</Text>
      <View style={styles.hud}>
        <Text style={styles.hudText}>Score: {score}</Text>
        <Text style={styles.hudText}>Lives: {lives}</Text>
      </View>

      <View style={styles.gameArea}>
        {aliveInvaders.map((invader) => (
          <View
            key={invader.id}
            style={[
              styles.invader,
              {
                left: invader.x,
                top: invader.y,
                backgroundColor: invader.points === 30 ? '#fb7185' : invader.points === 20 ? '#facc15' : '#4ade80',
              },
            ]}
          />
        ))}

        <View style={[styles.player, { left: currentPlayer.x, top: currentPlayer.y }]} />

        {currentBullet && (
          <View style={[styles.bullet, { left: currentBullet.x, top: currentBullet.y, backgroundColor: '#22d3ee' }]} />
        )}

        {currentEnemyBullet && (
          <View
            style={[
              styles.bullet,
              { left: currentEnemyBullet.x, top: currentEnemyBullet.y, backgroundColor: '#f97316' },
            ]}
          />
        )}
      </View>

      <Text style={styles.message}>{message}</Text>
      <Text style={styles.controls}>Controls: ← / → move, SPACE fire</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 42,
    paddingBottom: 24,
  },
  title: {
    color: '#e879f9',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 12,
    textShadowColor: '#22d3ee',
    textShadowRadius: 10,
  },
  hud: {
    width: GAME_WIDTH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  hudText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  gameArea: {
    position: 'relative',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    borderWidth: 3,
    borderColor: '#22d3ee',
    backgroundColor: '#020617',
    overflow: 'hidden',
    shadowColor: '#22d3ee',
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  invader: {
    position: 'absolute',
    width: INVADER_WIDTH,
    height: INVADER_HEIGHT,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  player: {
    position: 'absolute',
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: '#38bdf8',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#bae6fd',
  },
  bullet: {
    position: 'absolute',
    width: 4,
    height: 12,
    borderRadius: 2,
  },
  message: {
    marginTop: 14,
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '700',
  },
  controls: {
    marginTop: 8,
    color: '#cbd5e1',
    fontSize: 14,
  },
});
