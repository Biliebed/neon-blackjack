import { NextRequest, NextResponse } from 'next/server';
import { gameManager } from '@/lib/gameManager';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const playerId = searchParams.get('playerId');

  if (!roomId) {
    return NextResponse.json({ success: false, error: 'Missing roomId' });
  }

  const game = gameManager.getGame(roomId);
  if (!game) {
    return NextResponse.json({ success: false, error: 'Room not found' });
  }

  // Return game state (hide opponent cards during play if needed)
  const gameView = {
    ...game,
    deck: undefined, // Don't expose deck
    players: game.players.map(p => {
      if (p.id !== playerId && game.phase === 'playing' && p.status === 'playing') {
        // Hide opponent's cards during their turn (show only first card)
        return {
          ...p,
          hand: p.hand.map((card, i) => i === 0 ? card : { ...card, hidden: true }),
          score: 0, // Hide score
        };
      }
      return p;
    }),
  };

  return NextResponse.json({ success: true, game: gameView });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomId, playerId, action } = body;

  if (!roomId || !playerId) {
    return NextResponse.json({ success: false, error: 'Missing params' });
  }

  const game = gameManager.getGame(roomId);
  if (!game) {
    return NextResponse.json({ success: false, error: 'Room not found' });
  }

  switch (action) {
    case 'ready':
      gameManager.setReady(roomId, playerId);
      break;
    case 'hit':
      gameManager.hit(roomId, playerId);
      break;
    case 'stand':
      gameManager.stand(roomId, playerId);
      break;
    case 'next-round':
      gameManager.nextRound(roomId);
      break;
    default:
      return NextResponse.json({ success: false, error: 'Invalid action' });
  }

  // Return updated game state
  const updatedGame = gameManager.getGame(roomId);
  const gameView = {
    ...updatedGame,
    deck: undefined,
    players: updatedGame!.players.map(p => {
      if (p.id !== playerId && updatedGame!.phase === 'playing' && p.status === 'playing') {
        return {
          ...p,
          hand: p.hand.map((card, i) => i === 0 ? card : { ...card, hidden: true }),
          score: 0,
        };
      }
      return p;
    }),
  };

  return NextResponse.json({ success: true, game: gameView });
}
