'use client';

import { useState, useEffect } from 'react';
import LobbyScreen from '@/components/LobbyScreen';
import GameRoom from '@/components/GameRoom';
import Particles from '@/components/Particles';

export type Screen = 'lobby' | 'game';

export interface RoomData {
  roomId: string;
  playerId: string;
  playerName: string;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  const handleJoinGame = (data: RoomData) => {
    setRoomData(data);
    setScreen('game');
  };

  const handleLeaveGame = () => {
    setRoomData(null);
    setScreen('lobby');
  };

  return (
    <main className="min-h-screen relative">
      <Particles />
      {screen === 'lobby' && <LobbyScreen onJoinGame={handleJoinGame} />}
      {screen === 'game' && roomData && (
        <GameRoom roomData={roomData} onLeave={handleLeaveGame} />
      )}
    </main>
  );
}
