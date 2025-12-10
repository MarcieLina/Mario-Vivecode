import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

interface ControlsProps {
  onInput: (action: 'LEFT' | 'RIGHT' | 'JUMP', active: boolean) => void;
}

const Controls: React.FC<ControlsProps> = ({ onInput }) => {
  return (
    <div className="absolute bottom-4 left-0 right-0 px-4 flex justify-between items-end pointer-events-none z-20 select-none">
      {/* Directional Pad */}
      <div className="flex gap-4 pointer-events-auto">
        <button
          className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 active:bg-white/40 touch-manipulation"
          onPointerDown={() => onInput('LEFT', true)}
          onPointerUp={() => onInput('LEFT', false)}
          onPointerLeave={() => onInput('LEFT', false)}
        >
          <ArrowLeft className="text-white w-8 h-8" />
        </button>
        <button
          className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 active:bg-white/40 touch-manipulation"
          onPointerDown={() => onInput('RIGHT', true)}
          onPointerUp={() => onInput('RIGHT', false)}
          onPointerLeave={() => onInput('RIGHT', false)}
        >
          <ArrowRight className="text-white w-8 h-8" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pointer-events-auto">
        <button
          className="w-20 h-20 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-red-300 active:bg-red-600 active:scale-95 transition-transform touch-manipulation shadow-lg"
          onPointerDown={() => onInput('JUMP', true)}
          onPointerUp={() => onInput('JUMP', false)}
          onPointerLeave={() => onInput('JUMP', false)}
        >
          <ArrowUp className="text-white w-10 h-10 font-bold" />
        </button>
      </div>
    </div>
  );
};

export default Controls;