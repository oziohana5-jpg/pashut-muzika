import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const EMOJIS = ['✨', '💿', '🎵', '💜', '⚡', '🌈', '🎧', '💫', '🎶', '⭐', '🎼', '🎛️', '🎚️', '🔊', '🎤', '🪩', '📀'];

interface ConfettiPiece {
  id: number;
  emoji: string;
  left: number;
  top: number;
  delay: number;
  size: number;
  drift: number;
  fallDistance: number;
  riseDistance: number;
}

const getCaretPosition = (element: HTMLInputElement | HTMLTextAreaElement) => {
  const bounds = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const valueBeforeCaret = element.value.slice(0, element.selectionStart ?? element.value.length);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return { left: bounds.left + bounds.width / 2, top: bounds.top + bounds.height / 2 };

  context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
  const textWidth = context.measureText(valueBeforeCaret).width;
  const paddingStart = parseFloat(styles.paddingInlineStart) || 0;
  const paddingEnd = parseFloat(styles.paddingInlineEnd) || 0;
  const isRtl = styles.direction === 'rtl' || document.documentElement.dir === 'rtl';
  const left = isRtl
    ? bounds.right - paddingEnd - textWidth + element.scrollLeft
    : bounds.left + paddingStart + textWidth - element.scrollLeft;
  return { left: Math.max(bounds.left + 8, Math.min(bounds.right - 8, left)), top: bounds.top + bounds.height * 0.42 };
};

export const EmojiConfetti: React.FC = () => {
  const { confettiEnabled } = useTheme();
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const nextPieceId = useRef(0);

  useEffect(() => {
    if (!confettiEnabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !['INPUT', 'TEXTAREA'].includes(target.tagName) || event.key.length !== 1) return;
      const now = Date.now();
      const caret = getCaretPosition(target as HTMLInputElement | HTMLTextAreaElement);
      const fallDistance = Math.max(0, window.innerHeight - caret.top + 180);
      const riseDistance = Math.max(180, caret.top + 100);
      const burst = Array.from({ length: 5 }, (_, index) => ({
        id: now * 100 + nextPieceId.current++,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        left: caret.left + (Math.random() - 0.5) * 18,
        top: caret.top + (Math.random() - 0.5) * 10,
        delay: Math.random() * 160,
        size: 14 + Math.random() * 10,
        drift: -60 + Math.random() * 120,
        fallDistance,
        riseDistance,
      }));
      setPieces((current) => [...current, ...burst].slice(-64));
      window.setTimeout(() => {
        setPieces((current) => current.filter((piece) => !burst.some((item) => item.id === piece.id)));
      }, 9000);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confettiEnabled]);

  return <div className="emoji-confetti-layer" aria-hidden="true">{pieces.map((piece) => <span key={piece.id} className="emoji-confetti-piece" style={{ left: `${piece.left}px`, top: `${piece.top}px`, animationDelay: `${piece.delay}ms`, fontSize: `${piece.size}px`, ['--drift' as string]: `${piece.drift}px`, ['--fall-distance' as string]: `${piece.fallDistance}px`, ['--rise-distance' as string]: `${piece.riseDistance}px` }}>{piece.emoji}</span>)}</div>;
};