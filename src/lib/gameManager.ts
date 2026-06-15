import { GameState, Player, Card, createDeck, calculateScore, isBlackjack, determineWinner } from './blackjack';
import { v4 as uuidv4 } from 'uuid';

export class GameManager {
  private games: Map<string, GameState> = new Map();

  createRoom(): string {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const game: GameState = {
      roomId,
      players: [],
      deck: createDeck(),
      currentTurn: 0,
      phase: 'waiting',
      round: 1,
      winner: null,
    };
    this.games.set(roomId, game);
    return roomId;
  }

  getGame(roomId: string): GameState | undefined {
    return this.games.get(roomId);
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
      wins: 0,
      isReady: false,
    };

    game.players.push(player);
    return player;
  }

  setReady(roomId: string, playerId: string): boolean {
    const game = this.games.get(roomId);
    if (!game) return false;

    const player = game.players.find(p => p.id === playerId);
    if (player) player.isReady = true;

    // Start if both ready
    if (game.players.length === 2 && game.players.every(p => p.isReady)) {
      this.startRound(roomId);
      return true;
    }
    return false;
  }

  startRound(roomId: string): void {
    const game = this.games.get(roomId);
    if (!game) return;

    // Reset
    game.deck = createDeck();
    game.winner = null;
    game.currentTurn = 0;
    game.phase = 'dealing';

    // Deal 2 cards to each player
    for (const player of game.players) {
      player.hand = [game.deck.pop()!, game.deck.pop()!];
      player.score = calculateScore(player.hand);
      player.status = isBlackjack(player.hand) ? 'blackjack' : 'playing';
    }

    // Check instant blackjacks
    const bjs = game.players.filter(p => p.status === 'blackjack');
    if (bjs.length > 0) {
      game.phase = 'result';
      if (bjs.length === 2) {
        game.winner = null; // tie
      } else {
        game.winner = bjs[0].id;
        bjs[0].wins++;
      }
    } else {
      game.phase = 'playing';
    }
  }

  hit(roomId: string, playerId: string): Card | null {
    const game = this.games.get(roomId);
    if (!game || game.phase !== 'playing') return null;

    const playerIdx = game.players.findIndex(p => p.id === playerId);
    if (playerIdx !== game.currentTurn) return null;

    const player = game.players[playerIdx];
    const card = game.deck.pop()!;
    player.hand.push(card);
    player.score = calculateScore(player.hand);

    if (player.score > 21) {
      player.status = 'bust';
      this.nextTurn(roomId);
    }

    return card;
  }

  stand(roomId: string, playerId: string): boolean {
    const game = this.games.get(roomId);
    if (!game || game.phase !== 'playing') return false;

    const playerIdx = game.players.findIndex(p => p.id === playerId);
    if (playerIdx !== game.currentTurn) return false;

    game.players[playerIdx].status = 'stand';
    this.nextTurn(roomId);
    return true;
  }

  private nextTurn(roomId: string): void {
    const game = this.games.get(roomId);
    if (!game) return;

    game.currentTurn++;

    // If all players done
    if (game.currentTurn >= game.players.length) {
      this.resolveRound(roomId);
    }
  }

  private resolveRound(roomId: string): void {
    const game = this.games.get(roomId);
    if (!game) return;

    game.phase = 'result';
    const [p1, p2] = game.players;
    const winnerId = determineWinner(p1, p2);
    game.winner = winnerId;

    if (winnerId) {
      const winner = game.players.find(p => p.id === winnerId);
      if (winner) winner.wins++;
    }

    game.round++;
  }

  nextRound(roomId: string): void {
    const game = this.games.get(roomId);
    if (!game) return;

    for (const player of game.players) {
      player.isReady = false;
      player.status = 'waiting';
      player.hand = [];
      player.score = 0;
    }
    game.phase = 'waiting';
    game.winner = null;
  }

  removePlayer(roomId: string, playerId: string): void {
    const game = this.games.get(roomId);
    if (!game) return;

    game.players = game.players.filter(p => p.id !== playerId);
    if (game.players.length === 0) {
      this.games.delete(roomId);
    }
  }
}

export const gameManager = new GameManager();
