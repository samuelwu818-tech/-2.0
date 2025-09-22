import React, { Dispatch } from 'react';
import { Action, Vector2 } from '../types';
import { BrainIcon, LightningIcon } from './Icons';

interface MobileControlsProps {
  dispatch: Dispatch<Action>;
  cloneSpellUnlocked: boolean;
}

const DPadButton: React.FC<{ onTouchStart: () => void; onTouchEnd: () => void; className?: string; children: React.ReactNode }> = ({ onTouchStart, onTouchEnd, className, children }) => (
  <button
    onTouchStart={(e) => { e.preventDefault(); onTouchStart(); }}
    onTouchEnd={(e) => { e.preventDefault(); onTouchEnd(); }}
    onMouseDown={(e) => { e.preventDefault(); onTouchStart(); }}
    onMouseUp={(e) => { e.preventDefault(); onTouchEnd(); }}
    className={`w-16 h-16 bg-gray-500/50 rounded-full flex justify-center items-center text-white text-3xl select-none active:bg-gray-400/70 ${className}`}
    aria-label={`Move ${children}`}
  >
    {children}
  </button>
);


export const MobileControls: React.FC<MobileControlsProps> = ({ dispatch, cloneSpellUnlocked }) => {
  const handleMove = (direction: Vector2) => {
    dispatch({ type: 'TOUCH_MOVE_START', payload: direction });
  };
  const handleStop = () => {
    dispatch({ type: 'TOUCH_MOVE_END' });
  };

  const handleLightningStrike = () => {
    dispatch({ type: 'LIGHTNING_STRIKE' });
  };

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-40" aria-hidden="true">
      {/* D-Pad */}
      <div className="absolute bottom-10 left-10 grid grid-cols-3 grid-rows-3 gap-2 w-48 h-48 pointer-events-auto">
        <div className="col-start-2">
          <DPadButton onTouchStart={() => handleMove({ x: 0, y: -1 })} onTouchEnd={handleStop}>▲</DPadButton>
        </div>
        <div className="row-start-2">
          <DPadButton onTouchStart={() => handleMove({ x: -1, y: 0 })} onTouchEnd={handleStop}>◀</DPadButton>
        </div>
        <div className="row-start-2 col-start-3">
          <DPadButton onTouchStart={() => handleMove({ x: 1, y: 0 })} onTouchEnd={handleStop}>▶</DPadButton>
        </div>
        <div className="row-start-3 col-start-2">
          <DPadButton onTouchStart={() => handleMove({ x: 0, y: 1 })} onTouchEnd={handleStop}>▼</DPadButton>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-10 right-10 flex items-end gap-4 pointer-events-auto">
        {cloneSpellUnlocked && (
            <button
              onTouchStart={(e) => { e.preventDefault(); dispatch({ type: 'CREATE_CLONE' }); }}
              onMouseDown={(e) => { e.preventDefault(); dispatch({ type: 'CREATE_CLONE' }); }}
              className="w-20 h-20 bg-teal-600/60 rounded-full flex flex-col justify-center items-center text-white text-lg select-none active:bg-teal-500/80 border-2 border-teal-400"
              aria-label="Summon Clone"
            >
              <BrainIcon className="w-8 h-8 text-cyan-200" />
              <span className="text-sm mt-1">分身</span>
            </button>
        )}
        <button
          onTouchStart={(e) => { e.preventDefault(); dispatch({ type: 'START_AZURE_CHARGE' }); }}
          onTouchEnd={(e) => { e.preventDefault(); dispatch({ type: 'STOP_AZURE_CHARGE' }); }}
          onMouseDown={(e) => { e.preventDefault(); dispatch({ type: 'START_AZURE_CHARGE' }); }}
          onMouseUp={(e) => { e.preventDefault(); dispatch({ type: 'STOP_AZURE_CHARGE' }); }}
          className="w-20 h-20 bg-blue-600/60 rounded-full flex justify-center items-center text-white text-lg select-none active:bg-blue-500/80 border-2 border-blue-400"
          aria-label="Tap for Shockwave, Hold for Azure Lightning"
        >
          <LightningIcon className="w-10 h-10 text-cyan-200" />
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); handleLightningStrike(); }}
          onMouseDown={(e) => { e.preventDefault(); handleLightningStrike(); }}
          className="w-20 h-20 bg-yellow-500/60 rounded-full flex justify-center items-center text-white text-lg select-none active:bg-yellow-400/80 border-2 border-yellow-300"
          aria-label="Lightning Strike"
        >
          <LightningIcon className="w-10 h-10" />
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); dispatch({ type: 'START_CHARGING' }); }}
          onTouchEnd={(e) => { e.preventDefault(); dispatch({ type: 'STOP_CHARGING' }); }}
          onMouseDown={(e) => { e.preventDefault(); dispatch({ type: 'START_CHARGING' }); }}
          onMouseUp={(e) => { e.preventDefault(); dispatch({ type: 'STOP_CHARGING' }); }}
          className="w-24 h-24 bg-red-600/60 rounded-full flex justify-center items-center text-white text-xl select-none active:bg-red-500/80 border-2 border-red-400"
          aria-label="Hold to Charge Attack"
        >
          Attack
        </button>
      </div>
    </div>
  );
};