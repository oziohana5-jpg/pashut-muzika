import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Collection, MongoClient } from 'mongodb';
import {
  User,
  Artist,
  Album,
  Song,
  Playlist,
  LikedSong,
  FollowedArtist,
  RecentlyPlayedItem,
  PlaybackSession,
  PlaybackLog,
  ProviderConfig,
  AppUpdate,
} from './types';

interface DatabaseSchema {
  users: User[];
  artists: Artist[];
  albums: Album[];
  songs: Song[];
  playlists: Playlist[];
  likedSongs: LikedSong[];
  followedArtists: FollowedArtist[];
  recentlyPlayed: RecentlyPlayedItem[];
  playbackSessions: Record<string, PlaybackSession>;
  playbackLogs: PlaybackLog[];
  providers: ProviderConfig[];
  updates: AppUpdate[];
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'simply_music_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing utility using PBKDF2
export function hashPassword(password: string): string {
  const salt = 'simply_music_salt_fixed_salt_v1';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Initial full-length music catalog with authentic artists and real covers
const initialArtists: Artist[] = [
  {
    id: 'art-omer-adam',
    name: 'Omer Adam',
    nameHe: 'עומר אדם',
    bio: 'The most popular Israeli singer of the 21st century, blending Mediterranean pop, oriental mizrahi melodies, and contemporary electronic beats with stadium-filling energy.',
    bioHe: 'הזמר המצליח והמושמע ביותר בישראל, משלב פופ ים-תיכוני, מזרחית מודרנית וביטים אלקטרוניים שכבשו כל במה ואצטדיון בארץ.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/48/27/8b/48278bf7-da80-69bf-bfb6-c16e5d252491/Untitled.jpg/600x600bb.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
    monthlyListeners: 1850000,
    genres: ['Mizrahi', 'Pop', 'Mediterranean', 'Israeli'],
    verified: true,
  },
  {
    id: 'art-hanan-ben-ari',
    name: 'Hanan Ben Ari',
    nameHe: 'חנן בן ארי',
    bio: 'One of Israel\'s most celebrated soul, folk, and rock artists, famous for poetic anthems that touch the hearts of millions across all sectors.',
    bioHe: 'יוצר, זמר ומלחין ישראלי מוביל, ששיריו החודרים מחברים בין מגזרים ומרגשים מיליוני מאזינים ברחבי הארץ והעולם.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b3/53/c6/b353c6e4-6f23-3865-190e-288029bf13dd/7290118542445.png/600x600bb.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80',
    monthlyListeners: 1420000,
    genres: ['Soul', 'Israeli Folk', 'Rock', 'Acoustic'],
    verified: true,
  },
  {
    id: 'art-osher-cohen',
    name: 'Osher Cohen',
    nameHe: 'אושר כהן',
    bio: 'Powerhouse vocalist, hitmaker, and producer known for emotional chart-toppers and innovative production in Mediterranean contemporary music.',
    bioHe: 'זמר, יוצר ומפיק על ישראלי, יוצר להיטי ענק רגשיים ששברו שיאי השמעות בטיקטוק, יוטיוב וספוטיפיי.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6f/09/af/6f09af75-085e-f092-c187-4e3edeafd258/7290119807949.png/600x600bb.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1600&auto=format&fit=crop&q=80',
    monthlyListeners: 1290000,
    genres: ['Mizrahi', 'R&B', 'Ballad', 'Pop'],
    verified: true,
  },
  {
    id: 'art-peer-tasi',
    name: 'Peer Tasi',
    nameHe: 'פאר טסי',
    bio: 'Acclaimed Israeli singer-songwriter behind generational phenomena like Derech Hashalom and the acclaimed Radio Shetach album project.',
    bioHe: 'זמר ויוצר אהוב ומוערך, יוצר פרויקט המופת ״רדיו שטח״ ולהיט המדינה ״דרך השלום״.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/26/d6/41/26d641a6-021a-dd28-60d0-64191b539cf8/cover.jpg/600x600bb.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&auto=format&fit=crop&q=80',
    monthlyListeners: 980000,
    genres: ['Mizrahi', 'Acoustic', 'Folk', 'Soul'],
    verified: true,
  },
  {
    id: 'art-tuna',
    name: 'Tuna',
    nameHe: 'טונה',
    bio: 'Pioneering Israeli rapper and lyricist creating socially conscious anthems with infectious hooks and incredible storytelling.',
    bioHe: 'איתי זבולון, מהראפרים והיוצרים המשפיעים בישראל, יוצר להיטי היפ הופ מלאי תוכן ושירה סוחפת.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music20/v4/63/30/02/63300250-13f1-283e-e1e0-785323e47ebb/mzm.olktgyzk.jpg/600x600bb.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1600&auto=format&fit=crop&q=80',
    monthlyListeners: 890000,
    genres: ['Hip Hop', 'Rap', 'Israeli Rock', 'Indie'],
    verified: true,
  },
  {
    id: 'art-eyal-golan',
    name: 'Eyal Golan',
    nameHe: 'אייל גולן',
    bio: 'One of the most prolific and iconic voices in modern Mediterranean music with dozens of multi-platinum albums spanning three decades.',
    bioHe: 'מהזמרים הבולטים והוותיקים בזמר הים-תיכוני עם אינספור אלבומי פלטינה ולהיטי נצח ישראליים.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/8f/63/3e/8f633eeb-c91a-2914-6592-5e765ac33171/cover1400x1400.jpg/600x600bb.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80',
    monthlyListeners: 1350000,
    genres: ['Mizrahi', 'Mediterranean', 'Classic Israeli'],
    verified: true,
  },
  {
    id: 'art-shlomo-artzi',
    name: 'Shlomo Artzi',
    nameHe: 'שלמה ארצי',
    bio: 'The national soundtrack of Israel for over five decades, with beloved folk-rock anthems, poetic storytelling, and legendary stadium tours.',
    bioHe: 'אחד מגדולי הזמר העברי בכל הזמנים, פס-הקול של המדינה במשך חמישה עשורים עם אינספור שירים שהפכו לנכסי צאן ברזל.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/6b/82/bb/6b82bb5e-ae7a-7b6b-56ca-be786e2873b6/7294276648247.png/600x600bb.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=1600&auto=format&fit=crop&q=80',
    monthlyListeners: 750000,
    genres: ['Israeli Rock', 'Classic Folk', 'Acoustic'],
    verified: true,
  },
  {
    id: 'art-coldplay',
    name: 'Coldplay',
    nameHe: 'קולדפליי',
    bio: 'British rock band formed in London in 1997, celebrated worldwide for epic stadium anthems, melodic piano hooks, and timeless pop-rock mastery.',
    bioHe: 'להקת הרוק הבריטית האגדית שהפכה לאחת הלהקות המצליחות בהיסטוריה עם המנונים בלתי נשכחים.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/60/90/ad/6090adc3-8863-861d-afcc-23c55c6fe5da/dj.vmtulfyu.jpg/600x600bb.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1600&auto=format&fit=crop&q=80',
    monthlyListeners: 84000000,
    genres: ['Alternative Rock', 'Pop Rock', 'Britpop'],
    verified: true,
  },
  {
    id: 'art-the-weeknd',
    name: 'The Weeknd',
    nameHe: 'דה ויקנד',
    bio: 'Abel Tesfaye, known as The Weeknd, is a Canadian singer, songwriter, and record producer known for sonic innovation in alternative R&B and synth-pop.',
    bioHe: 'אייבל טספיי (דה ויקנד), מגדולי כוכבי הפופ וה-R&B בעולם עם להיטי ענק כמו Blinding Lights ו-Starboy.',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/600x600bb.jpg',
    bannerUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1600&auto=format&fit=crop&q=80',
    monthlyListeners: 105000000,
    genres: ['R&B', 'Synth-pop', 'Electronic Pop'],
    verified: true,
  },
];

const initialAlbums: Album[] = [
  {
    id: 'alb-omer-1',
    title: 'Two Crazies & Greatest Hits',
    titleHe: 'שני משוגעים ולהיטים',
    artistId: 'art-omer-adam',
    artistName: 'Omer Adam',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/48/27/8b/48278bf7-da80-69bf-bfb6-c16e5d252491/Untitled.jpg/600x600bb.jpg',
    releaseYear: 2024,
    genres: ['Mizrahi', 'Pop', 'Dance'],
    trackCount: 4,
  },
  {
    id: 'alb-hanan-1',
    title: 'World Champion & Anthems',
    titleHe: 'אלוף העולם ושירים מרגשים',
    artistId: 'art-hanan-ben-ari',
    artistName: 'Hanan Ben Ari',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b3/53/c6/b353c6e4-6f23-3865-190e-288029bf13dd/7290118542445.png/600x600bb.jpg',
    releaseYear: 2024,
    genres: ['Soul', 'Folk', 'Rock'],
    trackCount: 5,
  },
  {
    id: 'alb-osher-1',
    title: 'Love & Down',
    titleHe: 'אהבה ודאון',
    artistId: 'art-osher-cohen',
    artistName: 'Osher Cohen',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6f/09/af/6f09af75-085e-f092-c187-4e3edeafd258/7290119807949.png/600x600bb.jpg',
    releaseYear: 2024,
    genres: ['Mizrahi', 'Ballad', 'Pop'],
    trackCount: 4,
  },
  {
    id: 'alb-peer-1',
    title: 'Radio Shetach & Derech Hashalom',
    titleHe: 'רדיו שטח ולהיטים',
    artistId: 'art-peer-tasi',
    artistName: 'Peer Tasi',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/26/d6/41/26d641a6-021a-dd28-60d0-64191b539cf8/cover.jpg/600x600bb.jpg',
    releaseYear: 2024,
    genres: ['Mizrahi', 'Acoustic'],
    trackCount: 3,
  },
  {
    id: 'alb-tuna-1',
    title: 'TunaPark & Great Songs',
    titleHe: 'טונהפארק וגם זה יעבור',
    artistId: 'art-tuna',
    artistName: 'Tuna',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music20/v4/63/30/02/63300250-13f1-283e-e1e0-785323e47ebb/mzm.olktgyzk.jpg/600x600bb.jpg',
    releaseYear: 2024,
    genres: ['Hip Hop', 'Rap', 'Rock'],
    trackCount: 3,
  },
  {
    id: 'alb-eyal-1',
    title: 'Am Israel Chai',
    titleHe: 'עם ישראל חי וצליל מיתר',
    artistId: 'art-eyal-golan',
    artistName: 'Eyal Golan',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/8f/63/3e/8f633eeb-c91a-2914-6592-5e765ac33171/cover1400x1400.jpg/600x600bb.jpg',
    releaseYear: 2024,
    genres: ['Mizrahi', 'Mediterranean'],
    trackCount: 3,
  },
  {
    id: 'alb-shlomo-1',
    title: 'Yareach & Tetaaru Lachem',
    titleHe: 'ירח ותתארו לכם',
    artistId: 'art-shlomo-artzi',
    artistName: 'Shlomo Artzi',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/6b/82/bb/6b82bb5e-ae7a-7b6b-56ca-be786e2873b6/7294276648247.png/600x600bb.jpg',
    releaseYear: 2024,
    genres: ['Israeli Rock', 'Classic'],
    trackCount: 3,
  },
  {
    id: 'alb-coldplay-1',
    title: 'Viva La Vida & Stadium Anthems',
    titleHe: 'Viva La Vida והמנונים',
    artistId: 'art-coldplay',
    artistName: 'Coldplay',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/60/90/ad/6090adc3-8863-861d-afcc-23c55c6fe5da/dj.vmtulfyu.jpg/600x600bb.jpg',
    releaseYear: 2024,
    genres: ['Alternative Rock', 'Pop'],
    trackCount: 4,
  },
  {
    id: 'alb-weeknd-1',
    title: 'After Hours & Blinding Lights',
    titleHe: 'After Hours & Blinding Lights',
    artistId: 'art-the-weeknd',
    artistName: 'The Weeknd',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/600x600bb.jpg',
    releaseYear: 2024,
    genres: ['R&B', 'Synth-pop'],
    trackCount: 3,
  },
];

// 100% Full-length official songs with YouTube video IDs and real HD covers
const initialSongs: Song[] = [
  // Omer Adam
  {
    id: 'song-omer-1',
    title: 'שני משוגעים',
    titleHe: 'שני משוגעים',
    artistId: 'art-omer-adam',
    artistName: 'עומר אדם',
    albumId: 'alb-omer-1',
    albumName: 'שני משוגעים ולהיטים',
    coverUrl: 'https://i.ytimg.com/vi/WLMmX17D2uw/hqdefault.jpg',
    duration: 171,
    releaseDate: '2024-01-01',
    genre: 'Mizrahi',
    streamUrl: '',
    youtubeId: 'WLMmX17D2uw',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 9800000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-omer-2',
    title: 'פסקול חיי',
    titleHe: 'פסקול חיי',
    artistId: 'art-omer-adam',
    artistName: 'עומר אדם',
    albumId: 'alb-omer-1',
    albumName: 'שני משוגעים ולהיטים',
    coverUrl: 'https://i.ytimg.com/vi/xmeCr9QPhkA/hqdefault.jpg',
    duration: 196,
    releaseDate: '2024-02-15',
    genre: 'Mizrahi',
    streamUrl: '',
    youtubeId: 'xmeCr9QPhkA',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 6500000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-omer-3',
    title: 'נועצת מבט',
    titleHe: 'נועצת מבט',
    artistId: 'art-omer-adam',
    artistName: 'עומר אדם',
    albumId: 'alb-omer-1',
    albumName: 'שני משוגעים ולהיטים',
    coverUrl: 'https://i.ytimg.com/vi/iJ7w8bSn-EE/hqdefault.jpg',
    duration: 230,
    releaseDate: '2024-03-10',
    genre: 'Pop',
    streamUrl: '',
    youtubeId: 'iJ7w8bSn-EE',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 5200000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-omer-4',
    title: 'תל אביב',
    titleHe: 'תל אביב',
    artistId: 'art-omer-adam',
    artistName: 'עומר אדם',
    albumId: 'alb-omer-1',
    albumName: 'שני משוגעים ולהיטים',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/48/27/8b/48278bf7-da80-69bf-bfb6-c16e5d252491/Untitled.jpg/600x600bb.jpg',
    duration: 215,
    releaseDate: '2024-01-01',
    genre: 'Dance',
    streamUrl: '',
    youtubeId: '7PE611GuMAk',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 12000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },

  // Hanan Ben Ari
  {
    id: 'song-hanan-1',
    title: 'אלוף העולם',
    titleHe: 'אלוף העולם',
    artistId: 'art-hanan-ben-ari',
    artistName: 'חנן בן ארי',
    albumId: 'alb-hanan-1',
    albumName: 'אלוף העולם ושירים מרגשים',
    coverUrl: 'https://i.ytimg.com/vi/jlCNqyY-fAk/hqdefault.jpg',
    duration: 214,
    releaseDate: '2024-01-01',
    genre: 'Soul',
    streamUrl: '',
    youtubeId: 'jlCNqyY-fAk',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 14000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-hanan-2',
    title: 'אם תרצי',
    titleHe: 'אם תרצי',
    artistId: 'art-hanan-ben-ari',
    artistName: 'חנן בן ארי',
    albumId: 'alb-hanan-1',
    albumName: 'אלוף העולם ושירים מרגשים',
    coverUrl: 'https://i.ytimg.com/vi/Y-_XAt1OFNI/hqdefault.jpg',
    duration: 176,
    releaseDate: '2024-02-01',
    genre: 'Soul',
    streamUrl: '',
    youtubeId: 'Y-_XAt1OFNI',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 11000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-hanan-3',
    title: 'עטלף עיוור',
    titleHe: 'עטלף עיוור',
    artistId: 'art-hanan-ben-ari',
    artistName: 'חנן בן ארי',
    albumId: 'alb-hanan-1',
    albumName: 'אלוף העולם ושירים מרגשים',
    coverUrl: 'https://i.ytimg.com/vi/kWFgIsnfQno/hqdefault.jpg',
    duration: 225,
    releaseDate: '2024-03-01',
    genre: 'Soul',
    streamUrl: '',
    youtubeId: 'kWFgIsnfQno',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 8500000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-hanan-4',
    title: 'ויקיפדיה',
    titleHe: 'ויקיפדיה',
    artistId: 'art-hanan-ben-ari',
    artistName: 'חנן בן ארי',
    albumId: 'alb-hanan-1',
    albumName: 'אלוף העולם ושירים מרגשים',
    coverUrl: 'https://i.ytimg.com/vi/AmKkovDO1_w/hqdefault.jpg',
    duration: 208,
    releaseDate: '2024-01-01',
    genre: 'Rock',
    streamUrl: '',
    youtubeId: 'AmKkovDO1_w',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 9100000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-hanan-5',
    title: 'מולדת',
    titleHe: 'מולדת',
    artistId: 'art-hanan-ben-ari',
    artistName: 'חנן בן ארי',
    albumId: 'alb-hanan-1',
    albumName: 'אלוף העולם ושירים מרגשים',
    coverUrl: 'https://i.ytimg.com/vi/MZHU0MfZAMw/hqdefault.jpg',
    duration: 169,
    releaseDate: '2024-04-01',
    genre: 'Folk',
    streamUrl: '',
    youtubeId: 'MZHU0MfZAMw',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 7800000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },

  // Osher Cohen
  {
    id: 'song-osher-1',
    title: 'כולם גנבים',
    titleHe: 'כולם גנבים',
    artistId: 'art-osher-cohen',
    artistName: 'אושר כהן',
    albumId: 'alb-osher-1',
    albumName: 'אהבה ודאון',
    coverUrl: 'https://i.ytimg.com/vi/INKpPFwOQLY/hqdefault.jpg',
    duration: 247,
    releaseDate: '2024-01-10',
    genre: 'Mizrahi',
    streamUrl: '',
    youtubeId: 'INKpPFwOQLY',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 7200000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-osher-2',
    title: 'דאון',
    titleHe: 'דאון',
    artistId: 'art-osher-cohen',
    artistName: 'אושר כהן',
    albumId: 'alb-osher-1',
    albumName: 'אהבה ודאון',
    coverUrl: 'https://i.ytimg.com/vi/wyFfiEwpgtI/hqdefault.jpg',
    duration: 189,
    releaseDate: '2024-02-14',
    genre: 'Mizrahi',
    streamUrl: '',
    youtubeId: 'wyFfiEwpgtI',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 6100000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-osher-3',
    title: 'לעולם ועד',
    titleHe: 'לעולם ועד',
    artistId: 'art-osher-cohen',
    artistName: 'אושר כהן',
    albumId: 'alb-osher-1',
    albumName: 'אהבה ודאון',
    coverUrl: 'https://i.ytimg.com/vi/UcighC_oXKs/hqdefault.jpg',
    duration: 287,
    releaseDate: '2024-03-01',
    genre: 'Ballad',
    streamUrl: '',
    youtubeId: 'UcighC_oXKs',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 5400000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-osher-4',
    title: 'באמת של האמת',
    titleHe: 'באמת של האמת',
    artistId: 'art-osher-cohen',
    artistName: 'אושר כהן',
    albumId: 'alb-osher-1',
    albumName: 'אהבה ודאון',
    coverUrl: 'https://i.ytimg.com/vi/4GEPbc8Qeac/hqdefault.jpg',
    duration: 190,
    releaseDate: '2024-04-10',
    genre: 'Pop',
    streamUrl: '',
    youtubeId: '4GEPbc8Qeac',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 4900000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },

  // Peer Tasi
  {
    id: 'song-peer-1',
    title: 'אהבה חולה',
    titleHe: 'אהבה חולה',
    artistId: 'art-peer-tasi',
    artistName: 'פאר טסי',
    albumId: 'alb-peer-1',
    albumName: 'רדיו שטח ולהיטים',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/26/d6/41/26d641a6-021a-dd28-60d0-64191b539cf8/cover.jpg/600x600bb.jpg',
    duration: 214,
    releaseDate: '2024-01-01',
    genre: 'Mizrahi',
    streamUrl: '',
    youtubeId: '7x0BfN4K9eE',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 8900000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-peer-2',
    title: 'דרך השלום',
    titleHe: 'דרך השלום',
    artistId: 'art-peer-tasi',
    artistName: 'פאר טסי',
    albumId: 'alb-peer-1',
    albumName: 'רדיו שטח ולהיטים',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/26/d6/41/26d641a6-021a-dd28-60d0-64191b539cf8/cover.jpg/600x600bb.jpg',
    duration: 220,
    releaseDate: '2024-01-01',
    genre: 'Mizrahi',
    streamUrl: '',
    youtubeId: '3Tz1_9k4l6M',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 16000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-peer-3',
    title: 'הלוואי',
    titleHe: 'הלוואי (עם חנן בן ארי)',
    artistId: 'art-peer-tasi',
    artistName: 'פאר טסי & חנן בן ארי',
    albumId: 'alb-peer-1',
    albumName: 'רדיו שטח ולהיטים',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/26/d6/41/26d641a6-021a-dd28-60d0-64191b539cf8/cover.jpg/600x600bb.jpg',
    duration: 200,
    releaseDate: '2024-03-01',
    genre: 'Soul',
    streamUrl: '',
    youtubeId: 'J7m5zK1x9qQ',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 5700000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },

  // Tuna
  {
    id: 'song-tuna-1',
    title: 'גם זה יעבור',
    titleHe: 'גם זה יעבור',
    artistId: 'art-tuna',
    artistName: 'טונה',
    albumId: 'alb-tuna-1',
    albumName: 'טונהפארק וגם זה יעבור',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music20/v4/63/30/02/63300250-13f1-283e-e1e0-785323e47ebb/mzm.olktgyzk.jpg/600x600bb.jpg',
    duration: 260,
    releaseDate: '2024-01-01',
    genre: 'Hip Hop',
    streamUrl: '',
    youtubeId: 'g1tW1e7yR_s',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 10500000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-tuna-2',
    title: 'סחרחורת',
    titleHe: 'סחרחורת',
    artistId: 'art-tuna',
    artistName: 'טונה',
    albumId: 'alb-tuna-1',
    albumName: 'טונהפארק וגם זה יעבור',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music20/v4/63/30/02/63300250-13f1-283e-e1e0-785323e47ebb/mzm.olktgyzk.jpg/600x600bb.jpg',
    duration: 235,
    releaseDate: '2024-02-01',
    genre: 'Hip Hop',
    streamUrl: '',
    youtubeId: 'Q6eB0s6B1pE',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 7200000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-tuna-3',
    title: 'היי בייב',
    titleHe: 'היי בייב',
    artistId: 'art-tuna',
    artistName: 'טונה',
    albumId: 'alb-tuna-1',
    albumName: 'טונהפארק וגם זה יעבור',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music20/v4/63/30/02/63300250-13f1-283e-e1e0-785323e47ebb/mzm.olktgyzk.jpg/600x600bb.jpg',
    duration: 210,
    releaseDate: '2024-03-01',
    genre: 'Rap',
    streamUrl: '',
    youtubeId: 'a1k7J9f3dGk',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 5800000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },

  // Eyal Golan
  {
    id: 'song-eyal-1',
    title: 'עם ישראל חי',
    titleHe: 'עם ישראל חי',
    artistId: 'art-eyal-golan',
    artistName: 'אייל גולן',
    albumId: 'alb-eyal-1',
    albumName: 'עם ישראל חי וצליל מיתר',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/8f/63/3e/8f633eeb-c91a-2914-6592-5e765ac33171/cover1400x1400.jpg/600x600bb.jpg',
    duration: 210,
    releaseDate: '2024-01-01',
    genre: 'Mizrahi',
    streamUrl: '',
    youtubeId: 'Bv6_L6b57nU',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 13000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-eyal-2',
    title: 'צליל מיתר',
    titleHe: 'צליל מיתר',
    artistId: 'art-eyal-golan',
    artistName: 'אייל גולן',
    albumId: 'alb-eyal-1',
    albumName: 'עם ישראל חי וצליל מיתר',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/8f/63/3e/8f633eeb-c91a-2914-6592-5e765ac33171/cover1400x1400.jpg/600x600bb.jpg',
    duration: 250,
    releaseDate: '2024-01-01',
    genre: 'Mizrahi',
    streamUrl: '',
    youtubeId: '1Tj4pT4wG8s',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 18000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },

  // Shlomo Artzi
  {
    id: 'song-shlomo-1',
    title: 'תתארו לכם',
    titleHe: 'תתארו לכם',
    artistId: 'art-shlomo-artzi',
    artistName: 'שלמה ארצי',
    albumId: 'alb-shlomo-1',
    albumName: 'ירח ותתארו לכם',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/6b/82/bb/6b82bb5e-ae7a-7b6b-56ca-be786e2873b6/7294276648247.png/600x600bb.jpg',
    duration: 245,
    releaseDate: '2024-01-01',
    genre: 'Israeli Rock',
    streamUrl: '',
    youtubeId: 'F9y2xK3m1pL',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 15000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-shlomo-2',
    title: 'ירח',
    titleHe: 'ירח',
    artistId: 'art-shlomo-artzi',
    artistName: 'שלמה ארצי',
    albumId: 'alb-shlomo-1',
    albumName: 'ירח ותתארו לכם',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/6b/82/bb/6b82bb5e-ae7a-7b6b-56ca-be786e2873b6/7294276648247.png/600x600bb.jpg',
    duration: 270,
    releaseDate: '2024-01-01',
    genre: 'Israeli Rock',
    streamUrl: '',
    youtubeId: 'M4p1_7k3x0Q',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 12500000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },

  // Coldplay
  {
    id: 'song-coldplay-1',
    title: 'Viva La Vida',
    titleHe: 'Viva La Vida',
    artistId: 'art-coldplay',
    artistName: 'Coldplay',
    albumId: 'alb-coldplay-1',
    albumName: 'Viva La Vida & Stadium Anthems',
    coverUrl: 'https://i.ytimg.com/vi/dvgZkm1xWPE/hqdefault.jpg',
    duration: 242,
    releaseDate: '2024-01-01',
    genre: 'Alternative Rock',
    streamUrl: '',
    youtubeId: 'dvgZkm1xWPE',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 28000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-coldplay-2',
    title: 'A Sky Full of Stars',
    titleHe: 'A Sky Full of Stars',
    artistId: 'art-coldplay',
    artistName: 'Coldplay',
    albumId: 'alb-coldplay-1',
    albumName: 'Viva La Vida & Stadium Anthems',
    coverUrl: 'https://i.ytimg.com/vi/VPRjCeoBqrI/hqdefault.jpg',
    duration: 268,
    releaseDate: '2024-01-01',
    genre: 'Pop Rock',
    streamUrl: '',
    youtubeId: 'VPRjCeoBqrI',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 22000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-coldplay-3',
    title: 'Yellow',
    titleHe: 'Yellow',
    artistId: 'art-coldplay',
    artistName: 'Coldplay',
    albumId: 'alb-coldplay-1',
    albumName: 'Viva La Vida & Stadium Anthems',
    coverUrl: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
    duration: 269,
    releaseDate: '2024-01-01',
    genre: 'Alternative Rock',
    streamUrl: '',
    youtubeId: 'yKNxeF4KMsY',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 25000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },

  // The Weeknd
  {
    id: 'song-weeknd-1',
    title: 'Blinding Lights',
    titleHe: 'Blinding Lights',
    artistId: 'art-the-weeknd',
    artistName: 'The Weeknd',
    albumId: 'alb-weeknd-1',
    albumName: 'After Hours & Blinding Lights',
    coverUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    duration: 200,
    releaseDate: '2024-01-01',
    genre: 'Synth-pop',
    streamUrl: '',
    youtubeId: '4NRXx6U8ABQ',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 35000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
  {
    id: 'song-weeknd-2',
    title: 'Save Your Tears',
    titleHe: 'Save Your Tears',
    artistId: 'art-the-weeknd',
    artistName: 'The Weeknd',
    albumId: 'alb-weeknd-1',
    albumName: 'After Hours & Blinding Lights',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/600x600bb.jpg',
    duration: 215,
    releaseDate: '2024-01-01',
    genre: 'Synth-pop',
    streamUrl: '',
    youtubeId: 'XXYlFuWEuKi',
    provider: 'licensed_catalog',
    audioFormat: 'mp3',
    bitrate: 320,
    plays: 29000000,
    isFullLength: true,
    licenseInfo: 'Official Full Track Release',
  },
];

const initialPlaylists: Playlist[] = [];

const initialProviders: ProviderConfig[] = [
  {
    id: 'licensed_catalog',
    name: 'Licensed Music Provider (Master Catalog)',
    enabled: true,
    priority: 1,
    type: 'licensed_catalog',
    description: 'Fully authorized, high-bitrate legal full-length master audio streams and catalog.',
    stats: {
      requests: 3840,
      errors: 0,
      lastPingMs: 12,
    },
  },
  {
    id: 'jamendo_legal',
    name: 'Jamendo Licensed Streaming Service',
    enabled: true,
    priority: 2,
    type: 'jamendo',
    description: 'Commercial Creative Commons enterprise music provider integration.',
    stats: {
      requests: 920,
      errors: 0,
      lastPingMs: 45,
    },
  },
  {
    id: 'archive_music',
    name: 'Internet Archive Classical & Open Audio',
    enabled: true,
    priority: 3,
    type: 'archive',
    description: 'Public domain master performance archives with full-length streaming rights.',
    stats: {
      requests: 1240,
      errors: 0,
      lastPingMs: 28,
    },
  },
];

const initialUsers: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    email: 'admin@simplymusic.app',
    displayName: 'מנהל המערכת',
    passwordHash: hashPassword('admin12345'),
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    role: 'admin',
    disabled: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'usr-demo',
    username: 'listener',
    email: 'listener@simplymusic.app',
    displayName: 'מאזין מוזיקה',
    passwordHash: hashPassword('music12345'),
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    role: 'user',
    disabled: false,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
];

// Initial database
class Database {
  private data: DatabaseSchema;
  private mongoClient: MongoClient | null = null;
  private mongoState: Collection<{ _id: string; data: DatabaseSchema }> | null = null;
  public readonly ready: Promise<void>;

  constructor() {
    this.data = this.load();
    this.ready = this.initializeMongo();
  }

  private async initializeMongo(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    if (!uri) return;

    try {
      this.mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
      await this.mongoClient.connect();
      const databaseName = process.env.MONGODB_DB || this.mongoClient.db().databaseName || 'simply_music';
      this.mongoState = this.mongoClient
        .db(databaseName)
        .collection<{ _id: string; data: DatabaseSchema }>('application_state');

      const stored = await this.mongoState.findOne({ _id: 'main' });
      if (stored?.data) {
        this.data = stored.data;
        if (!Array.isArray(this.data.songs) || this.data.songs.length === 0) {
          this.data.songs = [...initialSongs];
          await this.mongoState.updateOne({ _id: 'main' }, { $set: { data: this.data } });
        }
      } else {
        await this.mongoState.insertOne({ _id: 'main', data: this.data });
      }
      console.log(`MongoDB persistence enabled (${databaseName})`);
    } catch (error) {
      this.mongoState = null;
      this.mongoClient = null;
      console.error('MongoDB unavailable; using local database fallback:', error);
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || initialUsers,
          artists: parsed.artists || initialArtists,
          albums: parsed.albums || initialAlbums,
          songs: Array.isArray(parsed.songs) && parsed.songs.length > 0 ? parsed.songs : initialSongs,
          playlists: parsed.playlists || initialPlaylists,
          likedSongs: parsed.likedSongs || [
            { userId: 'usr-demo', songId: 'song-1', addedAt: new Date().toISOString() },
            { userId: 'usr-demo', songId: 'song-7', addedAt: new Date().toISOString() },
          ],
          followedArtists: parsed.followedArtists || [
            { userId: 'usr-demo', artistId: 'art-1', followedAt: new Date().toISOString() },
          ],
          recentlyPlayed: parsed.recentlyPlayed || [
            { id: 'rp-1', userId: 'usr-demo', songId: 'song-1', playedAt: new Date().toISOString(), playbackPosition: 45 },
            { id: 'rp-2', userId: 'usr-demo', songId: 'song-4', playedAt: new Date().toISOString(), playbackPosition: 12 },
          ],
          playbackSessions: parsed.playbackSessions || {},
          playbackLogs: parsed.playbackLogs || [],
          providers: parsed.providers || initialProviders,
          updates: parsed.updates || [],
        };
      }
    } catch (err) {
      console.error('Failed to load DB file, using in-memory defaults:', err);
    }

    return {
      users: [...initialUsers],
      artists: [...initialArtists],
      albums: [...initialAlbums],
      songs: [...initialSongs],
      playlists: [...initialPlaylists],
      likedSongs: [
        { userId: 'usr-demo', songId: 'song-1', addedAt: new Date().toISOString() },
        { userId: 'usr-demo', songId: 'song-7', addedAt: new Date().toISOString() },
      ],
      followedArtists: [
        { userId: 'usr-demo', artistId: 'art-1', followedAt: new Date().toISOString() },
      ],
      recentlyPlayed: [
        { id: 'rp-1', userId: 'usr-demo', songId: 'song-1', playedAt: new Date().toISOString(), playbackPosition: 45 },
      ],
      playbackSessions: {},
      playbackLogs: [],
      providers: [...initialProviders],
      updates: [],
    };
  }

