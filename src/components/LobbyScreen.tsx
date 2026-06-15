'use client';

import { useState } from 'react';
import { RoomData } from '@/app/page';

interface Props {
  onJoinGame: (data: RoomData) => void;
}

export default function LobbyScreen({ onJoinGame }: Props) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async () => {
    if (!playerName.trim()) {
      setError('Enter your name first!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', playerName: playerName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onJoinGame({ roomId: data.roomId, playerId: data.playerId, playerName: playerName.trim() });
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (e) {
      setError('Connection error');
    }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      setError('Enter your name first!');
      return;
    }
    if (!roomCode.trim()) {
      setError('Enter room code!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', playerName: playerName.trim(), roomId: roomCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        onJoinGame({ roomId: data.roomId, playerId: data.playerId, playerName: playerName.trim() });
      } else {
        setError(data.error || 'Failed to join room');
      }
    } catch (e) {
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold neon-text font-['Orbitron'] tracking-wider mb-2">
          NEON
        </h1>
        <h2 className="text-4xl md:text-6xl font-bold neon-text-magenta font-['Orbitron'] tracking-wider mb-4">
          BLACKJACK
        </h2>
        <div className="flex items-center justify-center gap-3">
          <span className="text-neon-green text-xl font-['Rajdhani'] tracking-[0.3em] animate-pulse">
            ⚡ PVP BATTLE ⚡
          </span>
        </div>
      </div>

      {/* Card decoration */}
      <div className="flex gap-4 mb-8 animate-float">
        <div className="w-12 h-16 card-back rounded-lg flex items-center justify-center text-2xl">🃏</div>
        <div className="w-12 h-16 card-back rounded-lg flex items-center justify-center text-2xl">♠</div>
        <div className="w-12 h-16 card-back rounded-lg flex items-center justify-center text-2xl">♥</div>
      </div>

      {/* Menu */}
      <div className="neon-border rounded-xl p-8 w-full max-w-md bg-black/60 backdrop-blur-sm">
        {mode === 'menu' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="YOUR NAME"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={15}
              className="w-full bg-transparent border-b-2 border-neon-cyan/50 text-neon-cyan text-center text-xl py-3 px-4 font-['Orbitron'] placeholder:text-neon-cyan/30 focus:outline-none focus:border-neon-cyan transition-all"
            />
            <button
              onClick={() => setMode('create')}
              className="btn-neon w-full mt-6"
            >
              🎮 CREATE ROOM
            </button>
            <button
              onClick={() => setMode('join')}
              className="btn-neon btn-neon-magenta w-full"
            >
              ⚔️ JOIN ROOM
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <p className="text-neon-cyan/70 text-center font-['Rajdhani'] text-lg">
              Create a room and share the code with your opponent
            </p>
            <button
              onClick={createRoom}
              disabled={loading}
              className="btn-neon btn-neon-green w-full"
            >
              {loading ? '⏳ CREATING...' : '🚀 START'}
            </button>
            <button
              onClick={() => { setMode('menu'); setError(''); }}
              className="btn-neon w-full opacity-60"
            >
              ← BACK
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full bg-transparent border-b-2 border-neon-magenta/50 text-neon-magenta text-center text-2xl py-3 px-4 font-['Orbitron'] tracking-[0.5em] placeholder:text-neon-magenta/30 focus:outline-none focus:border-neon-magenta transition-all"
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="btn-neon btn-neon-green w-full"
            >
              {loading ? '⏳ JOINING...' : '⚔️ JOIN'}
            </button>
            <button
              onClick={() => { setMode('menu'); setError(''); }}
              className="btn-neon w-full opacity-60"
            >
              ← BACK
            </button>
          </div>
        )}

        {error && (
          <p className="text-neon-red text-center mt-4 font-['Rajdhani'] animate-pulse">
            ⚠️ {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-neon-cyan/30 text-sm font-['Rajdhani'] tracking-wider">
        NEON BLACKJACK PVP v1.0
      </p>
    </div>
  );
}
