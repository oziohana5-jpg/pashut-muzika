export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  passwordHash: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
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
  duration: number; // in seconds
  releaseDate: string;
  genre: string;
  streamUrl: string;
  youtubeId?: string;
  provider: string;
  audioFormat: 'mp3' | 'aac' | 'flac';
  bitrate: number; // in kbps e.g. 320
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

export interface LikedSong {
  userId: string;
  songId: string;
  addedAt: string;
  song?: Song;
}

export interface FollowedArtist {
  userId: string;
  artistId: string;
  followedAt: string;
}

export interface RecentlyPlayedItem {
  id: string;
  userId: string;
  songId: string;
  playedAt: string;
  playbackPosition: number;
}

export interface PlaybackSession {
  userId: string;
  currentSongId: string | null;
  isPlaying: boolean;
  position: number;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  queue: string[];
  updatedAt: string;
}

export interface PlaybackLog {
  id: string;
  timestamp: string;
  userId?: string;
  songId: string;
  type: 'play' | 'complete' | 'buffer' | 'error';
  message?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  type: 'licensed_catalog' | 'jamendo' | 'archive' | 'custom';
  description: string;
  stats: {
    requests: number;
    errors: number;
    lastPingMs: number;
  };
}