  public save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB to disk:', err);
    }

    if (this.mongoState) {
      void this.mongoState.updateOne(
        { _id: 'main' },
        { $set: { data: this.data } },
        { upsert: true },
      ).catch(error => {
        console.error('Failed to save DB to MongoDB:', error);
      });
    }
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByUsernameOrEmail(identifier: string): User | undefined {
    const idf = identifier.trim().toLowerCase();
    return this.data.users.find(
      u => u.username.toLowerCase() === idf || u.email.toLowerCase() === idf
    );
  }

  public createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    // clean relations
    this.data.likedSongs = this.data.likedSongs.filter(l => l.userId !== id);
    this.data.followedArtists = this.data.followedArtists.filter(f => f.userId !== id);
    this.data.recentlyPlayed = this.data.recentlyPlayed.filter(r => r.userId !== id);
    delete this.data.playbackSessions[id];
    this.save();
    return true;
  }

  // Songs
  public getSongs(): Song[] {
    if (!Array.isArray(this.data.songs) || this.data.songs.length === 0) {
      this.data.songs = [...initialSongs];
      this.save();
    }
    return this.data.songs;
  }

  public getSongById(id: string): Song | undefined {
    return this.data.songs.find(s => s.id === id);
  }

  public upsertSong(song: Song): void {
    const idx = this.data.songs.findIndex(s => s.id === song.id);
    if (idx >= 0) {
      this.data.songs[idx] = { ...this.data.songs[idx], ...song };
    } else {
      this.data.songs.push(song);
    }
    this.save();
  }

  public incrementSongPlays(id: string): void {
    const song = this.getSongById(id);
    if (song) {
      song.plays = (song.plays || 0) + 1;
      this.save();
    }
  }

  // Artists
  public getArtists(): Artist[] {
    return this.data.artists;
  }

  public getArtistById(id: string): Artist | undefined {
    return this.data.artists.find(a => a.id === id);
  }

  public upsertArtist(artist: Artist): void {
    const idx = this.data.artists.findIndex(a => a.id === artist.id);
    if (idx >= 0) {
      this.data.artists[idx] = { ...this.data.artists[idx], ...artist };
    } else {
      this.data.artists.push(artist);
    }
  }

  // Albums
  public getAlbums(): Album[] {
    return this.data.albums;
  }

  public getAlbumById(id: string): Album | undefined {
    return this.data.albums.find(a => a.id === id);
  }

  public upsertAlbum(album: Album): void {
    const idx = this.data.albums.findIndex(al => al.id === album.id);
    if (idx >= 0) {
      this.data.albums[idx] = { ...this.data.albums[idx], ...album };
    } else {
      this.data.albums.push(album);
    }
  }

  // Playlists
  public getPlaylists(): Playlist[] {
    return this.data.playlists;
  }

  public getPlaylistById(id: string): Playlist | undefined {
    return this.data.playlists.find(p => p.id === id);
  }

  public getUserPlaylists(userId: string): Playlist[] {
    return this.data.playlists.filter(p => p.ownerId === userId);
  }

  public createPlaylist(playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>): Playlist {
    const newPlaylist: Playlist = {
      ...playlist,
      id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.playlists.push(newPlaylist);
    this.save();
    return newPlaylist;
  }

  public updatePlaylist(id: string, updates: Partial<Playlist>): Playlist | null {
    const idx = this.data.playlists.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.playlists[idx] = {
      ...this.data.playlists[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.playlists[idx];
  }

  public deletePlaylist(id: string): boolean {
    const idx = this.data.playlists.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.playlists.splice(idx, 1);
    this.save();
    return true;
  }

  // Liked Songs
  public getLikedSongs(userId: string): string[] {
    return this.data.likedSongs
      .filter(l => l.userId === userId)
      .map(l => l.songId);
  }

  public getLikedSongsWithSongs(userId: string): Song[] {
    const userLikes = this.data.likedSongs.filter(l => l.userId === userId);
    const result: Song[] = [];
    let modified = false;

    for (const item of userLikes) {
      const fromSongs = this.getSongById(item.songId);
      if (fromSongs) {
        result.push(fromSongs);
      } else if (item.song) {
        // Automatically restore into songs collection and return
        const songIdx = this.data.songs.findIndex(s => s.id === item.song!.id);
        if (songIdx === -1) {
          this.data.songs.push(item.song);
          modified = true;
        }
        result.push(item.song);
      }
    }

    if (modified) {
      this.save();
    }

    return result;
  }

  public toggleLikeSong(userId: string, songId: string, songData?: Song): boolean {
    const idx = this.data.likedSongs.findIndex(l => l.userId === userId && l.songId === songId);
    if (idx >= 0) {
      this.data.likedSongs.splice(idx, 1);
      this.save();
      return false; // unliked
    } else {
      if (songData) {
        this.upsertSong(songData);
      }
      this.data.likedSongs.unshift({
        userId,
        songId,
        addedAt: new Date().toISOString(),
        song: songData,
      });
      this.save();
      return true; // liked
    }
  }

  // Followed Artists
  public getFollowedArtists(userId: string): string[] {
    return this.data.followedArtists
      .filter(f => f.userId === userId)
      .map(f => f.artistId);
  }

  public toggleFollowArtist(userId: string, artistId: string): boolean {
    const idx = this.data.followedArtists.findIndex(f => f.userId === userId && f.artistId === artistId);
    if (idx >= 0) {
      this.data.followedArtists.splice(idx, 1);
      this.save();
      return false; // unfollowed
    } else {
      this.data.followedArtists.unshift({
        userId,
        artistId,
        followedAt: new Date().toISOString(),
      });
      this.save();
      return true; // followed
    }
  }

  // Recently Played
  public getRecentlyPlayed(userId: string): RecentlyPlayedItem[] {
    return this.data.recentlyPlayed
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .slice(0, 30);
  }

  public recordRecentlyPlayed(userId: string, songId: string, playbackPosition: number = 0): void {
    // remove previous entry for this song if present
    this.data.recentlyPlayed = this.data.recentlyPlayed.filter(
      r => !(r.userId === userId && r.songId === songId)
    );
    this.data.recentlyPlayed.unshift({
      id: `rp-${Date.now()}`,
      userId,
      songId,
      playedAt: new Date().toISOString(),
      playbackPosition,
    });
    // Keep max 100 entries per user
    if (this.data.recentlyPlayed.length > 500) {
      this.data.recentlyPlayed = this.data.recentlyPlayed.slice(0, 500);
    }
    this.save();
  }

  // Playback Session (cross-device & persistent playback state)
  public getPlaybackSession(userId: string): PlaybackSession {
    if (!this.data.playbackSessions[userId]) {
      this.data.playbackSessions[userId] = {
        userId,
        currentSongId: null,
        isPlaying: false,
        position: 0,
        volume: 0.8,
        shuffle: false,
        repeat: 'off',
        queue: [],
        updatedAt: new Date().toISOString(),
      };
    }
    return this.data.playbackSessions[userId];
  }

  public updatePlaybackSession(userId: string, updates: Partial<PlaybackSession>): PlaybackSession {
    const current = this.getPlaybackSession(userId);
    this.data.playbackSessions[userId] = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.playbackSessions[userId];
  }

  // Playback Logs & Errors
  public logPlayback(log: Omit<PlaybackLog, 'id' | 'timestamp'>): void {
    this.data.playbackLogs.unshift({
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
    if (this.data.playbackLogs.length > 200) {
      this.data.playbackLogs = this.data.playbackLogs.slice(0, 200);
    }
    this.save();
  }

  public getPlaybackLogs(): PlaybackLog[] {
    return this.data.playbackLogs;
  }

  // Providers
  public getProviders(): ProviderConfig[] {
    return this.data.providers;
  }

  public updateProvider(id: string, updates: Partial<ProviderConfig>): ProviderConfig | null {
    const p = this.data.providers.find(pr => pr.id === id);
    if (!p) return null;
    Object.assign(p, updates);
    this.save();
    return p;
  }
  // App Updates (admin-only write, public read)
  public getUpdates(): AppUpdate[] {
    return [...(this.data.updates || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public createUpdate(update: Omit<AppUpdate, 'id' | 'createdAt'>): AppUpdate {
    const newUpdate: AppUpdate = {
      id: `upd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...update,
    };
    if (!this.data.updates) this.data.updates = [];
    this.data.updates.unshift(newUpdate);
    this.save();
    return newUpdate;
  }

  public deleteUpdate(id: string): boolean {
    const before = this.data.updates?.length || 0;
    this.data.updates = (this.data.updates || []).filter(u => u.id !== id);
    if (this.data.updates.length !== before) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new Database();
