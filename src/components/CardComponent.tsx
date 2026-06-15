'use client';

import { Card, getCardColor } from '@/lib/blackjack';

interface Props {
  card: Card;
  index: number;
  isOpponent?: boolean;
}

export default function CardComponent({ card, index, isOpponent }: Props) {
  if (card.hidden) {
    return (
      <div
        className="card-back w-16 h-24 md:w-20 md:h-28 rounded-lg flex items-center justify-center animate-card-deal"
        style={{ animationDelay: `${index * 0.2}s` }}
      >
        <span className="text-3xl opacity-50">?</span>
      </div>
    );
  }

  const color = getCardColor(card.suit);
  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div
      className="w-16 h-24 md:w-20 md:h-28 rounded-lg flex flex-col items-center justify-between p-1.5 animate-card-deal relative overflow-hidden"
      style={{
        animationDelay: `${index * 0.2}s`,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%)',
        border: `2px solid ${color}`,
        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}40`,
      }}
    >
      {/* Top left */}
      <div className="self-start">
        <span className="text-xs md:text-sm font-bold font-['Orbitron']" style={{ color }}>
          {card.rank}
        </span>
      </div>

      {/* Center suit */}
      <span className="text-2xl md:text-3xl" style={{ color, textShadow: `0 0 10px ${color}` }}>
        {card.suit}
      </span>

      {/* Bottom right */}
      <div className="self-end rotate-180">
        <span className="text-xs md:text-sm font-bold font-['Orbitron']" style={{ color }}>
          {card.rank}
        </span>
      </div>

      {/* Glow overlay */}
      <div
        className="absolute inset-0 opacity-5 rounded-lg"
        style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }}
      />
    </div>
  );
}
