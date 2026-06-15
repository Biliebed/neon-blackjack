import { NextRequest, NextResponse } from 'next/server';
import { gameManager } from '@/lib/gameManager';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, playerName, roomId } = body;

  if (action === 'create') {
    const newRoomId = gameManager.createRoom();
    const player = gameManager.joinRoom(newRoomId, playerName);
    if (player) {
      return NextResponse.json({ success: true, roomId: newRoomId, playerId: player.id });
    }
    return NextResponse.json({ success: false, error: 'Failed to create room' });
  }

  if (action === 'join') {
    const game = gameManager.getGame(roomId);
    if (!game) {
      return NextResponse.json({ success: false, error: 'Room not found' });
    }
    if (game.players.length >= 2) {
      return NextResponse.json({ success: false, error: 'Room is full' });
    }
    const player = gameManager.joinRoom(roomId, playerName);
    if (player) {
      return NextResponse.json({ success: true, roomId, playerId: player.id });
    }
    return NextResponse.json({ success: false, error: 'Failed to join room' });
  }

  return NextResponse.json({ success: false, error: 'Invalid action' });
}
