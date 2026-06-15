import { GameState, Player, Card, createDeck, calculateScore, isBlackjack, determineWinner } from './blackjack';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const STORE_DIR = '/tmp/neon-blackjack-rooms';

// Ensure store directory exists
function ensureDir() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function getRoomPath(roomId: string): string {
  return path.join(STORE_DIR, `${roomId}.json`);
}

function loadGame(roomId: string): GameState | null {
  ensureDir();
  const filePath = getRoomPath(roomId);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as GameState;
    }
  } catch (e) {
    console.error('Failed to load game:', e);
  }
  return null;
}

function saveGame(game: GameState) {
  ensureDir();
  const filePath = getRoomPath(game.roomId);
  fs.writeFileSync(filePath, JSON.stringify(game), 'utf-8');
}

function deleteGame(roomId: string) {
  const filePath = getRoomPath(roomId);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    // ignore
  }
}

export class GameManager {
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private cleanup() {
    ensureDir();
    try {
      const files = fs.readdirSync(STORE_DIR);
      const now = Date.now();
      for (const file of files) {
        const filePath = path.join(STORE_DIR, file);
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          const game = JSON.parse(data) as GameState;
          // Remove games older than 30 minutes
          if (now - game.createdAt > 1800000) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          // Remove corrupted files
          try { fs.unlinkSync(filePath); } catch (_) {}
        }
      }
    } catch (e) {
      // ignore
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
      turnStartedAt: null,
      turnDuration: 15,
    };
    saveGame(game);
    return roomId;
  }

  joinRoom(roomId: string, playerName: string): Player | null {
    const game = loadGame(roomId);
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
    saveGame(game);
    return player;
  }

  getGame(roomId: string): GameState | undefined {
    const game = loadGame(roomId);
    if (game) {
      this.checkTimer(game);
      saveGame(game); // Save in case timer triggered auto-stand
      return game;
    }
    return undefined;
  }

  // Auto-stand if timer expired
  private checkTimer(game: GameState) {
    if (game.phase !== 'playing' || !game.turnStartedAt) return;

    const elapsed = (Date.now() - game.turnStartedAt) / 1000;
    if (elapsed >= game.turnDuration) {
      const currentPlayer = game.players[game.currentTurn];
      if (currentPlayer && currentPlayer.status === 'playing') {
        currentPlayer.status = 'stand';
        this.nextTurn(game);
      }
    }
  }

  setReady(roomId: string, playerId: string) {
    const game = loadGame(roomId);
    if (!game) return;

    const player = game.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = true;
    }

    // If both players are ready, start the game
    if (game.players.length === 2 && game.players.every(p => p.isReady)) {
      this.startRound(game);
    }
    saveGame(game);
  }

  private startRound(game: GameState) {
    game.deck = createDeck();
    game.phase = 'playing';
    game.winner = null;
    game.currentTurn = 0;
    game.turnStartedAt = Date.now();

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
    const game = loadGame(roomId);
    if (!game || game.phase !== 'playing') return;

    this.checkTimer(game);

    const currentPlayer = game.players[game.currentTurn];
    if (currentPlayer.id !== playerId) {
      saveGame(game);
      return;
    }

    // Draw a card
    const card = game.deck.pop();
    if (!card) {
      saveGame(game);
      return;
    }

    currentPlayer.hand.push(card);
    currentPlayer.score = calculateScore(currentPlayer.hand);

    // Check bust
    if (currentPlayer.score > 21) {
      currentPlayer.status = 'bust';
      this.nextTurn(game);
    }
    saveGame(game);
  }

  stand(roomId: string, playerId: string) {
    const game = loadGame(roomId);
    if (!game || game.phase !== 'playing') return;

    this.checkTimer(game);

    const currentPlayer = game.players[game.currentTurn];
    if (currentPlayer.id !== playerId) {
      saveGame(game);
      return;
    }

    currentPlayer.status = 'stand';
    this.nextTurn(game);
    saveGame(game);
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
    game.turnStartedAt = Date.now();

    // Skip players who are already done
    if (game.players[game.currentTurn].status !== 'playing') {
      this.endRound(game);
    }
  }

  private endRound(game: GameState) {
    game.phase = 'result';
    game.turnStartedAt = null;
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
    const game = loadGame(roomId);
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
    saveGame(game);
  }
}

export const gameManager = new GameManager();
