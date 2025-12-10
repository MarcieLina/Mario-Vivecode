import { LevelData } from './types';

export const GRAVITY = 0.6;
export const TERMINAL_VELOCITY = 12;
export const JUMP_FORCE = -14;
export const MOVE_SPEED = 6;
export const ENEMY_SPEED = 2;
export const FRICTION = 0.8;
export const ACCELERATION = 1.5;

export const TILE_SIZE = 40;

// A simple hand-crafted level for fallback/tutorial
export const DEFAULT_LEVEL: LevelData = {
  id: 'world-1-1',
  name: 'World 1-1',
  width: 3000,
  height: 600,
  playerStart: { x: 100, y: 300 },
  platforms: [
    // Floor
    { x: 0, y: 500, w: 3000, h: 100 },
    // Steps
    { x: 400, y: 350, w: 200, h: 40 },
    { x: 700, y: 250, w: 200, h: 40 },
    { x: 1000, y: 350, w: 200, h: 40 },
    // High platform
    { x: 1400, y: 200, w: 400, h: 40 },
    // Obstacles
    { x: 2000, y: 400, w: 100, h: 100 },
    { x: 2200, y: 300, w: 100, h: 40 },
    { x: 2400, y: 200, w: 100, h: 40 },
  ],
  enemies: [
    { x: 500, y: 300 },
    { x: 1500, y: 150 },
    { x: 1700, y: 150 },
    { x: 2100, y: 450 },
  ],
  coins: [
    { x: 450, y: 300 },
    { x: 500, y: 300 },
    { x: 550, y: 300 },
    { x: 800, y: 200 },
    { x: 1500, y: 150 },
    { x: 1600, y: 150 },
    { x: 1700, y: 150 },
    { x: 2450, y: 150 },
  ],
  goal: { x: 2800, y: 400 }
};