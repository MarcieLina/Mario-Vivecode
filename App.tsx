import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import Controls from './components/Controls';
import { GameState, LevelData } from './types';
import { DEFAULT_LEVEL } from './constants';
import { generateLevel } from './services/geminiService';
import { Trophy, Skull, Coins, RefreshCw, Play, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevel, setCurrentLevel] = useState<LevelData>(DEFAULT_LEVEL);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setLives(3);
  };

  const handleLevelGen = async () => {
    setLoading(true);
    setError(null);
    try {
      const newLevel = await generateLevel();
      setCurrentLevel(newLevel);
      setGameState(GameState.PLAYING);
      setScore(0);
    } catch (e: any) {
      console.error(e);
      setError("Failed to generate level. Using default. (Check API Key)");
      setCurrentLevel(DEFAULT_LEVEL);
      setGameState(GameState.PLAYING);
    } finally {
      setLoading(false);
    }
  };

  const resetLevel = () => {
    setGameState(GameState.PLAYING);
    // Force re-render of canvas by toggling state momentarily if needed, 
    // but React key on Canvas usually handles this. 
    // Here we'll just rely on GameCanvas internal useEffect to reset when gameState switches to Playing from GameOver.
  };

  // Sound effects logic would go here
  const handleCoinCollect = () => {
    setScore(prev => prev + 100);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 text-white font-sans select-none">
      
      {/* Game Layer */}
      <div className="absolute inset-0 z-0">
        {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
          <GameCanvas 
            key={currentLevel.id + lives} // Remount on death/level change
            levelData={currentLevel} 
            gameState={gameState} 
            setGameState={(newState) => {
              setGameState(newState);
              if (newState === GameState.GAME_OVER) {
                 setLives(l => Math.max(0, l - 1));
              }
            }}
            onCoinCollect={handleCoinCollect}
          />
        )}
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        
        {/* HUD */}
        {gameState !== GameState.MENU && (
          <div className="p-6 flex justify-between items-start font-retro text-shadow-md">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-yellow-400 text-xl">
                <Coins size={24} />
                <span>{score.toString().padStart(6, '0')}</span>
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-widest">{currentLevel.name}</div>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Lives */}
               <div className="flex gap-1">
                 {Array.from({length: Math.max(0, lives)}).map((_, i) => (
                   <div key={i} className="w-4 h-4 bg-red-500 rounded-sm border-2 border-red-800" />
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* Menu Screen */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center pointer-events-auto">
            <h1 className="text-6xl md:text-8xl font-retro text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 mb-8 filter drop-shadow-lg text-center leading-tight">
              GEMINI<br/><span className="text-red-500">JUMP</span>
            </h1>
            
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-retro text-xl border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all rounded"
              >
                <div className="flex items-center justify-center gap-2">
                  <Play size={24} />
                  PLAY CLASSIC
                </div>
              </button>

              <button 
                onClick={handleLevelGen}
                disabled={loading}
                className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-retro text-sm border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  GENERATE WITH AI
                </div>
              </button>
            </div>
            
            <div className="mt-12 text-gray-500 text-xs text-center max-w-md px-4">
              Use Arrow Keys or WASD to Move & Jump.<br/>
              Collect coins, stomp enemies, reach the flag.
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-xs bg-red-900/20 px-4 py-2 rounded">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto backdrop-blur-sm">
            <Skull className="w-24 h-24 text-gray-500 mb-4 animate-bounce" />
            <h2 className="text-5xl font-retro text-white mb-8">GAME OVER</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => lives > 0 ? resetLevel() : setGameState(GameState.MENU)}
                className="px-6 py-3 bg-white text-black font-retro hover:bg-gray-200 border-b-4 border-gray-400 rounded active:border-b-0 active:translate-y-1"
              >
                {lives > 0 ? "TRY AGAIN" : "MAIN MENU"}
              </button>
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {gameState === GameState.VICTORY && (
          <div className="absolute inset-0 bg-green-900/90 flex flex-col items-center justify-center pointer-events-auto backdrop-blur-sm">
            <Trophy className="w-24 h-24 text-yellow-400 mb-4 animate-pulse" />
            <h2 className="text-5xl font-retro text-white mb-4">LEVEL CLEAR!</h2>
            <p className="text-xl font-retro text-green-200 mb-8">SCORE: {score}</p>
            <div className="flex gap-4">
              <button 
                onClick={handleLevelGen}
                className="px-6 py-3 bg-yellow-500 text-black font-retro hover:bg-yellow-400 border-b-4 border-yellow-700 rounded active:border-b-0 active:translate-y-1 flex items-center gap-2"
              >
                <Sparkles size={16} /> NEXT LEVEL (AI)
              </button>
              <button 
                onClick={() => setGameState(GameState.MENU)}
                className="px-6 py-3 bg-white/10 text-white font-retro hover:bg-white/20 rounded"
              >
                MENU
              </button>
            </div>
          </div>
        )}

        {/* Mobile Controls */}
        {gameState === GameState.PLAYING && (
          <div className="md:hidden">
            <Controls onInput={(action, active) => {
               // The listener is attached to window in GameCanvas, 
               // but we need to trigger it. 
               // Since React components are separate, we used a window helper in GameCanvas.
               // @ts-ignore
               if (window.gameInput) window.gameInput(action, active);
            }} />
          </div>
        )}
      </div>
    </div>
  );
}