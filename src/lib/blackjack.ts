// Card types and game logic
export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  hidden?: boolean;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  status: 'playing' | 'stand' | 'bust' | 'blackjack' | 'waiting';
  wins: number;
  isReady: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  deck: Card[];
  currentTurn: number;
  phase: 'waiting' | 'dealing' | 'playing' | 'result';
  round: number;
  winner: string | null;
  createdAt: number;
}

// Create a shuffled deck (6 decks)
export function createDeck(): Card[] {
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];
  
  for (let d = 0; d < 6; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank });
      }
    }
  }
  
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

// Calculate hand value
export function calculateScore(hand: Card[]): number {
  let score = 0;
  let aces = 0;
  
  for (const card of hand) {
    if (card.hidden) continue;
    if (card.rank === 'A') {
      aces++;
      score += 11;
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
      score += 10;
    } else {
      score += parseInt(card.rank);
    }
  }
  
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  
  return score;
}

// Check if hand is blackjack
export function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && calculateScore(hand) === 21;
}

// Get card color
export function getCardColor(suit: Suit): string {
  return suit === '♥' || suit === '♦' ? '#ff073a' : '#00f5ff';
}

// Determine winner
export function determineWinner(p1: Player, p2: Player): string | null {
  if (p1.status === 'bust' && p2.status === 'bust') return null;
  if (p1.status === 'bust') return p2.id;
  if (p2.status === 'bust') return p1.id;
  if (p1.status === 'blackjack' && p2.status !== 'blackjack') return p1.id;
  if (p2.status === 'blackjack' && p1.status !== 'blackjack') return p2.id;
  if (p1.score > p2.score) return p1.id;
  if (p2.score > p1.score) return p2.id;
  return null;
}
