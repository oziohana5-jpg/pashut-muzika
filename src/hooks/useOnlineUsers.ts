/**
 * useOnlineUsers — AI-simulated online listener count
 *
 * לוגיקת האנשים המחוברים מבוססת על:
 * 1. פרופיל שעה ביום (Prime-time / נמוך / ביניים)
 * 2. רעש גאוסי קטן שמשתנה כל 20-35 שניות
 * 3. "ספייקים" קצרים ואקראיים שנותנים תחושה אמיתית
 * 4. 0 משתמשים בלילה עמוק (2-5 לפנות בוקר) — לא מוגדר כרגע
 *
 * כך נראה פרופיל יממה מלא (שעון ישראל, UTC+3 בקיץ):
 *  00–05  → 5–18  (לילה)
 *  05–07  → 15–60  (השכמה)
 *  07–09  → 80–250 (peak בוקר)
 *  09–12  → 60–180 (בוקר מאוחר)
 *  12–14  → 40–90  (צהריים)
 *  14–17  → 50–120 (אחה"צ)
 *  17–20  → 90–220 (שיא ערב)
 *  20–23  → 70–160 (ערב)
 *  23–00  → 20–55  (לילה מוקדם)
 */

import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnlineUser {
  id: string;
  displayName: string;
  email: string;
  avatarSeed: number; // 0-99, used for deterministic avatar URL
}

export interface OnlineUsersState {
  count: number;
  users: OnlineUser[];
  isLoaded: boolean;
}

// ─── Israeli first + last names pool ─────────────────────────────────────────

const FIRST_NAMES = [
  'אורי', 'יובל', 'נועה', 'תמר', 'עידו', 'מיכל', 'רוני', 'שירה', 'גלעד', 'ליאור',
  'אביתר', 'הילה', 'עמית', 'יעל', 'אלון', 'ענת', 'שחר', 'אורית', 'עידן', 'נועם',
  'דנה', 'אסף', 'רחל', 'ניב', 'ליאת', 'בן', 'מאיה', 'איתן', 'רוית', 'כרמל',
  'יונתן', 'נטע', 'אמיר', 'שני', 'עוז', 'קרן', 'גיא', 'דפנה', 'אדם', 'טל',
  'ניר', 'הדס', 'רז', 'מור', 'אלי', 'שלי', 'אורן', 'יפית', 'ברק', 'ספיר',
  'דרור', 'נגה', 'עמנואל', 'ריטה', 'שמעון', 'ורד', 'אריאל', 'עדן', 'רועי', 'טלי',
  'פלג', 'נדב', 'מנור', 'לירן', 'אופיר', 'מיה', 'גיל', 'שיר', 'בועז', 'ורדית',
  'אלמוג', 'צחי', 'הגר', 'ראם', 'ציון', 'רינת', 'שקד', 'עפר', 'ינון', 'ירדן',
];

const LAST_NAMES = [
  'כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'אברהם', 'גבאי', 'שמש', 'דהן', 'בן דוד',
  'אוחיון', 'שפירא', 'פרידמן', 'גולדברג', 'רוזנברג', 'שטרן', 'ברגר', 'גרין', 'הלר', 'ויס',
  'אלון', 'נחמני', 'שמואלי', 'חיים', 'טייב', 'אסרף', 'בנימין', 'עמר', 'יוסף', 'רחמים',
  'מלכה', 'ניסים', 'אטיאס', 'חדד', 'סויסה', 'כץ', 'בלום', 'שוורץ', 'זיו', 'שלום',
  'קאופמן', 'לנדאו', 'ראובן', 'עובדיה', 'שמיר', 'הרוש', 'גנץ', 'אריאלי', 'נגר', 'בר',
];

const EMAIL_DOMAINS = [
  'gmail.com', 'walla.co.il', 'bezeqint.net', 'hot.net.il',
  'yahoo.com', 'icloud.com', 'outlook.com', 'netvision.net.il',
];

// ─── Seeded random (deterministic per user id) ───────────────────────────────

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function buildUser(id: number): OnlineUser {
  const rand = seededRand(id * 31337 + 7);
  const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
  const displayName = `${first} ${last}`;
  const emailUser = `${first.replace(/[^\x00-\x7F]/g, '')}${last.replace(/[^\x00-\x7F]/g, '')}${Math.floor(rand() * 900) + 100}`;
  const domain = EMAIL_DOMAINS[Math.floor(rand() * EMAIL_DOMAINS.length)];
  // transliterate Hebrew to Latin for email
  const latinFirst = transliterate(first);
  const latinLast = transliterate(last);
  const num = Math.floor(rand() * 900) + 100;
  return {
    id: `sim_${id}`,
    displayName,
    email: `${latinFirst}.${latinLast}${num}@${domain}`.toLowerCase(),
    avatarSeed: Math.floor(rand() * 100),
  };
}

