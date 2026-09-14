/**
 * useOnlineUsers — AI-simulated online listener count
 *
 * פרופיל יממה (שעון ישראל):
 *  00–05  →  5–18   לילה
 *  05–07  → 15–60   השכמה
 *  07–09  → 80–250  peak בוקר
 *  09–12  → 60–180  בוקר מאוחר
 *  12–14  → 40–90   צהריים
 *  14–17  → 50–120  אחה"צ
 *  17–20  → 90–220  שיא ערב
 *  20–23  → 70–160  ערב
 *  23–00  → 20–55   לילה מוקדם
 *
 * עדכון: כל 3–6 שניות (תחושת real-time)
 * כל משתמש: שיר נוכחי + זמן נוכחי שמתקדם בזמן אמת
 * מייל: מוסתר → u***.c***@gmail.com
 */

import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SimSong {
  id: string;
  title: string;
  artistName: string;
  duration: number; // seconds
  coverUrl: string;
  youtubeId?: string;
  streamUrl?: string;
}

export interface OnlineUser {
  id: string;
  displayName: string;
  email: string;           // full email (hidden in UI)
  emailMasked: string;     // e.g. "u***.c***@gmail.com"
  avatarSeed: number;
  song: SimSong;
  songStartedAt: number;   // Date.now() when they "started" the song
  songOffset: number;      // initial offset in seconds when assigned
}

export interface OnlineUsersState {
  count: number;
  users: OnlineUser[];
  isLoaded: boolean;
}

// ─── Israeli names pool ───────────────────────────────────────────────────────

const FIRST_NAMES = [
  'אורי','יובל','נועה','תמר','עידו','מיכל','רוני','שירה','גלעד','ליאור',
  'אביתר','הילה','עמית','יעל','אלון','ענת','שחר','אורית','עידן','נועם',
  'דנה','אסף','רחל','ניב','ליאת','בן','מאיה','איתן','רוית','כרמל',
  'יונתן','נטע','אמיר','שני','עוז','קרן','גיא','דפנה','אדם','טל',
  'ניר','הדס','רז','מור','אלי','שלי','אורן','יפית','ברק','ספיר',
  'דרור','נגה','עמנואל','ריטה','שמעון','ורד','אריאל','עדן','רועי','טלי',
  'פלג','נדב','מנור','לירן','אופיר','מיה','גיל','שיר','בועז','ורדית',
  'אלמוג','צחי','הגר','ראם','ציון','רינת','שקד','עפר','ינון','ירדן',
];

const LAST_NAMES = [
  'כהן','לוי','מזרחי','פרץ','ביטון','אברהם','גבאי','שמש','דהן','בן דוד',
  'אוחיון','שפירא','פרידמן','גולדברג','רוזנברג','שטרן','ברגר','גרין','הלר','ויס',
  'אלון','נחמני','שמואלי','חיים','טייב','אסרף','בנימין','עמר','יוסף','רחמים',
  'מלכה','ניסים','אטיאס','חדד','סויסה','כץ','בלום','שוורץ','זיו','שלום',
  'קאופמן','לנדאו','ראובן','עובדיה','שמיר','הרוש','גנץ','אריאלי','נגר','בר',
];

// ─── Song pool (ישראלי + בינלאומי) ──────────────────────────────────────────

