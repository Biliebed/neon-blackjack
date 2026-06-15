'use client';

import { useState, useEffect, useCallback } from 'react';
import { RoomData } from '@/app/page';
import { Card, Player, GameState } from '@/lib/blackjack';
import { apiGet, apiPost } from '@/lib/api';
import CardComponent from './CardComponent';
import TurnTimer from './TurnTimer';

interface Props {
  roomData: RoomData;
  onLeave: () => void;
}

export default function GameRoom({ roomData, onLeave }: Props) {
  const [game, setGame] = useState<GameState | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchGame = useCallback(async () => {
    try {
      const data = await apiGet('/api/game', { roomId: roomData.roomId, playerId: roomData.playerId });
      if (data.success) {
        setGame(data.game);
      }
    } catch (e) {
      console.error('Poll error:', e);
    }
  }, [roomData.roomId, roomData.playerId]);

  // Polling for game state
  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 1500);
    return () => clearInterval(interval);
  }, [fetchGame]);

  const doAction = async (action: string) => {
    try {
      const data = await apiPost('/api/game', { roomId: roomData.roomId, playerId: roomData.playerId, action });
      if (data.success) {
        setGame(data.game);
      }
    } catch (e) {
      console.error('Action error:', e);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomData.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center z-10 relative">
        <div className="text-neon-cyan text-2xl font-['Orbitron'] animate-pulse">
          ⏳ CONNECTING...
        </div>
      </div>
    );
  }

  const me = game.players.find(p => p.id === roomData.playerId);
  const opponent = game.players.find(p => p.id !== roomData.playerId);
  const isMyTurn = game.phase === 'playing' && game.players[game.currentTurn]?.id === roomData.playerId;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 relative z-10">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <button onClick={onLeave} className="text-neon-cyan/60 hover:text-neon-cyan text-sm font-['Rajdhani']">
          ← EXIT
        </button>
        <div className="flex items-center gap-2">
          <span className="text-neon-cyan/60 text-xs font-['Rajdhani']">ROOM:</span>
          <button
            onClick={copyCode}
            className="text-neon-cyan font-['Orbitron'] text-lg tracking-[0.3em] hover:text-neon-green transition-colors"
          >
            {roomData.roomId}
          </button>
          {copied && <span className="text-neon-green text-xs">✓</span>}
        </div>
        <span className="text-neon-magenta/60 text-sm font-['Rajdhani']">
          R{game.round}
        </span>
      </div>

      {/* Timer */}
      <TurnTimer
        turnStartedAt={game.turnStartedAt}
        turnDuration={game.turnDuration}
        isMyTurn={isMyTurn}
        isPlaying={game.phase === 'playing'}
      />

      {/* Opponent area */}
      <div className="w-full max-w-lg mb-6">
        <div className="neon-border-magenta rounded-xl p-4 bg-black/40 backdrop-blur-sm">
          {opponent ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-neon-magenta font-['Orbitron'] text-sm">
                  {opponent.name} {opponent.status === 'bust' ? '💀' : opponent.status === 'blackjack' ? '🏆' : ''}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-neon-magenta/60 text-xs font-['Rajdhani']">
                    WINS: {opponent.wins}
                  </span>
                  {(game.phase === 'playing' || game.phase === 'result') && (
                    <span className="text-neon-yellow text-lg font-['Orbitron']">
                      {opponent.score}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {opponent.hand.map((card, i) => (
                  <CardComponent key={i} card={card} index={i} isOpponent />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-neon-magenta/50 font-['Rajdhani'] text-lg animate-pulse">
                Waiting for opponent...
              </p>
              <p className="text-neon-magenta/30 font-['Rajdhani'] text-sm mt-2">
                Share room code: <span className="text-neon-cyan">{roomData.roomId}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Center - Game status */}
      <div className="mb-6 text-center">
        {game.phase === 'waiting' && game.players.length === 2 && (
          <div className="space-y-3">
            {!me?.isReady ? (
              <button onClick={() => doAction('ready')} className="btn-neon btn-neon-green text-lg px-8">
                ✅ READY
              </button>
            ) : (
              <p className="text-neon-green font-['Rajdhani'] animate-pulse">
                Waiting for opponent to ready up...
              </p>
            )}
          </div>
        )}

        {game.phase === 'playing' && (
          <div className="space-y-2">
            {isMyTurn ? (
              <div className="flex gap-4 justify-center">
                <button onClick={() => doAction('hit')} className="btn-neon btn-neon-green text-lg px-8">
                  🃏 HIT
                </button>
                <button onClick={() => doAction('stand')} className="btn-neon btn-neon-magenta text-lg px-8">
                  ✋ STAND
                </button>
              </div>
            ) : (
              <p className="text-neon-yellow font-['Rajdhani'] text-lg animate-pulse">
                ⏳ Opponent&apos;s turn...
              </p>
            )}
          </div>
        )}

        {game.phase === 'result' && (
          <div className="space-y-4">
            <div className="text-3xl font-['Orbitron'] font-bold">
              {game.winner === roomData.playerId && (
                <span className="neon-text-green">🏆 YOU WIN!</span>
              )}
              {game.winner && game.winner !== roomData.playerId && (
                <span className="neon-text-magenta">💀 YOU LOSE</span>
              )}
              {!game.winner && (
                <span className="neon-text">🤝 TIE</span>
              )}
            </div>
            <button onClick={() => doAction('next-round')} className="btn-neon btn-neon-green">
              🔄 NEXT ROUND
            </button>
          </div>
        )}
      </div>

      {/* My area */}
      <div className="w-full max-w-lg">
        <div className="neon-border rounded-xl p-4 bg-black/40 backdrop-blur-sm">
          {me && (
            <>
              <div className="flex gap-2 justify-center flex-wrap mb-3">
                {me.hand.map((card, i) => (
                  <CardComponent key={i} card={card} index={i} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neon-cyan font-['Orbitron'] text-sm">
                  {me.name} {me.status === 'bust' ? '💀' : me.status === 'blackjack' ? '🏆' : ''}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-neon-cyan/60 text-xs font-['Rajdhani']">
                    WINS: {me.wins}
                  </span>
                  <span className="text-neon-green text-xl font-['Orbitron'] font-bold">
                    {me.score}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Turn indicator */}
      {game.phase === 'playing' && isMyTurn && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-neon-green/10 border border-neon-green rounded-full px-6 py-2 animate-pulse">
          <span className="text-neon-green font-['Orbitron'] text-sm">YOUR TURN</span>
        </div>
      )}
    </div>
  );
}
