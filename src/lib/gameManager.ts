import { GameState, Player, Card, createDeck, calculateScore, isBlackjack, determineWinner } from './blackjack';
import { v4 as uuidv4 } from 'uuid';

// Use globalThis to persist across serverless invocations on the same instance
// This works because Vercel reuses warm instances
const globalForGames = globalThis as unknown as {
  __games: Map<string, GameState> | undefined;
  __lastCleanup: number | undefined;
};

if (!globalForGames.__games) {
  globalForGames.__games = new Map<string, GameState>();
}
if (!globalForGames.__lastCleanup) {
  globalForGames.__lastCleanup = Date.now();
}

export class GameManager {
  private get games(): Map<string, GameState> {
    return globalForGames.__games!;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private cleanup() {
    const now = Date.now();
    // Cleanup every 5 minutes
    if (now - globalForGames.__lastCleanup! < 300000) return;
    globalForGames.__lastCleanup = now;

    const entries = Array.from(this.games.entries());
    for (const [id, game] of entries) {
      // Remove games older than 30 minutes
      if (now - game.createdAt > 1800000) {
        this.games.delete(id);
      }
    }
  }

  createRoom(): string {
    this.cleanup();
    const roomId = this.generateRoomCode();
    const game: GameState = {
      roomId,
      players: [],
      deck: [],
      phase: 'waiting',
      currentTurn: 0,
      round: 1,
      winner: null,
      createdAt: Date.now(),
    };
    this.games.set(roomId, game);
    return roomId;
  }

  joinRoom(roomId: string, playerName: string): Player | null {
    const game = this.games.get(roomId);
    if (!game || game.players.length >= 2) return null;

    const player: Player = {
      id: uuidv4(),
      name: playerName,
      hand: [],
      score: 0,
      status: 'waiting',
      isReady: false,
      wins: 0,
    };
    game.players.push(player);
    return player;
  }

  getGame(roomId: string): GameState | undefined {
    return this.games.get(roomId);
  }

  setReady(roomId: string, playerId: string) {
    const game = this.games.get(roomId);
    if (!game) return;

    const player = game.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = true;
    }

    // If both players are ready, start the game
    if (game.players.length === 2 && game.players.every(p => p.isReady)) {
      this.startRound(game);
    }
  }

  private startRound(game: GameState) {
    game.deck = createDeck();
    game.phase = 'playing';
    game.winner = null;
    game.currentTurn = 0;

    // Deal 2 cards to each player
    for (const player of game.players) {
      player.hand = [game.deck.pop()!, game.deck.pop()!];
      player.score = calculateScore(player.hand);
      player.status = 'playing';

      // Check for blackjack
      if (isBlackjack(player.hand)) {
        player.status = 'blackjack';
      }
    }

    // If anyone has blackjack, end immediately
    if (game.players.some(p => p.status === 'blackjack')) {
      this.endRound(game);
    }
  }

  hit(roomId: string, playerId: string) {
    const game = this.games.get(roomId);
    if (!game || game.phase !== 'playing') return;

    const currentPlayer = game.players[game.currentTurn];
    if (currentPlayer.id !== playerId) return;

    // Draw a card
    const card = game.deck.pop();
    if (!card) return;

    currentPlayer.hand.push(card);
    currentPlayer.score = calculateScore(currentPlayer.hand);

    // Check bust
    if (currentPlayer.score > 21) {
      currentPlayer.status = 'bust';
      this.nextTurn(game);
    }
  }

  stand(roomId: string, playerId: string) {
    const game = this.games.get(roomId);
    if (!game || game.phase !== 'playing') return;

    const currentPlayer = game.players[game.currentTurn];
    if (currentPlayer.id !== playerId) return;

    currentPlayer.status = 'stand';
    this.nextTurn(game);
  }

  private nextTurn(game: GameState) {
    // Check if all players are done
    const allDone = game.players.every(p => p.status !== 'playing');
    if (allDone) {
      this.endRound(game);
      return;
    }

    // Move to next player
    game.currentTurn = (game.currentTurn + 1) % game.players.length;

    // Skip players who are already done
    if (game.players[game.currentTurn].status !== 'playing') {
      this.endRound(game);
    }
  }

  private endRound(game: GameState) {
    game.phase = 'result';
    if (game.players.length === 2) {
      const winner = determineWinner(game.players[0], game.players[1]);
      game.winner = winner;
      if (winner) {
        const winPlayer = game.players.find(p => p.id === winner);
        if (winPlayer) winPlayer.wins++;
      }
    }
  }

  nextRound(roomId: string) {
    const game = this.games.get(roomId);
    if (!game || game.phase !== 'result') return;

    game.round++;
    game.players.forEach(p => {
      p.isReady = false;
      p.hand = [];
      p.score = 0;
      p.status = 'waiting';
    });
    game.phase = 'waiting';
    game.winner = null;

    // Auto-ready both players for next round
    game.players.forEach(p => p.isReady = true);
    if (game.players.length === 2) {
      this.startRound(game);
    }
  }
}

export const gameManager = new GameManager();
