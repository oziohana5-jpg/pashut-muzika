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
  createdAt: string; // ISO string
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

// ─── Song pool — ישראלי + בינלאומי ──────────────────────────────────────────

export const SIM_SONGS: SimSong[] = [
  // עומר אדם
  { id:'ss1',  title:'שני משוגעים',      artistName:'עומר אדם',         duration:171, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  { id:'ss2',  title:'פסקו חיים',        artistName:'עומר אדם',         duration:196, coverUrl:'https://i.ytimg.com/vi/2wXHBnSZ4oc/hqdefault.jpg' },
  { id:'ss3',  title:'תן לגיגי',         artistName:'עומר אדם',         duration:215, coverUrl:'https://i.ytimg.com/vi/0fknKMkbRxc/hqdefault.jpg' },
  { id:'ss4',  title:'נועצת מבט',        artistName:'עומר אדם',         duration:230, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  // חנן בן ארי
  { id:'ss5',  title:'מה שאני',          artistName:'חנן בן ארי',        duration:214, coverUrl:'https://i.ytimg.com/vi/5mMIlqg5Gfk/hqdefault.jpg' },
  { id:'ss6',  title:'ויקיפדיה',         artistName:'חנן בן ארי',        duration:208, coverUrl:'https://i.ytimg.com/vi/ZhBFl7lH8k8/hqdefault.jpg' },
  { id:'ss7',  title:'מן תרצי',          artistName:'חנן בן ארי',        duration:176, coverUrl:'https://i.ytimg.com/vi/5mMIlqg5Gfk/hqdefault.jpg' },
  { id:'ss8',  title:'עטלף עיוור',       artistName:'חנן בן ארי',        duration:225, coverUrl:'https://i.ytimg.com/vi/5mMIlqg5Gfk/hqdefault.jpg' },
  // מושיר כהן
  { id:'ss9',  title:'כולם בגן עדן',     artistName:'מושיר כהן',         duration:247, coverUrl:'https://i.ytimg.com/vi/Oi7w2bJFMdI/hqdefault.jpg' },
  { id:'ss10', title:'הנבחרת',           artistName:'מושיר כהן',         duration:189, coverUrl:'https://i.ytimg.com/vi/Oi7w2bJFMdI/hqdefault.jpg' },
  { id:'ss11', title:'מעולם ועד',        artistName:'מושיר כהן',         duration:287, coverUrl:'https://i.ytimg.com/vi/Oi7w2bJFMdI/hqdefault.jpg' },
  // שלמה ארצי
  { id:'ss12', title:'ירח',              artistName:'שלמה ארצי',         duration:270, coverUrl:'https://i.ytimg.com/vi/OoFBHkFPdE8/hqdefault.jpg' },
  { id:'ss13', title:'תתארו לכם',        artistName:'שלמה ארצי',         duration:245, coverUrl:'https://i.ytimg.com/vi/OoFBHkFPdE8/hqdefault.jpg' },
  // טונה
  { id:'ss14', title:'בן זה יעבור',      artistName:'טונה',              duration:260, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  { id:'ss15', title:'סחרחורת',          artistName:'טונה',              duration:235, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  { id:'ss16', title:'היי ביי',          artistName:'טונה',              duration:210, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  // פאר טסי
  { id:'ss17', title:'מדבקה חומה',       artistName:'פאר טסי',           duration:214, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  { id:'ss18', title:'הרי השמש',         artistName:'פאר טסי',           duration:220, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  // אייל גולן
  { id:'ss19', title:'תפסת לי את הלב',  artistName:'אייל גולן',          duration:218, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  { id:'ss20', title:'רק את',            artistName:'אייל גולן',          duration:224, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  // נועה קירל
  { id:'ss21', title:'ביצה',             artistName:'נועה קירל',         duration:192, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  { id:'ss22', title:'אחד על אחד',       artistName:'נועה קירל',         duration:198, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  // Static & Ben El
  { id:'ss23', title:'Beautiful Life',   artistName:'Static & Ben El',   duration:215, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  { id:'ss24', title:'So Long',          artistName:'Static & Ben El',   duration:203, coverUrl:'https://i.ytimg.com/vi/y8bSnI4xhPg/hqdefault.jpg' },
  // Coldplay
  { id:'ss25', title:'Viva La Vida',           artistName:'Coldplay',    duration:242, coverUrl:'https://i.ytimg.com/vi/dvgZkm1xWPE/hqdefault.jpg' },
  { id:'ss26', title:'A Sky Full of Stars',    artistName:'Coldplay',    duration:268, coverUrl:'https://i.ytimg.com/vi/VPRjCeoBqrI/hqdefault.jpg' },
  { id:'ss27', title:'Yellow',                 artistName:'Coldplay',    duration:269, coverUrl:'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg' },
  { id:'ss28', title:'Fix You',                artistName:'Coldplay',    duration:295, coverUrl:'https://i.ytimg.com/vi/k4V3Mo61fJM/hqdefault.jpg' },
  { id:'ss29', title:'The Scientist',          artistName:'Coldplay',    duration:309, coverUrl:'https://i.ytimg.com/vi/RB-RcX5DS5A/hqdefault.jpg' },
  // The Weeknd
  { id:'ss30', title:'Blinding Lights',        artistName:'The Weeknd',  duration:200, coverUrl:'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg' },
  { id:'ss31', title:'Save Your Tears',        artistName:'The Weeknd',  duration:215, coverUrl:'https://i.ytimg.com/vi/XXYlFuWiqLg/hqdefault.jpg' },
  { id:'ss32', title:'Starboy',                artistName:'The Weeknd',  duration:230, coverUrl:'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg' },
  // Drake
  { id:'ss33', title:'One Dance',              artistName:'Drake',       duration:173, coverUrl:'https://i.ytimg.com/vi/iuqWFmJ8jkM/hqdefault.jpg' },
  { id:'ss34', title:'God\'s Plan',            artistName:'Drake',       duration:198, coverUrl:'https://i.ytimg.com/vi/xpVfcZ0ZcFM/hqdefault.jpg' },
  // Taylor Swift
  { id:'ss35', title:'Anti-Hero',              artistName:'Taylor Swift',duration:200, coverUrl:'https://i.ytimg.com/vi/b1kbLwvqugk/hqdefault.jpg' },
  { id:'ss36', title:'Shake It Off',           artistName:'Taylor Swift',duration:219, coverUrl:'https://i.ytimg.com/vi/nfWlot6h_JM/hqdefault.jpg' },
  // Eminem
  { id:'ss37', title:'Lose Yourself',          artistName:'Eminem',      duration:326, coverUrl:'https://i.ytimg.com/vi/xFYQQPAOz7Y/hqdefault.jpg' },
  { id:'ss38', title:'Without Me',             artistName:'Eminem',      duration:290, coverUrl:'https://i.ytimg.com/vi/YVkUvmDQ3HY/hqdefault.jpg' },
  // Ed Sheeran
  { id:'ss39', title:'Shape of You',           artistName:'Ed Sheeran',  duration:234, coverUrl:'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
  { id:'ss40', title:'Perfect',                artistName:'Ed Sheeran',  duration:263, coverUrl:'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg' },
  // Imagine Dragons
  { id:'ss41', title:'Believer',               artistName:'Imagine Dragons',duration:204, coverUrl:'https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg' },
  { id:'ss42', title:'Thunder',                artistName:'Imagine Dragons',duration:187, coverUrl:'https://i.ytimg.com/vi/fKopy74weus/hqdefault.jpg' },
  // Post Malone
  { id:'ss43', title:'Sunflower',              artistName:'Post Malone', duration:158, coverUrl:'https://i.ytimg.com/vi/ApXoWvfEYVU/hqdefault.jpg' },
  { id:'ss44', title:'Circles',               artistName:'Post Malone', duration:214, coverUrl:'https://i.ytimg.com/vi/wXhTHyIgQ_U/hqdefault.jpg' },
  // BTS
  { id:'ss45', title:'Dynamite',               artistName:'BTS',         duration:199, coverUrl:'https://i.ytimg.com/vi/gdZLi9oWNZg/hqdefault.jpg' },
  { id:'ss46', title:'Butter',                 artistName:'BTS',         duration:164, coverUrl:'https://i.ytimg.com/vi/WMweEpGlu_U/hqdefault.jpg' },
];

// ─── Feedback messages pool ───────────────────────────────────────────────────

const FEEDBACK_MESSAGES = [
  (song: string, artist: string) => `האפליקציה ממש סבבה! אבל שמתי לב שהכתוביות של "${song}" של ${artist} לא מסונכרנות טוב, אפשר לתקן?`,
  (_s: string, _a: string) => `האפליקציה מדהימה, תודה רבה! רק הייתי שמח אם הייתה אפשרות לשמור שירים להאזנה אופליין 🙏`,
  (song: string, artist: string) => `יש בעיה בטעינה של "${song}" — לפעמים נתקע באמצע. בר שאר השירים עובדים מעולה!`,
  (_s: string, _a: string) => `פשוט מוזיקה הכי טובה! תמשיכו כך 🔥`,
  (song: string, artist: string) => `"${song}" של ${artist} לא מתנגן אצלי, יכול להיות שהלינק לא תקין?`,
  (_s: string, _a: string) => `אני משתמש כבר חודש ולא עוצר! הממשק נקי ונוח, כל הכבוד לצוות`,
  (song: string, _a: string) => `שאלה קטנה — האם הולכים להוסיף את "${song}" בגרסת הלייב? מחפש את זה`,
  (_s: string, _a: string) => `נהדר! אבל באפליקציה הסלולרית לפעמים הנגן נסגר לבד ברקע`,
  (song: string, artist: string) => `אהבתי מאוד את "${song}"! האם יש אפשרות להוסיף עוד שירים של ${artist}?`,
  (_s: string, _a: string) => `כל שמירה לפלייליסט עובדת פצצה. רק חסרה אפשרות לשתף פלייליסט עם חבר`,
  (_s: string, _a: string) => `האיקולייזר ממש שדרג לי את החוויה, תודה!`,
  (song: string, _a: string) => `יש תרגום שגוי בכתוביות של "${song}" — המילה השלישית בפזמון לא נכונה`,
  (_s: string, _a: string) => `אפליקציה מושלמת לנסיעות! קצת קשה למצוא שירים ישנים, אולי להוסיף סינון לפי שנה?`,
  (_s: string, _a: string) => `10/10 ממש! הייתי שמח לראות עוד מוזיקת עולם — ריג\'בי, פלמנקו וכאלה`,
  (song: string, artist: string) => `תודה על הפלטפורמה! הכנסתי את "${song}" של ${artist} לפלייליסט ועבד חלק`,
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

const USER_BASE = Array.from({ length: 400 }, (_, i) => buildUserBase(i));

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

// ─── Simulated feedback generator ────────────────────────────────────────────

function generateFeedback(count: number): SimFeedback[] {
  const items: SimFeedback[] = [];
  const now = Date.now();
  // spread over last 6 hours
  for (let i = 0; i < count; i++) {
    const rand = seededRand(i * 99991 + 13);
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last  = LAST_NAMES [Math.floor(rand() * LAST_NAMES.length)];
    const domain = EMAIL_DOMAINS[Math.floor(rand() * EMAIL_DOMAINS.length)];
    const num    = Math.floor(rand() * 900) + 100;
    const email  = `${transliterate(first)}.${transliterate(last)}${num}@${domain}`.toLowerCase();
    const song   = SIM_SONGS[Math.floor(rand() * SIM_SONGS.length)];
    const msgFn  = FEEDBACK_MESSAGES[Math.floor(rand() * FEEDBACK_MESSAGES.length)];
    const minsAgo = Math.floor(rand() * 360); // 0-6 hours ago
    items.push({
      id: `fb_${i}`,
      userName: `${first} ${last}`,
      userEmail: maskEmail(email),
      message: msgFn(song.title, song.artistName),
      createdAt: new Date(now - minsAgo * 60_000).toISOString(),
    });
  }
  // sort newest first
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Pre-generate 18 feedback items
const SIM_FEEDBACK_POOL = generateFeedback(18);

// ─── Time-based count ─────────────────────────────────────────────────────────

interface HourSlot { min: number; max: number; }
function getHourSlot(h: number): HourSlot {
  if (h < 5)  return { min:5,   max:18  };
  if (h < 7)  return { min:15,  max:60  };
  if (h < 9)  return { min:80,  max:250 };
  if (h < 12) return { min:60,  max:180 };
  if (h < 14) return { min:40,  max:90  };
  if (h < 17) return { min:50,  max:120 };
  if (h < 20) return { min:90,  max:220 };
  if (h < 23) return { min:70,  max:160 };
  return { min:20, max:55 };
}

function gaussianNoise(std: number): number {
  const u = (noiseRand() + noiseRand() + noiseRand()) / 3;
  return (u - 0.5) * 2 * std;
}

function computeNext(current: number): number {
  const slot  = getHourSlot(new Date().getHours());
  const mid   = (slot.min + slot.max) / 2;
  const range = slot.max - slot.min;
  const pull  = (mid - current) * 0.08;
  const noise = gaussianNoise(range * 0.10);
  const spike = noiseRand() < 0.05 ? (noiseRand() * range * 0.12) * (noiseRand() > 0.5 ? 1 : -1) : 0;
  return Math.max(slot.min, Math.min(slot.max, Math.round(current + pull + noise + spike)));
}

function initialCount(): number {
  const slot = getHourSlot(new Date().getHours());
  return Math.round((slot.min + slot.max) / 2 + gaussianNoise((slot.max - slot.min) * 0.15));
}

// ─── Live position helper ─────────────────────────────────────────────────────

export function getLivePosition(user: OnlineUser): number {
  const elapsed = (Date.now() - user.songStartedAt) / 1000;
  return (user.songOffset + elapsed) % user.song.duration;
}

// ─── The hook ─────────────────────────────────────────────────────────────────

export function useOnlineUsers(): OnlineUsersState {
  const [count,    setCount]   = useState<number>(initialCount);
  const [users,    setUsers]   = useState<OnlineUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const countRef = useRef(count);

  useEffect(() => { countRef.current = count; }, [count]);

  useEffect(() => {
    setUsers(assignSongs(countRef.current));
    setIsLoaded(true);

    // Count tick: every 3–6 s
    let countTimer: ReturnType<typeof setTimeout>;
    const tickCount = () => {
      const next = computeNext(countRef.current);
      countRef.current = next;
      setCount(next);
      setUsers(prev => {
        if (next === prev.length) return prev;
        if (next > prev.length)  return [...prev, ...assignSongs(next).slice(prev.length)];
        return prev.slice(0, next);
      });
      countTimer = setTimeout(tickCount, 3_000 + Math.floor(noiseRand() * 3_000));
    };
    countTimer = setTimeout(tickCount, 4_000);

    // Song rotation: every ~30 s, ~15% of users change track
    let songTimer: ReturnType<typeof setTimeout>;
    const tickSongs = () => {
      const now = Date.now();
      setUsers(prev => prev.map(u => {
        if (noiseRand() > 0.15) return u;
        const newSong   = SIM_SONGS[Math.floor(songRand() * SIM_SONGS.length)];
        const newOffset = Math.floor(newSong.duration * 0.05);
        return { ...u, song: newSong, songOffset: newOffset, songStartedAt: now };
      }));
      songTimer = setTimeout(tickSongs, 28_000 + Math.floor(noiseRand() * 10_000));
    };
    songTimer = setTimeout(tickSongs, 30_000);

    return () => { clearTimeout(countTimer); clearTimeout(songTimer); };
  }, []);

  return { count, users, isLoaded, simFeedback: SIM_FEEDBACK_POOL };
}
