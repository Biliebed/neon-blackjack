'use client';

import { useState, useEffect } from 'react';

interface Props {
  turnStartedAt: number | null;
  turnDuration: number;
  isMyTurn: boolean;
  isPlaying: boolean;
}

export default function TurnTimer({ turnStartedAt, turnDuration, isMyTurn, isPlaying }: Props) {
  const [timeLeft, setTimeLeft] = useState(turnDuration);

  useEffect(() => {
    if (!turnStartedAt || !isPlaying) {
      setTimeLeft(turnDuration);
      return;
    }

    const updateTimer = () => {
      const elapsed = (Date.now() - turnStartedAt) / 1000;
      const remaining = Math.max(0, turnDuration - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [turnStartedAt, turnDuration, isPlaying]);

  if (!isPlaying || !turnStartedAt) return null;

  const percentage = (timeLeft / turnDuration) * 100;
  const isLow = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  const color = isCritical
    ? '#ff073a'
    : isLow
    ? '#ffb700'
    : isMyTurn
    ? '#00ff88'
    : '#00f5ff';

  return (
    <div className="w-full max-w-lg mx-auto mb-4">
      {/* Timer bar */}
      <div className="relative h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}, 0 0 20px ${color}40`,
          }}
        />
      </div>

      {/* Timer text */}
      <div className="flex items-center justify-center mt-2 gap-2">
        <span
          className={`font-['Orbitron'] text-2xl font-bold ${isCritical ? 'animate-pulse' : ''}`}
          style={{ color, textShadow: `0 0 10px ${color}` }}
        >
          {Math.ceil(timeLeft)}s
        </span>
        <span className="text-white/40 text-xs font-['Rajdhani']">
          {isMyTurn ? '⚡ YOUR TURN' : '⏳ OPPONENT'}
        </span>
      </div>
    </div>
  );
}