// Simple Hebrew → Latin transliteration for email addresses
function transliterate(heb: string): string {
  const map: Record<string, string> = {
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v',
    'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k',
    'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's',
    'ע': 'e', 'פ': 'p', 'ף': 'p', 'צ': 'tz', 'ץ': 'tz', 'ק': 'k',
    'ר': 'r', 'ש': 'sh', 'ת': 't',
  };
  return heb.split('').map(c => map[c] ?? c).join('');
}

// ─── Pre-generate a large pool of fake users ─────────────────────────────────

const USER_POOL: OnlineUser[] = Array.from({ length: 400 }, (_, i) => buildUser(i));

// ─── Time-based target count logic ───────────────────────────────────────────

interface HourSlot {
  min: number;
  max: number;
}

/** Returns the expected listener range for the current local hour (0-23) */
function getHourSlot(hour: number): HourSlot {
  // Night deep  00-05
  if (hour < 5)  return { min: 5,   max: 18  };
  // Early morning 05-07
  if (hour < 7)  return { min: 15,  max: 60  };
  // Morning peak  07-09
  if (hour < 9)  return { min: 80,  max: 250 };
  // Late morning  09-12
  if (hour < 12) return { min: 60,  max: 180 };
  // Noon          12-14
  if (hour < 14) return { min: 40,  max: 90  };
  // Afternoon     14-17
  if (hour < 17) return { min: 50,  max: 120 };
  // Evening peak  17-20
  if (hour < 20) return { min: 90,  max: 220 };
  // Evening       20-23
  if (hour < 23) return { min: 70,  max: 160 };
  // Late night    23-00
  return { min: 20, max: 55 };
}

/** Gaussian-like noise: average of 3 uniforms → bell-curve without Math.log */
function gaussianNoise(rand: () => number, std: number): number {
  const u = (rand() + rand() + rand()) / 3;  // 0-1 bell
  return (u - 0.5) * 2 * std;                // centered, ±std
}

let _noiseRngState = Date.now();
function noiseRand(): number {
  _noiseRngState = (_noiseRngState * 1664525 + 1013904223) & 0xffffffff;
  return (_noiseRngState >>> 0) / 0xffffffff;
}

/**
 * Returns a realistic listener count for the current moment.
 * currentCount is used to apply smooth ±drift instead of jumping wildly.
 */
function computeRealisticCount(currentCount: number): number {
  const hour = new Date().getHours();
  const slot = getHourSlot(hour);

  // Base target: somewhere in the slot range, biased toward middle
  const mid = (slot.min + slot.max) / 2;
  const range = slot.max - slot.min;

  // How far we are from the "natural middle" — pull back gently
  const pullStrength = 0.08;
  const pull = (mid - currentCount) * pullStrength;

  // Random walk step ±5–15% of the range
  const stepSize = range * 0.10;
  const noise = gaussianNoise(noiseRand, stepSize);

  // Occasional small spike (5% chance)
  const spike = noiseRand() < 0.05 ? (noiseRand() * range * 0.12) * (noiseRand() > 0.5 ? 1 : -1) : 0;

  let next = Math.round(currentCount + pull + noise + spike);

  // Hard clamp to valid range
  next = Math.max(slot.min, Math.min(slot.max, next));
  return next;
}

// ─── Initial count (before first tick) ───────────────────────────────────────

function initialCount(): number {
  const hour = new Date().getHours();
  const slot = getHourSlot(hour);
  const frac = (slot.min + slot.max) / 2;
  return Math.round(frac + (noiseRand() - 0.5) * (slot.max - slot.min) * 0.3);
}

// ─── The hook ─────────────────────────────────────────────────────────────────

export function useOnlineUsers(): OnlineUsersState {
  const [count, setCount] = useState<number>(initialCount);
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const countRef = useRef(count);

  // Keep ref in sync
  useEffect(() => { countRef.current = count; }, [count]);

  useEffect(() => {
    // First paint — set users immediately
    const c = countRef.current;
    setUsers(USER_POOL.slice(0, Math.min(c, USER_POOL.length)));
    setIsLoaded(true);

    // Tick every 20-35 seconds (random interval for realism)
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const next = computeRealisticCount(countRef.current);
      setCount(next);
      setUsers(USER_POOL.slice(0, Math.min(next, USER_POOL.length)));

      // Next tick: random 20-35s
      const delay = 20_000 + Math.floor(noiseRand() * 15_000);
      timeoutId = setTimeout(tick, delay);
    };

    // First tick after 25s
    timeoutId = setTimeout(tick, 25_000);

    return () => clearTimeout(timeoutId);
  }, []);

  return { count, users, isLoaded };
}
