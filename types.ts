export enum EntityType {
  PLAYER = 'PLAYER',
  PLATFORM = 'PLATFORM',
  ENEMY = 'ENEMY',
  COIN = 'COIN',
  GOAL = 'GOAL',
  DECORATION = 'DECORATION'
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  size: Vector2;
  vel: Vector2;
  color: string;
  isDead?: boolean;
  patrolStart?: number; // For enemies
  patrolEnd?: number;   // For enemies
}

export interface LevelData {
  id: string;
  name: string;
  width: number;
  height: number;
  playerStart: Vector2;
  platforms: Array<{ x: number; y: number; w: number; h: number; color?: string }>;
  enemies: Array<{ x: number; y: number }>;
  coins: Array<{ x: number; y: number }>;
  goal: { x: number; y: number };
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  LOADING = 'LOADING'
}