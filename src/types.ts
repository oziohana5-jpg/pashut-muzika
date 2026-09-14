export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  artistIds: string[];
  genres: string[];
  completed: boolean;
}

export interface Artist {
  id: string;
  name: string;
  nameHe?: string;
  bio: string;
  bioHe?: string;
  imageUrl: string;
  bannerUrl: string;
  monthlyListeners: number;
  followerCount?: number;
  genres: string[];
  verified: boolean;
}

export interface Album {
  id: string;
  title: string;
  titleHe?: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  releaseYear: number;
  genres: string[];
  trackCount: number;
}

export interface Song {
  id: string;
  title: string;
  titleHe?: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  coverUrl: string;
  duration: number; // seconds
  releaseDate: string;
  genre: string;
  streamUrl: string;
  youtubeId?: string;
  provider: string;
  audioFormat: 'mp3' | 'aac' | 'flac';
  bitrate: number;
  lyrics?: string;
  plays: number;
  isFullLength: boolean;
  licenseInfo: string;
}

export interface Playlist {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  coverUrl: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  songIds: string[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export type EqualizerPreset =
  | 'flat'
  | 'bass_boost'
  | 'treble_boost'
  | 'vocal'
  | 'electronic'
  | 'rock'
  | 'pop'
  | 'acoustic';

export interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  playbackRate: number;
  queue: Song[];
  history: Song[];
  isBuffering: boolean;
  error: string | null;
  isFullPlayerOpen: boolean;
  isQueueOpen: boolean;
  isVideoMode: boolean;
  isEqualizerOpen: boolean;
  isSleepTimerOpen: boolean;
  sleepTimerSecondsLeft: number | null; // null if inactive, 0+ countdown
  sleepTimerIsEndOfTrack: boolean;
  equalizerPreset: EqualizerPreset;
  equalizerGains: number[]; // 5 frequency bands: [60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz] in dB (-12 to +12)
}

export interface HomeData {
  recentlyPlayed: Song[];
  madeForYou: Song[];
  recommendedSongs: Song[];
  popularSongs: Song[];
  newReleases: Song[];
  popularAlbums: Album[];
  popularArtists: Artist[];
  recommendedPlaylists: Playlist[];
}

export interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalSongs: number;
  totalArtists: number;
  totalPlaylists: number;
  totalStreamsServed: number;
  playbackErrorsCount: number;
}

export interface AppUpdate {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'feature' | 'fix' | 'important';
  createdAt: string;
  authorName: string;
}

export interface UserFeedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  createdAt: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  type: string;
  description: string;
  stats: {
    requests: number;
    errors: number;
    lastPingMs: number;
  };
}

export interface PlaybackLog {
  id: string;
  timestamp: string;
  userId?: string;
  songId: string;
  type: 'play' | 'complete' | 'buffer' | 'error';
  message?: string;
}

export type ActiveTab = 'home' | 'search' | 'library' | 'updates' | 'downloads' | 'admin' | 'settings';
export type ActiveView =
  | { type: 'tab'; tab: ActiveTab }
  | { type: 'artist'; id: string }
  | { type: 'album'; id: string }
  | { type: 'playlist'; id: string }
  | { type: 'liked' };