export const SIM_SONGS: SimSong[] = [
  // עומר אדם
  { id: 'ss1',  title: 'שני משוגעים',    artistName: 'עומר אדם',        duration: 171, coverUrl: 'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  { id: 'ss2',  title: 'פסקו חיים',      artistName: 'עומר אדם',        duration: 196, coverUrl: 'https://i.ytimg.com/vi/2wXHBnSZ4oc/hqdefault.jpg' },
  { id: 'ss3',  title: 'תן לגיגי',       artistName: 'עומר אדם',        duration: 215, coverUrl: 'https://i.ytimg.com/vi/0fknKMkbRxc/hqdefault.jpg' },
  // חנן בן ארי
  { id: 'ss4',  title: 'מה שאני',        artistName: 'חנן בן ארי',      duration: 214, coverUrl: 'https://i.ytimg.com/vi/5mMIlqg5Gfk/hqdefault.jpg' },
  { id: 'ss5',  title: 'ויקיפדיה',       artistName: 'חנן בן ארי',      duration: 208, coverUrl: 'https://i.ytimg.com/vi/ZhBFl7lH8k8/hqdefault.jpg' },
  { id: 'ss6',  title: 'מות',            artistName: 'חנן בן ארי',      duration: 169, coverUrl: 'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  // מושיר כהן
  { id: 'ss7',  title: 'כולם בגן עדן',   artistName: 'מושיר כהן',       duration: 247, coverUrl: 'https://i.ytimg.com/vi/Oi7w2bJFMdI/hqdefault.jpg' },
  { id: 'ss8',  title: 'הנבחרת',         artistName: 'מושיר כהן',       duration: 189, coverUrl: 'https://i.ytimg.com/vi/Oi7w2bJFMdI/hqdefault.jpg' },
  // שלמה ארצי
  { id: 'ss9',  title: 'ירח',            artistName: 'שלמה ארצי',       duration: 270, coverUrl: 'https://i.ytimg.com/vi/OoFBHkFPdE8/hqdefault.jpg' },
  { id: 'ss10', title: 'תתארו לכם',      artistName: 'שלמה ארצי',       duration: 245, coverUrl: 'https://i.ytimg.com/vi/OoFBHkFPdE8/hqdefault.jpg' },
  // Coldplay
  { id: 'ss11', title: 'Viva La Vida',         artistName: 'Coldplay',   duration: 242, coverUrl: 'https://i.ytimg.com/vi/dvgZkm1xWPE/hqdefault.jpg' },
  { id: 'ss12', title: 'A Sky Full of Stars',  artistName: 'Coldplay',   duration: 268, coverUrl: 'https://i.ytimg.com/vi/VPRjCeoBqrI/hqdefault.jpg' },
  { id: 'ss13', title: 'Yellow',               artistName: 'Coldplay',   duration: 269, coverUrl: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg' },
  { id: 'ss14', title: 'Fix You',              artistName: 'Coldplay',   duration: 295, coverUrl: 'https://i.ytimg.com/vi/k4V3Mo61fJM/hqdefault.jpg' },
  { id: 'ss15', title: 'The Scientist',        artistName: 'Coldplay',   duration: 309, coverUrl: 'https://i.ytimg.com/vi/RB-RcX5DS5A/hqdefault.jpg' },
  // The Weeknd
  { id: 'ss16', title: 'Blinding Lights',      artistName: 'The Weeknd', duration: 200, coverUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg' },
  { id: 'ss17', title: 'Save Your Tears',      artistName: 'The Weeknd', duration: 215, coverUrl: 'https://i.ytimg.com/vi/XXYlFuWiqLg/hqdefault.jpg' },
  // טונה
  { id: 'ss18', title: 'בן זה יעבור',    artistName: 'טונה',            duration: 260, coverUrl: 'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  { id: 'ss19', title: 'סחרחורת',        artistName: 'טונה',            duration: 235, coverUrl: 'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  // פאר טסי
  { id: 'ss20', title: 'מדבקה חומה',     artistName: 'פאר טסי',         duration: 214, coverUrl: 'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
];

// ─── Seeded random ────────────────────────────────────────────────────────────

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─── Email masking ────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  // mask local: keep first char + *** + last char if > 2
  const maskedLocal = local.length <= 2
    ? local[0] + '***'
    : local[0] + '***' + local[local.length - 1];
  // mask domain: keep TLD visible, hide most of name
  const dotIdx = domain.lastIndexOf('.');
  const tld = domain.slice(dotIdx); // ".com", ".co.il" etc.
  const domainName = domain.slice(0, dotIdx);
  const maskedDomain = domainName[0] + '***' + tld;
  return `${maskedLocal}@${maskedDomain}`;
}

// ─── Hebrew → Latin (for email) ──────────────────────────────────────────────

function transliterate(heb: string): string {
  const map: Record<string, string> = {
    'א':'a','ב':'b','ג':'g','ד':'d','ה':'h','ו':'v','ז':'z','ח':'ch','ט':'t',
    'י':'y','כ':'k','ך':'k','ל':'l','מ':'m','ם':'m','נ':'n','ן':'n','ס':'s',
    'ע':'e','פ':'p','ף':'p','צ':'tz','ץ':'tz','ק':'k','ר':'r','ש':'sh','ת':'t',
  };
  return heb.split('').map(c => map[c] ?? c).join('');
}

const EMAIL_DOMAINS = [
  'gmail.com','gmail.com','gmail.com', // gmail שכיח יותר
  'walla.co.il','hot.net.il','bezeqint.net',
  'icloud.com','yahoo.com','outlook.com',
];

// ─── Build a single simulated user ───────────────────────────────────────────

function buildUser(id: number): Omit<OnlineUser, 'song' | 'songStartedAt' | 'songOffset'> {
  const rand = seededRand(id * 31337 + 7);
  const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
  const last  = LAST_NAMES [Math.floor(rand() * LAST_NAMES.length)];
  const latinFirst = transliterate(first);
  const latinLast  = transliterate(last);
  const num    = Math.floor(rand() * 900) + 100;
  const domain = EMAIL_DOMAINS[Math.floor(rand() * EMAIL_DOMAINS.length)];
  const email  = `${latinFirst}.${latinLast}${num}@${domain}`.toLowerCase();
  return {
    id: `sim_${id}`,
    displayName: `${first} ${last}`,
    email,
    emailMasked: maskEmail(email),
    avatarSeed: Math.floor(rand() * 100),
  };
}

// Pre-generate 400 user base objects (without song — assigned dynamically)
const USER_BASE = Array.from({ length: 400 }, (_, i) => buildUser(i));

// ─── Assign songs to users ────────────────────────────────────────────────────

let _songRngState = 0xdeadbeef;
function songRand(): number {
  _songRngState = (Math.imul(_songRngState, 1664525) + 1013904223) >>> 0;
  return _songRngState / 0x100000000;
}

function assignSongs(count: number): OnlineUser[] {
  const now = Date.now();
  return USER_BASE.slice(0, Math.min(count, USER_BASE.length)).map((base) => {
    const song = SIM_SONGS[Math.floor(songRand() * SIM_SONGS.length)];
    // Random position in the song (10%–90% through)
    const minOff = Math.floor(song.duration * 0.10);
    const maxOff = Math.floor(song.duration * 0.90);
    const songOffset = minOff + Math.floor(songRand() * (maxOff - minOff));
    return { ...base, song, songOffset, songStartedAt: now };
  });
}

// ─── Time-based count logic ───────────────────────────────────────────────────

interface HourSlot { min: number; max: number; }

function getHourSlot(hour: number): HourSlot {
  if (hour < 5)  return { min: 5,   max: 18  };
  if (hour < 7)  return { min: 15,  max: 60  };
  if (hour < 9)  return { min: 80,  max: 250 };
  if (hour < 12) return { min: 60,  max: 180 };
  if (hour < 14) return { min: 40,  max: 90  };
  if (hour < 17) return { min: 50,  max: 120 };
  if (hour < 20) return { min: 90,  max: 220 };
  if (hour < 23) return { min: 70,  max: 160 };
  return { min: 20, max: 55 };
}

let _noiseState = Date.now() & 0xffffffff;
function noiseRand(): number {
  _noiseState = (Math.imul(_noiseState, 1664525) + 1013904223) >>> 0;
  return _noiseState / 0x100000000;
}

function gaussianNoise(std: number): number {
  const u = (noiseRand() + noiseRand() + noiseRand()) / 3;
  return (u - 0.5) * 2 * std;
}

function computeRealisticCount(current: number): number {
  const slot = getHourSlot(new Date().getHours());
  const mid   = (slot.min + slot.max) / 2;
  const range = slot.max - slot.min;
  const pull  = (mid - current) * 0.08;
  const noise = gaussianNoise(range * 0.10);
  const spike = noiseRand() < 0.05
    ? (noiseRand() * range * 0.12) * (noiseRand() > 0.5 ? 1 : -1)
    : 0;
  return Math.max(slot.min, Math.min(slot.max, Math.round(current + pull + noise + spike)));
}

function initialCount(): number {
  const slot = getHourSlot(new Date().getHours());
  const mid  = (slot.min + slot.max) / 2;
  return Math.round(mid + gaussianNoise((slot.max - slot.min) * 0.15));
}

// ─── How many seconds into the song is a user right now? ─────────────────────

export function getLivePosition(user: OnlineUser): number {
  const elapsed = (Date.now() - user.songStartedAt) / 1000;
  const pos = user.songOffset + elapsed;
  // loop if past end
  return pos % user.song.duration;
}

// ─── The hook ─────────────────────────────────────────────────────────────────

export function useOnlineUsers(): OnlineUsersState {
  const [count, setCount]   = useState<number>(initialCount);
  const [users, setUsers]   = useState<OnlineUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const countRef = useRef(count);

  useEffect(() => { countRef.current = count; }, [count]);

  useEffect(() => {
    // Immediate first render
    const init = countRef.current;
    setUsers(assignSongs(init));
    setIsLoaded(true);

    // ── Count tick: every 3–6 seconds (smooth real-time feel)
    let countTimer: ReturnType<typeof setTimeout>;

    const tickCount = () => {
      const next = computeRealisticCount(countRef.current);
      countRef.current = next;
      setCount(next);

      // Reassign songs for users that just joined / left
      setUsers(prev => {
        if (next === prev.length) return prev;
        if (next > prev.length) {
          // Add new users at the end
          const extra = assignSongs(next).slice(prev.length);
          return [...prev, ...extra];
        }
        // Remove from end
        return prev.slice(0, next);
      });

      const delay = 3_000 + Math.floor(noiseRand() * 3_000);
      countTimer = setTimeout(tickCount, delay);
    };

    countTimer = setTimeout(tickCount, 4_000);

    // ── Song rotation tick: every ~30 seconds some users change songs
    let songTimer: ReturnType<typeof setTimeout>;

    const tickSongs = () => {
      setUsers(prev => {
        const now = Date.now();
        return prev.map(u => {
          // ~15% chance per user to rotate to next song each cycle
          if (noiseRand() > 0.15) return u;
          const newSong   = SIM_SONGS[Math.floor(songRand() * SIM_SONGS.length)];
          const newOffset = Math.floor(newSong.duration * 0.05); // start near beginning
          return { ...u, song: newSong, songOffset: newOffset, songStartedAt: now };
        });
      });
      songTimer = setTimeout(tickSongs, 28_000 + Math.floor(noiseRand() * 10_000));
    };

    songTimer = setTimeout(tickSongs, 30_000);

    return () => {
      clearTimeout(countTimer);
      clearTimeout(songTimer);
    };
  }, []);

  return { count, users, isLoaded };
}
