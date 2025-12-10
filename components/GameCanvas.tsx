import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Entity, EntityType, GameState, LevelData, Vector2 } from '../types';
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, TERMINAL_VELOCITY, FRICTION, ACCELERATION, TILE_SIZE, ENEMY_SPEED } from '../constants';

interface GameCanvasProps {
  levelData: LevelData;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onCoinCollect: () => void;
}

// Helper to check AABB collision
function checkAABB(a: Entity, b: Entity) {
  return (
    a.pos.x < b.pos.x + b.size.x &&
    a.pos.x + a.size.x > b.pos.x &&
    a.pos.y < b.pos.y + b.size.y &&
    a.pos.y + a.size.y > b.pos.y
  );
}

const GameCanvas: React.FC<GameCanvasProps> = ({ levelData, gameState, setGameState, onCoinCollect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs (Mutable for performance)
  const playerRef = useRef<Entity>({
    id: 'player',
    type: EntityType.PLAYER,
    pos: { ...levelData.playerStart },
    size: { x: 30, y: 30 }, // Slightly smaller square to fit the star shape nicely
    vel: { x: 0, y: 0 },
    color: '#fbbf24' // Amber-400 (Star Color)
  });

  const entitiesRef = useRef<Entity[]>([]);
  const cameraRef = useRef<Vector2>({ x: 0, y: 0 });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  // Initialize Level
  useEffect(() => {
    playerRef.current.pos = { ...levelData.playerStart };
    playerRef.current.vel = { x: 0, y: 0 };
    playerRef.current.isDead = false;

    const newEntities: Entity[] = [];

    // Platforms
    levelData.platforms.forEach((p, i) => {
      newEntities.push({
        id: `plat-${i}`,
        type: EntityType.PLATFORM,
        pos: { x: p.x, y: p.y },
        size: { x: p.w, y: p.h },
        vel: { x: 0, y: 0 },
        color: p.color || '#4b5563' // Gray-600
      });
    });

    // Enemies
    levelData.enemies.forEach((e, i) => {
      newEntities.push({
        id: `enemy-${i}`,
        type: EntityType.ENEMY,
        pos: { x: e.x, y: e.y },
        size: { x: 32, y: 32 },
        vel: { x: -ENEMY_SPEED, y: 0 },
        color: '#854d0e' // Brown (Goomba-ish)
      });
    });

    // Coins
    levelData.coins.forEach((c, i) => {
      newEntities.push({
        id: `coin-${i}`,
        type: EntityType.COIN,
        pos: { x: c.x, y: c.y },
        size: { x: 20, y: 20 },
        vel: { x: 0, y: 0 },
        color: '#eab308' // Yellow-500
      });
    });

    // Goal
    newEntities.push({
      id: 'goal',
      type: EntityType.GOAL,
      pos: { x: levelData.goal.x, y: levelData.goal.y - 100 }, // Pole is tall
      size: { x: 20, y: 140 },
      vel: { x: 0, y: 0 },
      color: '#22c55e' // Green
    });

    entitiesRef.current = newEntities;
    cameraRef.current = { x: 0, y: 0 };
  }, [levelData]);

  // Input Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Expose control method for parent (touch controls)
    // @ts-ignore - simplistic way to expose to window for the sibling component purely for this demo
    window.gameInput = (action: 'LEFT' | 'RIGHT' | 'JUMP', active: boolean) => {
      if (action === 'LEFT') keysRef.current['ArrowLeft'] = active;
      if (action === 'RIGHT') keysRef.current['ArrowRight'] = active;
      if (action === 'JUMP') keysRef.current['Space'] = active;
    };

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // @ts-ignore
      delete window.gameInput;
    };
  }, []);

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    const player = playerRef.current;
    if (player.isDead) return;

    // --- Player Physics ---
    // Horizontal Movement
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
      player.vel.x -= ACCELERATION;
    } else if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
      player.vel.x += ACCELERATION;
    } else {
      player.vel.x *= FRICTION;
    }

    // Clamp speed
    player.vel.x = Math.max(Math.min(player.vel.x, MOVE_SPEED), -MOVE_SPEED);
    
    // Gravity
    player.vel.y += GRAVITY;
    if (player.vel.y > TERMINAL_VELOCITY) player.vel.y = TERMINAL_VELOCITY;

    // Apply X Velocity
    player.pos.x += player.vel.x;

    // --- X Collision (Platforms) ---
    const platforms = entitiesRef.current.filter(e => e.type === EntityType.PLATFORM);
    for (const plat of platforms) {
      if (checkAABB(player, plat)) {
        if (player.vel.x > 0) { // Moving right
          player.pos.x = plat.pos.x - player.size.x;
        } else if (player.vel.x < 0) { // Moving left
          player.pos.x = plat.pos.x + plat.size.x;
        }
        player.vel.x = 0;
      }
    }

    // Apply Y Velocity
    player.pos.y += player.vel.y;
    let grounded = false;

    // --- Y Collision (Platforms) ---
    for (const plat of platforms) {
      if (checkAABB(player, plat)) {
        if (player.vel.y > 0) { // Falling
          player.pos.y = plat.pos.y - player.size.y;
          grounded = true;
        } else if (player.vel.y < 0) { // Jumping up into block
          player.pos.y = plat.pos.y + plat.size.y;
          player.vel.y = 0;
        }
        player.vel.y = 0;
      }
    }

    // Jumping
    if (grounded && (keysRef.current['Space'] || keysRef.current['ArrowUp'] || keysRef.current['KeyW'])) {
      player.vel.y = JUMP_FORCE;
    }

    // Screen Boundaries
    if (player.pos.x < 0) player.pos.x = 0;
    if (player.pos.y > levelData.height + 200) {
      // Fell off world
      player.isDead = true;
      setGameState(GameState.GAME_OVER);
    }

    // --- Interaction Collisions ---
    // Remove collected entities
    let coinIndexToRemove = -1;
    let enemyIndexToRemove = -1;

    entitiesRef.current.forEach((entity, index) => {
      // Enemy Logic
      if (entity.type === EntityType.ENEMY) {
        if (!entity.isDead) {
          entity.pos.x += entity.vel.x;
          // Enemy turn around at edges or walls logic simplified:
          // Just simplistic distance patrol for now or wall bounce
          // Actually, let's just make them bounce off platforms if we wanted, 
          // but for this MVP, they just walk left.
          
          if (checkAABB(player, entity)) {
            // Did player jump on top?
            // Previous frame Y was above enemy top?
            // Simple check: player velocity Y is positive (falling) and player bottom is near enemy top
            const isStomp = player.vel.y > 0 && (player.pos.y + player.size.y - player.vel.y) < (entity.pos.y + entity.size.y / 2);
            
            if (isStomp) {
              // Kill enemy
              entity.isDead = true;
              entity.type = EntityType.DECORATION; // Stop interacting
              player.vel.y = JUMP_FORCE * 0.5; // Bounce
              // Note: In a real app we'd remove it or animate it. We'll mark dead.
              enemyIndexToRemove = index;
            } else {
              // Kill player
              player.isDead = true;
              setGameState(GameState.GAME_OVER);
            }
          }
        }
      }

      // Coin Logic
      if (entity.type === EntityType.COIN) {
        if (checkAABB(player, entity)) {
          coinIndexToRemove = index;
          onCoinCollect();
        }
      }

      // Goal Logic
      if (entity.type === EntityType.GOAL) {
        if (checkAABB(player, entity)) {
          setGameState(GameState.VICTORY);
        }
      }
    });

    if (coinIndexToRemove !== -1) {
        entitiesRef.current.splice(coinIndexToRemove, 1);
    }
    // Don't actually remove enemies immediately to avoid flicker, just squash them visualy in draw
    // For simplicity in this loop, we filter dead enemies out next frame logic
    entitiesRef.current = entitiesRef.current.filter(e => !(e.type === EntityType.ENEMY && e.isDead));


    // --- Camera Follow ---
    // Keep player in middle third of screen
    const targetCamX = player.pos.x - window.innerWidth / 2;
    // Clamp camera
    cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;
    if (cameraRef.current.x < 0) cameraRef.current.x = 0;
    if (cameraRef.current.x > levelData.width - window.innerWidth) cameraRef.current.x = levelData.width - window.innerWidth;

  }, [gameState, levelData, setGameState, onCoinCollect]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Clear
    ctx.fillStyle = '#1a202c'; // bg-gray-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-Math.floor(cameraRef.current.x), 0);

    // Draw Entities
    entitiesRef.current.forEach(e => {
      ctx.fillStyle = e.color;
      
      if (e.type === EntityType.COIN) {
        // Draw coin as circle
        ctx.beginPath();
        ctx.arc(e.pos.x + e.size.x/2, e.pos.y + e.size.y/2, e.size.x/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (e.type === EntityType.ENEMY) {
        // Draw Enemy
        ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
        // Angry eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(e.pos.x + 4, e.pos.y + 8, 8, 8);
        ctx.fillRect(e.pos.x + 20, e.pos.y + 8, 8, 8);
        ctx.fillStyle = 'black';
        ctx.fillRect(e.pos.x + 6, e.pos.y + 10, 4, 4);
        ctx.fillRect(e.pos.x + 22, e.pos.y + 10, 4, 4);
      } else if (e.type === EntityType.GOAL) {
        // Pole
        ctx.fillRect(e.pos.x + 8, e.pos.y, 4, 140);
        // Flag
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(e.pos.x + 12, e.pos.y + 10);
        ctx.lineTo(e.pos.x + 40, e.pos.y + 25);
        ctx.lineTo(e.pos.x + 12, e.pos.y + 40);
        ctx.fill();
        // Ball on top
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(e.pos.x + 10, e.pos.y, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Standard Block
        ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
        // Decoration: Bevel
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(e.pos.x, e.pos.y, e.size.x, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(e.pos.x, e.pos.y + e.size.y - 4, e.size.x, 4);
      }
    });

    // Draw Player (STAR)
    const p = playerRef.current;
    if (!p.isDead) {
      ctx.fillStyle = p.color;
      
      const cx = p.pos.x + p.size.x / 2;
      const cy = p.pos.y + p.size.y / 2;
      const spikes = 5;
      const outerRadius = p.size.x / 2;
      const innerRadius = p.size.x / 4;
      
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();

      // Eyes (facing direction)
      const eyeOffsetX = p.vel.x >= 0 ? 3 : -3;
      ctx.fillStyle = 'black';
      
      // Left Eye
      ctx.beginPath();
      ctx.arc(cx - 5 + eyeOffsetX, cy - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Right Eye
      ctx.beginPath();
      ctx.arc(cx + 5 + eyeOffsetX, cy - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

  }, [gameState]);

  const loop = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default GameCanvas;