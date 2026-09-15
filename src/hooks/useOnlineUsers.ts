import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SimSong {
  id: string;
  title: string;
  artistName: string;
  duration: number;
  coverUrl: string;
  streamUrl?: string;
}

export interface SimFeedback {
  id: string;
  userName: string;
  userEmail: string;
  message: string;
  createdAt: string;
  adminReply?: string;      // תשובת מנהל
  repliedAt?: string;       // מתי נענה
}

export interface OnlineUser {
  id: string;
  displayName: string;
  email: string;
  emailMasked: string;
  avatarSeed: number;
  song: SimSong;
  songStartedAt: number;
  songOffset: number;
}

export interface OnlineUsersState {
  count: number;
  users: OnlineUser[];
  isLoaded: boolean;
  simFeedback: SimFeedback[];
  replyToFeedback: (id: string, reply: string) => void;
}

// ─── Names ────────────────────────────────────────────────────────────────────

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

const EMAIL_DOMAINS = [
  'gmail.com','gmail.com','gmail.com','gmail.com',
  'walla.co.il','hot.net.il','bezeqint.net','icloud.com','yahoo.com','outlook.com',
];

// ─── Song pool — תמונות מ-Last.fm / Wikipedia (ללא CORS block) ───────────────

export const SIM_SONGS: SimSong[] = [
  // עומר אדם
  { id:'ss1',  title:'שני משוגעים',   artistName:'עומר אדם',    duration:171,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss2',  title:'פסקו חיים',     artistName:'עומר אדם',    duration:196,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss3',  title:'תן לגיגי',      artistName:'עומר אדם',    duration:215,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss4',  title:'נועצת מבט',     artistName:'עומר אדם',    duration:230,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  // חנן בן ארי
  { id:'ss5',  title:'מה שאני',       artistName:'חנן בן ארי',  duration:214,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss6',  title:'ויקיפדיה',      artistName:'חנן בן ארי',  duration:208,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss7',  title:'מן תרצי',       artistName:'חנן בן ארי',  duration:176,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss8',  title:'עטלף עיוור',    artistName:'חנן בן ארי',  duration:225,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  // מושיר כהן
  { id:'ss9',  title:'כולם בגן עדן',  artistName:'מושיר כהן',   duration:247,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss10', title:'הנבחרת',        artistName:'מושיר כהן',   duration:189,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss11', title:'מעולם ועד',     artistName:'מושיר כהן',   duration:287,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  // שלמה ארצי
  { id:'ss12', title:'ירח',           artistName:'שלמה ארצי',   duration:270,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss13', title:'תתארו לכם',     artistName:'שלמה ארצי',   duration:245,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  // טונה
  { id:'ss14', title:'בן זה יעבור',   artistName:'טונה',        duration:260,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss15', title:'סחרחורת',       artistName:'טונה',        duration:235,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss16', title:'היי ביי',       artistName:'טונה',        duration:210,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  // פאר טסי
  { id:'ss17', title:'מדבקה חומה',    artistName:'פאר טסי',     duration:214,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss18', title:'הרי השמש',      artistName:'פאר טסי',     duration:220,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  // אייל גולן
  { id:'ss19', title:'תפסת לי את הלב', artistName:'אייל גולן',  duration:218,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss20', title:'רק את',          artistName:'אייל גולן',  duration:224,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  // נועה קירל
  { id:'ss21', title:'ביצה',           artistName:'נועה קירל',  duration:192,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss22', title:'אחד על אחד',     artistName:'נועה קירל',  duration:198,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  // Static & Ben El
  { id:'ss23', title:'Beautiful Life', artistName:'Static & Ben El', duration:215,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  { id:'ss24', title:'So Long',        artistName:'Static & Ben El', duration:203,
    coverUrl:'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png' },
  // Coldplay — cover URLs from MusicBrainz CDN (no CORS block)
  { id:'ss25', title:'Viva La Vida',         artistName:'Coldplay', duration:242,
    coverUrl:'https://coverartarchive.org/release/a9ba7b64-0fd7-440e-a5e6-b5b2dbb5ac9e/front-250' },
  { id:'ss26', title:'A Sky Full of Stars',  artistName:'Coldplay', duration:268,
    coverUrl:'https://coverartarchive.org/release/29ff3e08-7188-4b27-b92a-9ce73e0720f9/front-250' },
  { id:'ss27', title:'Yellow',               artistName:'Coldplay', duration:269,
    coverUrl:'https://coverartarchive.org/release/b84ee12a-09ef-421b-82de-0441a926375b/front-250' },
  { id:'ss28', title:'Fix You',              artistName:'Coldplay', duration:295,
    coverUrl:'https://coverartarchive.org/release/b84ee12a-09ef-421b-82de-0441a926375b/front-250' },
  { id:'ss29', title:'The Scientist',        artistName:'Coldplay', duration:309,
    coverUrl:'https://coverartarchive.org/release/b84ee12a-09ef-421b-82de-0441a926375b/front-250' },
  // The Weeknd
  { id:'ss30', title:'Blinding Lights',  artistName:'The Weeknd', duration:200,
    coverUrl:'https://coverartarchive.org/release/3ac81704-9b0a-4c83-b9b1-8d4e7a1ba86f/front-250' },
  { id:'ss31', title:'Save Your Tears',  artistName:'The Weeknd', duration:215,
    coverUrl:'https://coverartarchive.org/release/3ac81704-9b0a-4c83-b9b1-8d4e7a1ba86f/front-250' },
  { id:'ss32', title:'Starboy',          artistName:'The Weeknd', duration:230,
    coverUrl:'https://coverartarchive.org/release/9d8b9c5e-09c0-4fd7-b5d1-01e07a21b8b7/front-250' },
  // Drake
  { id:'ss33', title:'One Dance',        artistName:'Drake', duration:173,
    coverUrl:'https://coverartarchive.org/release/b5e4f0ab-a2df-4c28-97ea-f3ac4f0d2c8e/front-250' },
  { id:'ss34', title:"God's Plan",       artistName:'Drake', duration:198,
    coverUrl:'https://coverartarchive.org/release/b5e4f0ab-a2df-4c28-97ea-f3ac4f0d2c8e/front-250' },
  // Taylor Swift
  { id:'ss35', title:'Anti-Hero',        artistName:'Taylor Swift', duration:200,
    coverUrl:'https://coverartarchive.org/release/2f4b2b9b-c78c-4b8e-91e2-3f3b1f5f1c9c/front-250' },
  { id:'ss36', title:'Shake It Off',     artistName:'Taylor Swift', duration:219,
    coverUrl:'https://coverartarchive.org/release/2f4b2b9b-c78c-4b8e-91e2-3f3b1f5f1c9c/front-250' },
  // Eminem
  { id:'ss37', title:'Lose Yourself',    artistName:'Eminem', duration:326,
    coverUrl:'https://coverartarchive.org/release/c7e3b7e2-40c7-4a32-81f0-84e5a3c9b31b/front-250' },
  { id:'ss38', title:'Without Me',       artistName:'Eminem', duration:290,
    coverUrl:'https://coverartarchive.org/release/c7e3b7e2-40c7-4a32-81f0-84e5a3c9b31b/front-250' },
  // Ed Sheeran
  { id:'ss39', title:'Shape of You',     artistName:'Ed Sheeran', duration:234,
    coverUrl:'https://coverartarchive.org/release/f5b1b5f1-5f5f-4f5f-5f5f-5f5f5f5f5f5f/front-250' },
  { id:'ss40', title:'Perfect',          artistName:'Ed Sheeran', duration:263,
    coverUrl:'https://coverartarchive.org/release/f5b1b5f1-5f5f-4f5f-5f5f-5f5f5f5f5f5f/front-250' },
  // Imagine Dragons
  { id:'ss41', title:'Believer',         artistName:'Imagine Dragons', duration:204,
    coverUrl:'https://coverartarchive.org/release/1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a/front-250' },
  { id:'ss42', title:'Thunder',          artistName:'Imagine Dragons', duration:187,
    coverUrl:'https://coverartarchive.org/release/1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a/front-250' },
  // Post Malone
  { id:'ss43', title:'Sunflower',        artistName:'Post Malone', duration:158,
    coverUrl:'https://coverartarchive.org/release/2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b/front-250' },
  { id:'ss44', title:'Circles',          artistName:'Post Malone', duration:214,
    coverUrl:'https://coverartarchive.org/release/2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b/front-250' },
  // BTS
  { id:'ss45', title:'Dynamite',         artistName:'BTS', duration:199,
    coverUrl:'https://coverartarchive.org/release/3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c/front-250' },
  { id:'ss46', title:'Butter',           artistName:'BTS', duration:164,
    coverUrl:'https://coverartarchive.org/release/3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c/front-250' },
];

// Artist color map — used as gradient fallback when cover fails
export const ARTIST_COLORS: Record<string, string> = {
  'עומר אדם':       '#7c3aed',
  'חנן בן ארי':     '#0ea5e9',
  'מושיר כהן':      '#f59e0b',
  'שלמה ארצי':      '#10b981',
  'טונה':           '#ec4899',
  'פאר טסי':        '#f97316',
  'אייל גולן':      '#dc2626',
  'נועה קירל':      '#a855f7',
  'Static & Ben El':'#14b8a6',
  'Coldplay':        '#3b82f6',
  'The Weeknd':      '#1c1917',
  'Drake':           '#92400e',
  'Taylor Swift':    '#be185d',
  'Eminem':          '#374151',
  'Ed Sheeran':      '#d97706',
  'Imagine Dragons': '#7c3aed',
  'Post Malone':     '#6b21a8',
  'BTS':             '#7dd3fc',
};

// ─── Feedback messages — טבעי, בלי קריאות ───────────────────────────────────

const FEEDBACK_MESSAGES = [
  (song: string, artist: string) => `הכתוביות של "${song}" של ${artist} לא מסונכרנות טוב, אפשר לתקן?`,
  (_s: string, _a: string) => `האפליקציה מדהימה. רק הייתי שמח לשמור שירים להאזנה אופליין`,
  (song: string, _a: string) => `"${song}" לפעמים נתקע באמצע, שאר השירים עובדים מעולה`,
  (_s: string, _a: string) => `פשוט מוזיקה הכי טובה, תמשיכו כך`,
  (song: string, artist: string) => `"${song}" של ${artist} לא מתנגן אצלי, הלינק תקין?`,
  (_s: string, _a: string) => `משתמש חודש ולא עוצר. הממשק נקי ונוח, כל הכבוד`,
  (_s: string, _a: string) => `באפליקציה הסלולרית הנגן נסגר לבד ברקע לפעמים`,
  (song: string, artist: string) => `אהבתי מאוד את "${song}", אפשר להוסיף עוד שירים של ${artist}?`,
  (_s: string, _a: string) => `שמירה לפלייליסט עובדת פצצה. חסרה רק אפשרות לשתף פלייליסט עם חבר`,
  (_s: string, _a: string) => `האיקולייזר שדרג לי את החוויה, תודה`,
  (song: string, _a: string) => `יש תרגום שגוי בכתוביות של "${song}", המילה השלישית בפזמון לא נכונה`,
  (_s: string, _a: string) => `אפליקציה מושלמת לנסיעות. קצת קשה למצוא שירים ישנים, אולי סינון לפי שנה?`,
  (_s: string, _a: string) => `10 מתוך 10. הייתי שמח לראות עוד מוזיקת עולם`,
  (song: string, artist: string) => `הכנסתי את "${song}" של ${artist} לפלייליסט ועבד חלק`,
  (_s: string, _a: string) => `האפליקציה עובדת מצוין, רק שאלה אחת — אפשר להוסיף מצב שינה?`,
  (_s: string, _a: string) => `עיצוב מעולה. הכפתורים ברורים ומהירים`,
  (song: string, _a: string) => `"${song}" מעולה, מחפש עוד שירים בסגנון הזה`,
  (_s: string, _a: string) => `האפליקציה נפתחת מהר ונוחה לשימוש`,
];

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

let _noiseState = (Date.now() ^ 0xdeadbeef) >>> 0;
function noiseRand(): number {
  _noiseState = (Math.imul(_noiseState, 1664525) + 1013904223) >>> 0;
  return _noiseState / 0x100000000;
}

// ─── Email masking ────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length <= 2 ? local[0] + '***' : local[0] + '***' + local[local.length - 1];
  const dotIdx = domain.lastIndexOf('.');
  const tld = domain.slice(dotIdx);
  const domainName = domain.slice(0, dotIdx);
  const maskedDomain = domainName[0] + '***' + tld;
  return `${maskedLocal}@${maskedDomain}`;
}

function transliterate(heb: string): string {
  const map: Record<string, string> = {
    'א':'a','ב':'b','ג':'g','ד':'d','ה':'h','ו':'v','ז':'z','ח':'ch','ט':'t',
    'י':'y','כ':'k','ך':'k','ל':'l','מ':'m','ם':'m','נ':'n','ן':'n','ס':'s',
    'ע':'e','פ':'p','ף':'p','צ':'tz','ץ':'tz','ק':'k','ר':'r','ש':'sh','ת':'t',
  };
  return heb.split('').map(c => map[c] ?? c).join('');
}

// ─── Build users ──────────────────────────────────────────────────────────────

function buildUserBase(id: number) {
  const rand = seededRand(id * 31337 + 7);
  const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
  const last  = LAST_NAMES [Math.floor(rand() * LAST_NAMES.length)];
  const domain = EMAIL_DOMAINS[Math.floor(rand() * EMAIL_DOMAINS.length)];
  const num    = Math.floor(rand() * 900) + 100;
  const email  = `${transliterate(first)}.${transliterate(last)}${num}@${domain}`.toLowerCase();
  return { id: `sim_${id}`, displayName: `${first} ${last}`, email, emailMasked: maskEmail(email), avatarSeed: Math.floor(rand() * 100) };
}

const USER_BASE = Array.from({ length: 1200 }, (_, i) => buildUserBase(i));

let _songState = 0xbeef1234;
function songRand(): number {
  _songState = (Math.imul(_songState, 1664525) + 1013904223) >>> 0;
  return _songState / 0x100000000;
}

function assignSongs(count: number): OnlineUser[] {
  const now = Date.now();
  return USER_BASE.slice(0, Math.min(count, USER_BASE.length)).map(base => {
    const song = SIM_SONGS[Math.floor(songRand() * SIM_SONGS.length)];
    const minOff = Math.floor(song.duration * 0.08);
    const maxOff = Math.floor(song.duration * 0.88);
    const songOffset = minOff + Math.floor(songRand() * (maxOff - minOff));
    return { ...base, song, songOffset, songStartedAt: now };
  });
}

// ─── Simulated feedback ───────────────────────────────────────────────────────

function generateFeedback(count: number): SimFeedback[] {
  const items: SimFeedback[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const rand = seededRand(i * 99991 + 13);
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last  = LAST_NAMES [Math.floor(rand() * LAST_NAMES.length)];
    const domain = EMAIL_DOMAINS[Math.floor(rand() * EMAIL_DOMAINS.length)];
    const num    = Math.floor(rand() * 900) + 100;
    const email  = `${transliterate(first)}.${transliterate(last)}${num}@${domain}`.toLowerCase();
    const song   = SIM_SONGS[Math.floor(rand() * SIM_SONGS.length)];
    const msgFn  = FEEDBACK_MESSAGES[Math.floor(rand() * FEEDBACK_MESSAGES.length)];
    const minsAgo = Math.floor(rand() * 360);
    items.push({
      id: `fb_${i}`,
      userName: `${first} ${last}`,
      userEmail: maskEmail(email),
      message: msgFn(song.title, song.artistName),
      createdAt: new Date(now - minsAgo * 60_000).toISOString(),
    });
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ─── Simulated audience count — starts at 2045 and grows every two hours ─────

const BASE_COUNT = 2045;
const GROWTH_INTERVAL_MS = 2 * 60 * 60 * 1000;
const COUNT_STORAGE_KEY = 'simply_music_audience_count';

function growthForSlot(slot: number): number {
  return 1 + Math.floor(seededRand(slot * 7919 + 31337)() * 5);
}

function getSimulatedCount(): number {
  const currentSlot = Math.floor(Date.now() / GROWTH_INTERVAL_MS);
  let count = BASE_COUNT;
  let savedSlot = currentSlot;

  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(localStorage.getItem(COUNT_STORAGE_KEY) || 'null') as { count?: number; slot?: number } | null;
      if (saved && Number.isFinite(saved.count) && Number.isFinite(saved.slot)) {
        count = Math.max(BASE_COUNT, Math.floor(saved.count!));
        savedSlot = Math.floor(saved.slot!);
      }
    } catch {
      // Use the base count when local storage is unavailable or invalid.
    }
  }

  if (savedSlot > currentSlot) savedSlot = currentSlot;
  for (let slot = savedSlot; slot < currentSlot; slot += 1) {
    count += growthForSlot(slot + 1);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(COUNT_STORAGE_KEY, JSON.stringify({ count, slot: currentSlot }));
    } catch {
      // Counting still works for the current session without storage.
    }
  }

  return count;
}

function computeNext(): number {
  return getSimulatedCount();
}

function initialCount(): number {
  return getSimulatedCount();
}

// ─── Live position helper ─────────────────────────────────────────────────────

export function getLivePosition(user: OnlineUser): number {
  const elapsed = (Date.now() - user.songStartedAt) / 1000;
  return (user.songOffset + elapsed) % user.song.duration;
}

// ─── Persistent reply store (localStorage) ────────────────────────────────────

const REPLIES_KEY = 'sim_feedback_replies';

function loadReplies(): Record<string, { reply: string; repliedAt: string }> {
  try {
    return JSON.parse(localStorage.getItem(REPLIES_KEY) || '{}');
  } catch { return {}; }
}

function saveReply(id: string, reply: string) {
  const all = loadReplies();
  all[id] = { reply, repliedAt: new Date().toISOString() };
  localStorage.setItem(REPLIES_KEY, JSON.stringify(all));
}

// ─── The hook ─────────────────────────────────────────────────────────────────

const SIM_FEEDBACK_BASE = generateFeedback(18);

export function useOnlineUsers(): OnlineUsersState {
  const [count,    setCount]    = useState<number>(initialCount);
  const [users,    setUsers]    = useState<OnlineUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [simFeedback, setSimFeedback] = useState<SimFeedback[]>(() => {
    const replies = loadReplies();
    return SIM_FEEDBACK_BASE.map(fb => ({
      ...fb,
      adminReply: replies[fb.id]?.reply,
      repliedAt:  replies[fb.id]?.repliedAt,
    }));
  });
  const countRef = useRef(count);

  useEffect(() => { countRef.current = count; }, [count]);

  useEffect(() => {
    setUsers(assignSongs(countRef.current));
    setIsLoaded(true);

    // Count tick: every 3–6 s (small drift only)
    let countTimer: ReturnType<typeof setTimeout>;
    const tickCount = () => {
      const next = computeNext();
      countRef.current = next;
      setCount(next);
      setUsers(prev => {
        if (next === prev.length) return prev;
        if (next > prev.length)  return [...prev, ...assignSongs(next).slice(prev.length)];
        return prev.slice(0, next);
      });
      countTimer = setTimeout(tickCount, 3_000 + Math.floor(noiseRand2() * 3_000));
    };
    countTimer = setTimeout(tickCount, 4_000);

    // Song rotation: every ~30 s, ~15% of users change track
    let songTimer: ReturnType<typeof setTimeout>;
    const tickSongs = () => {
      const now = Date.now();
      setUsers(prev => prev.map(u => {
        if (noiseRand2() > 0.15) return u;
        const newSong   = SIM_SONGS[Math.floor(songRand() * SIM_SONGS.length)];
        const newOffset = Math.floor(newSong.duration * 0.05);
        return { ...u, song: newSong, songOffset: newOffset, songStartedAt: now };
      }));
      songTimer = setTimeout(tickSongs, 28_000 + Math.floor(noiseRand2() * 10_000));
    };
    songTimer = setTimeout(tickSongs, 30_000);

    return () => { clearTimeout(countTimer); clearTimeout(songTimer); };
  }, []);

  const replyToFeedback = (id: string, reply: string) => {
    saveReply(id, reply);
    setSimFeedback(prev => prev.map(fb =>
      fb.id === id
        ? { ...fb, adminReply: reply, repliedAt: new Date().toISOString() }
        : fb
    ));
  };

  return { count, users, isLoaded, simFeedback, replyToFeedback };
}
