import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const EMOJIS = ['✨', '💿', '🎵', '💜', '⚡', '🌈', '🎧', '💫', '🎶', '⭐'];

interface ConfettiPiece {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  size: number;
  drift: number;
}

export const EmojiConfetti: React.FC = () => {
  const { confettiEnabled } = useTheme();
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!confettiEnabled) return;
    let lastBurst = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !['INPUT', 'TEXTAREA'].includes(target.tagName) || event.key.length !== 1) return;
      const now = Date.now();
      if (now - lastBurst < 550) return;
      lastBurst = now;
      const burst = Array.from({ length: 8 }, (_, index) => ({
        id: now + index,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        left: 6 + Math.random() * 88,
        delay: Math.random() * 120,
        size: 14 + Math.random() * 10,
        drift: -60 + Math.random() * 120,
      }));
      setPieces((current) => [...current, ...burst].slice(-32));
      window.setTimeout(() => setPieces((current) => current.filter((piece) => !burst.some((item) => item.id === piece.id))), 1900);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confettiEnabled]);

  return <div className="emoji-confetti-layer" aria-hidden="true">{pieces.map((piece) => <span key={piece.id} className="emoji-confetti-piece" style={{ left: `${piece.left}%`, animationDelay: `${piece.delay}ms`, fontSize: `${piece.size}px`, ['--drift' as string]: `${piece.drift}px` }}>{piece.emoji}</span>)}</div>;
};