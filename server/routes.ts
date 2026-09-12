import { Router, Response } from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { db, hashPassword, verifyPassword } from './db';
import { musicService, resolveYouTubeForTrack } from './musicProvider';
import {
  AuthenticatedRequest,
  generateToken,
  requireAuth,
  requireAdmin,
} from './auth';
import { Song, User } from './types';
import { getSongLyrics } from '../src/data/lyricsData';

export const apiRouter = Router();

// Helper to remove passwordHash from user object
function sanitizeUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// ==========================================
// 1. AUTHENTICATION & USER ACCOUNTS
// ==========================================

// Register
apiRouter.post('/auth/register', (req, res) => {
  const { username, email, password, displayName } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: 'Username, email, and password are required.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const existing = db.getUserByUsernameOrEmail(username) || db.getUserByUsernameOrEmail(email);
  if (existing) {
    res.status(400).json({ error: 'User with this username or email already exists.' });
    return;
  }

  const newUser = db.createUser({
    username: username.trim(),
    email: email.trim().toLowerCase(),
    displayName: displayName?.trim() || username.trim(),
    passwordHash: hashPassword(password),
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`,
    role: 'user',
    disabled: false,
  });

  const token = generateToken(newUser);
  res.status(201).json({ user: sanitizeUser(newUser), token });
});

// Login
apiRouter.post('/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    res.status(400).json({ error: 'Username/Email and password are required.' });
    return;
  }

  const user = db.getUserByUsernameOrEmail(identifier);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  if (user.disabled) {
    res.status(403).json({ error: 'This account has been disabled by an administrator.' });
    return;
  }

  const token = generateToken(user);
  res.json({ user: sanitizeUser(user), token });
});

// Google Quick Sign-In & Google Identity Services
apiRouter.post('/auth/google', (req, res) => {
  let { email, displayName, avatarUrl, credential } = req.body;

  // If a real Google Identity credential JWT was passed, decode it
  if (credential && typeof credential === 'string') {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload.email) email = payload.email;
        if (payload.name) displayName = payload.name;
        if (payload.picture) avatarUrl = payload.picture;
      }
    } catch (err) {
      console.warn('Could not decode Google JWT payload:', err);
    }
  }

  const userEmail = (email || '').trim().toLowerCase();
  if (!userEmail) {
    res.status(400).json({ error: 'כתובת אימייל נדרשת' });
    return;
  }
  const userName = userEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user';
  const name = displayName || userName;
  const avatar =
    avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&size=256&bold=true`;

  let user = db.getUserByUsernameOrEmail(userEmail);
  if (!user) {
    user = db.createUser({
      username: userName,
      email: userEmail,
      displayName: name,
      passwordHash: hashPassword('google_auth_oauth_secret_' + userEmail),
      avatarUrl: avatar,
      role: 'user',
      disabled: false,
    });
  } else {
    // Keep profile fresh with real Google details
    user =
      db.updateUser(user.id, {
        displayName: name,
        avatarUrl: avatar,
      }) || user;
  }

  if (user.disabled) {
    res.status(403).json({ error: 'This account has been disabled by an administrator.' });
    return;
  }

  const token = generateToken(user);
  res.json({ user: sanitizeUser(user), token });
});

// Current User profile
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: sanitizeUser(req.user!) });
});

// Edit profile
apiRouter.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const { displayName, username, avatarUrl } = req.body;
  const user = req.user!;

  if (username && username.trim() !== user.username) {
    const existing = db.getUserByUsernameOrEmail(username.trim());
    if (existing && existing.id !== user.id) {
      res.status(400).json({ error: 'Username is already taken.' });
      return;
    }
  }

  const updated = db.updateUser(user.id, {
    displayName: displayName?.trim() || user.displayName,
    username: username?.trim() || user.username,
    avatarUrl: avatarUrl || user.avatarUrl,
  });

  if (!updated) {
    res.status(500).json({ error: 'Failed to update profile.' });
    return;
  }

  res.json({ user: sanitizeUser(updated) });
});

// Change password
apiRouter.put('/auth/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters.' });
    return;
  }

  db.updateUser(user.id, {
    passwordHash: hashPassword(newPassword),
  });

  res.json({ message: 'Password updated successfully.' });
});

// Reset password (recovery flow)
apiRouter.post('/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'Email and new password are required.' });
    return;
  }

  const user = db.getUserByUsernameOrEmail(email);
  if (!user) {
    // Return friendly generic response for security
    res.json({ message: 'If an account exists with this email, password has been reset.' });
    return;
  }

  db.updateUser(user.id, {
    passwordHash: hashPassword(newPassword),
  });

  res.json({ message: 'Password has been reset successfully. You can now log in.' });
});

// Delete account
apiRouter.delete('/auth/account', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  db.deleteUser(user.id);
  res.json({ message: 'Account deleted successfully.' });
});

// ==========================================
// 2. MUSIC BACKEND & STREAMING PROXY
// ==========================================

/**
 * Full-length audio stream proxy with HTTP 206 Range Request support.
 * Allows seeking, scrubbing, fast buffering, and background playback.
 * Does NOT truncate or use 30-second previews.
 */
apiRouter.get('/stream/:trackId', async (req, res) => {
  const { trackId } = req.params;
  const provider = musicService.getActiveProvider();
  const streamInfo = await provider.getStream(trackId);

  if (!streamInfo || !streamInfo.streamUrl) {
    db.logPlayback({
      songId: trackId,
      type: 'error',
      message: 'Track not found or stream unavailable',
    });
    res.status(404).json({ error: 'Audio stream not found for this track.' });
    return;
  }

  const targetUrl = streamInfo.streamUrl;
  const clientRange = req.headers.range;

  try {
    const isHttps = targetUrl.startsWith('https:');
    const client = isHttps ? https : http;

    const options: any = {
      headers: {
        'User-Agent': 'SimplyMusic-AudioEngine/2.0',
      },
    };

    if (clientRange) {
      options.headers['Range'] = clientRange;
    }

    const proxyReq = client.get(targetUrl, options, (proxyRes) => {
      // Handle redirects if any
      if (proxyRes.statusCode && [301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
        res.redirect(proxyRes.headers.location);
        return;
      }

      const statusCode = proxyRes.statusCode || 200;
      res.status(statusCode);

      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'audio/mpeg');
      res.setHeader('X-Full-Length-Playback', 'true');
      res.setHeader('X-Licensed-Provider', streamInfo.sourceProvider);

      if (proxyRes.headers['content-length']) {
        res.setHeader('Content-Length', proxyRes.headers['content-length']);
      }
      if (proxyRes.headers['content-range']) {
        res.setHeader('Content-Range', proxyRes.headers['content-range']);
      }

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Audio stream proxy error:', err);
      db.logPlayback({
        songId: trackId,
        type: 'error',
        message: err.message,
      });
      if (!res.headersSent) {
        // Fallback: redirect directly to authorized stream
        res.redirect(targetUrl);
      }
    });
  } catch (err: any) {
    console.error('Streaming exception:', err);
    res.redirect(targetUrl);
  }
});

// Track details & authorized stream info
apiRouter.get('/music/track/:id', async (req, res) => {
  const provider = musicService.getActiveProvider();
  const track = await provider.getTrack(req.params.id);
  if (!track) {
    res.status(404).json({ error: 'Track not found.' });
    return;
  }
  const streamInfo = await provider.getStream(req.params.id);
  res.json({ track, stream: streamInfo });
});

// Full-length YouTube stream resolution
apiRouter.get('/music/resolve-youtube', async (req, res) => {
  const title = String(req.query.title || '');
  const artist = String(req.query.artist || '');
  const songId = String(req.query.songId || '');

  if (songId) {
    const existing = db.getSongById(songId);
    if (existing && existing.youtubeId) {
      res.json({ youtubeId: existing.youtubeId, duration: existing.duration, coverUrl: existing.coverUrl });
      return;
    }
  }

  const result = await resolveYouTubeForTrack(title, artist);
  if (result) {
    if (songId) {
      const existing = db.getSongById(songId);
      if (existing) {
        existing.youtubeId = result.youtubeId;
        if (result.durationSec) existing.duration = result.durationSec;
        db.upsertSong(existing);
      }
    }
    res.json({ youtubeId: result.youtubeId, duration: result.durationSec, coverUrl: result.thumbnail });
  } else {
    res.status(404).json({ error: 'Could not resolve full-length track.' });
  }
});

// Batch songs retrieval by IDs
apiRouter.post('/music/songs/batch', (req, res) => {
  const ids: string[] = Array.isArray(req.body.ids) ? req.body.ids : [];
  const songs = ids.map(id => db.getSongById(id)).filter(Boolean);
  res.json({ songs });
});

// Similar songs / Spotify Autoplay recommendation engine
apiRouter.get('/music/similar/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const currentSong = db.getSongById(songId);
    const allSongs = db.getSongs();

    let targetArtistName = currentSong?.artistName || '';
    let targetGenre = currentSong?.genre || '';
    let targetTitle = currentSong?.title || '';

    if (!targetArtistName && req.query.artist) targetArtistName = String(req.query.artist);
    if (!targetGenre && req.query.genre) targetGenre = String(req.query.genre);
    if (!targetTitle && req.query.title) targetTitle = String(req.query.title);

    // Accept recently played IDs from client to avoid repeats
    const recentRaw = req.query.recent ? String(req.query.recent) : '';
    const recentIds = new Set<string>(recentRaw ? recentRaw.split(',') : []);

    const seenIds = new Set<string>();
    if (currentSong) seenIds.add(currentSong.id);

    const israeliGenres = ['Mizrahi', 'Israeli Pop', 'Israeli Rock', 'Soul', 'Israeli Folk', 'Hip Hop', 'Rap', 'Mediterranean', 'Classic Israeli', 'Acoustic', 'Ballad', 'Folk'];
    const englishGenres = ['Alternative Rock', 'Pop Rock', 'Britpop', 'R&B', 'Synth-pop', 'Electronic Pop'];

    const isIsraeliSong = israeliGenres.includes(targetGenre) ||
      /[\u0590-\u05FF]/.test(targetArtistName) ||
      /[\u0590-\u05FF]/.test(targetTitle);
    const isEnglishSong = englishGenres.includes(targetGenre) && !isIsraeliSong;

    // Language filter helper
    const matchesLanguage = (s: Song) => {
      if (isIsraeliSong) {
        return israeliGenres.includes(s.genre) ||
          /[\u0590-\u05FF]/.test(s.artistName || '') ||
          /[\u0590-\u05FF]/.test(s.titleHe || s.title || '');
      }
      if (isEnglishSong) {
        return englishGenres.includes(s.genre) && !/[\u0590-\u05FF]/.test(s.artistName || '');
      }
      return true;
    };

    // Helper: clean a title to its "base" form for deduplication
    // Strips "(Remix)", "[Live]", "(Baila)", "(Instrumental)", "(Acappella)", feat. etc.
    const baseTitle = (title: string): string =>
      title
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\s*-\s*(remix|live|acoustic|instrumental|acappella|baila|version|edit|single|radio|cover|official|audio|video)\b.*/gi, '')
        .replace(/\s+feat\..*$/i, '')
        .replace(/\s+ft\..*$/i, '')
        .trim()
        .toLowerCase();

    // Shuffle helper — uses a seed based on current time bucketed to 10s
    // so each call within the same song gets same order, but next song gets different
    const shuffleSeed = Math.floor(Date.now() / 10000);
    const seededShuffle = <T>(arr: T[]): T[] => {
      const a = [...arr];
      let s = shuffleSeed;
      for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        const j = Math.abs(s) % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const pool: Song[] = [];

    // 1. Same artist (shuffled) — show max 3 so queue feels varied
    if (targetArtistName) {
      const sameArtist = seededShuffle(
        allSongs.filter(s =>
          !seenIds.has(s.id) &&
          matchesLanguage(s) &&
          s.artistName &&
          (s.artistName.toLowerCase().includes(targetArtistName.toLowerCase()) ||
           targetArtistName.toLowerCase().includes(s.artistName.toLowerCase()))
        )
      ).slice(0, 3);
      for (const s of sameArtist) { seenIds.add(s.id); pool.push(s); }
    }

    // 2. Same genre (different artist) — shuffled
    if (targetGenre) {
      const sameGenre = seededShuffle(
        allSongs.filter(s =>
          !seenIds.has(s.id) &&
          matchesLanguage(s) &&
          s.genre &&
          s.genre.toLowerCase() === targetGenre.toLowerCase()
        )
      );
      for (const s of sameGenre) { seenIds.add(s.id); pool.push(s); }
    }

    // 3. Same language group — fill remaining slots
    if (pool.length < 15) {
      const langFill = seededShuffle(
        allSongs.filter(s => !seenIds.has(s.id) && matchesLanguage(s))
      );
      for (const s of langFill) {
        seenIds.add(s.id);
        pool.push(s);
        if (pool.length >= 20) break;
      }
    }

    // 4. Last resort — any song
    if (pool.length < 8) {
      const fallback = seededShuffle(allSongs.filter(s => !seenIds.has(s.id)));
      for (const s of fallback) {
        pool.push(s);
        if (pool.length >= 12) break;
      }
    }

    // Move recently played songs to the END so they don't come up immediately
    const notRecent = pool.filter(s => !recentIds.has(s.id));
    const recent = pool.filter(s => recentIds.has(s.id));
    const ordered = [...notRecent, ...recent];

    // Deduplicate by base title — keep only the first (highest priority) version
    const seenBaseTitles = new Set<string>();
    const deduplicated = ordered.filter(s => {
      const base = baseTitle(s.title);
      if (seenBaseTitles.has(base)) return false;
      seenBaseTitles.add(base);
      return true;
    });

    res.json({
      success: true,
      currentSongId: songId,
      similarTracks: deduplicated.slice(0, 12),
    });
  } catch (err: any) {
    console.error('Similar songs error:', err);
    res.status(500).json({ error: 'Failed to fetch similar songs' });
  }
});

// ==========================================
// 3. HOME PAGE SECTIONS
// ==========================================
apiRouter.get('/music/home', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const allSongs = db.getSongs();
  const allArtists = db.getArtists();
  const allAlbums = db.getAlbums();
  const allPlaylists = db.getPlaylists().filter(p => p.isPublic);

  // Recently played for logged-in user
  let recentlyPlayedSongs: Song[] = [];
  if (userId) {
    const recent = db.getRecentlyPlayed(userId);
    recentlyPlayedSongs = recent
      .map(r => db.getSongById(r.songId))
      .filter((s): s is Song => Boolean(s))
      .slice(0, 8);
  }
  if (recentlyPlayedSongs.length === 0) {
    recentlyPlayedSongs = allSongs.slice(0, 6);
  }

  // Recommendation engine: mix of high plays + diverse genres
  const popularSongs = [...allSongs].sort((a, b) => b.plays - a.plays).slice(0, 8);
  const newReleases = [...allSongs].reverse().slice(0, 8);
  const recommendedSongs = [...allSongs].sort(() => 0.5 - Math.random()).slice(0, 8);
  const madeForYou = [...allSongs].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 8);

  res.json({
    recentlyPlayed: recentlyPlayedSongs,
    madeForYou,
    recommendedSongs,
    popularSongs,
    newReleases,
    popularAlbums: allAlbums.slice(0, 6),
    popularArtists: allArtists.slice(0, 6),
    recommendedPlaylists: allPlaylists.slice(0, 6),
  });
});

// ==========================================
// 4. GLOBAL SEARCH
// ==========================================
apiRouter.get('/music/search', async (req, res) => {
  const q = String(req.query.q || '');
  const filter = String(req.query.filter || 'all');
  const provider = musicService.getActiveProvider();
  const results = await provider.search(q, filter);
  res.json(results);
});

// ==========================================
// 5. ARTIST & ALBUM PAGES
// ==========================================
apiRouter.get('/music/artist/:id', async (req, res) => {
  const provider = musicService.getActiveProvider();
  const data = await provider.getArtist(req.params.id);
  if (!data) {
    res.status(404).json({ error: 'Artist not found.' });
    return;
  }
  res.json(data);
});

apiRouter.get('/music/album/:id', async (req, res) => {
  const provider = musicService.getActiveProvider();
  const data = await provider.getAlbum(req.params.id);
  if (!data) {
    res.status(404).json({ error: 'Album not found.' });
    return;
  }
  res.json(data);
});

// ==========================================
// 6. RECOMMENDATIONS ENGINE
// ==========================================
apiRouter.get('/music/recommendations', async (req: AuthenticatedRequest, res) => {
  const allSongs = db.getSongs();
  const allArtists = db.getArtists();
  const allAlbums = db.getAlbums();
  const allPlaylists = db.getPlaylists().filter(p => p.isPublic);

  const userId = req.user?.id;
  let favoriteGenres: string[] = [];

  if (userId) {
    const likedIds = db.getLikedSongs(userId);
    const liked = likedIds.map(id => db.getSongById(id)).filter((s): s is Song => Boolean(s));
    favoriteGenres = Array.from(new Set(liked.map(s => s.genre)));
  }

  let recommendedTracks = allSongs;
  if (favoriteGenres.length > 0) {
    recommendedTracks = allSongs.filter(s => favoriteGenres.includes(s.genre));
    if (recommendedTracks.length < 4) recommendedTracks = allSongs;
  }

  res.json({
    songs: recommendedTracks.slice(0, 10),
    artists: allArtists.slice(0, 4),
    albums: allAlbums.slice(0, 4),
    playlists: allPlaylists.slice(0, 4),
  });
});

// ==========================================
// 7. USER LIBRARY & FAVORITES
// ==========================================

// Liked songs
apiRouter.get('/user/liked', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const songs = db.getLikedSongsWithSongs(user.id);
  res.json({ songs, count: songs.length });
});

apiRouter.post('/user/liked/:songId', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { songId } = req.params;
  const songData = req.body?.song;
  const isLiked = db.toggleLikeSong(user.id, songId, songData);
  res.json({ songId, isLiked });
});

// Followed artists
apiRouter.get('/user/followed', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const artistIds = db.getFollowedArtists(user.id);
  const artists = artistIds
    .map(id => db.getArtistById(id))
    .filter(Boolean);
  res.json({ artists, count: artists.length });
});

apiRouter.post('/user/followed/:artistId', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { artistId } = req.params;
  const isFollowed = db.toggleFollowArtist(user.id, artistId);
  res.json({ artistId, isFollowed });
});

// Recently played history
apiRouter.get('/user/history', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const history = db.getRecentlyPlayed(user.id);
  const items = history
    .map(h => ({
      ...h,
      song: db.getSongById(h.songId),
    }))
    .filter(h => Boolean(h.song));
  res.json({ history: items });
});

apiRouter.post('/user/history', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { songId, playbackPosition } = req.body;
  if (!songId) {
    res.status(400).json({ error: 'Song ID is required.' });
    return;
  }
  db.recordRecentlyPlayed(user.id, songId, playbackPosition || 0);
  db.incrementSongPlays(songId);
  db.logPlayback({
    userId: user.id,
    songId,
    type: 'play',
  });
  res.json({ success: true });
});

// Playback session synchronization (cross-device/persistent player state)
apiRouter.get('/user/playback-session', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const session = db.getPlaybackSession(user.id);
  res.json({ session });
});

apiRouter.put('/user/playback-session', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const session = db.updatePlaybackSession(user.id, req.body);
  res.json({ session });
});

// Combined library overview
apiRouter.get('/user/library', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const playlists = db.getUserPlaylists(user.id);
  const likedSongIds = db.getLikedSongs(user.id);
  const followedArtistIds = db.getFollowedArtists(user.id);
  const followedArtists = followedArtistIds.map(id => db.getArtistById(id)).filter(Boolean);
  const history = db.getRecentlyPlayed(user.id);

  res.json({
    playlists,
    likedCount: likedSongIds.length,
    followedArtists,
    recentCount: history.length,
  });
});

// ==========================================
// 8. PLAYLISTS CRUD
// ==========================================
apiRouter.get('/playlists', (req, res) => {
  const playlists = db.getPlaylists().filter(p => p.isPublic);
  res.json({ playlists });
});

apiRouter.post('/playlists', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { name, description, coverUrl, isPublic } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Playlist name is required.' });
    return;
  }

  const newPlaylist = db.createPlaylist({
    name: name.trim(),
    description: description?.trim() || '',
    coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    ownerId: user.id,
    ownerName: user.displayName || user.username,
    isPublic: isPublic !== undefined ? isPublic : true,
    songIds: [],
  });

  res.status(201).json({ playlist: newPlaylist });
});

apiRouter.get('/playlists/:id', async (req, res) => {
  const provider = musicService.getActiveProvider();
  const data = await provider.getPlaylist(req.params.id);
  if (!data) {
    res.status(404).json({ error: 'Playlist not found.' });
    return;
  }
  res.json(data);
});

apiRouter.put('/playlists/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const playlist = db.getPlaylistById(req.params.id);
  if (!playlist) {
    res.status(404).json({ error: 'Playlist not found.' });
    return;
  }

  if (playlist.ownerId !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'You are not authorized to edit this playlist.' });
    return;
  }

  const { name, description, coverUrl, isPublic } = req.body;
  const updated = db.updatePlaylist(playlist.id, {
    name: name !== undefined ? name.trim() : playlist.name,
    description: description !== undefined ? description.trim() : playlist.description,
    coverUrl: coverUrl !== undefined ? coverUrl : playlist.coverUrl,
    isPublic: isPublic !== undefined ? isPublic : playlist.isPublic,
  });

  res.json({ playlist: updated });
});

apiRouter.delete('/playlists/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const playlist = db.getPlaylistById(req.params.id);
  if (!playlist) {
    res.status(404).json({ error: 'Playlist not found.' });
    return;
  }

  if (playlist.ownerId !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'You are not authorized to delete this playlist.' });
    return;
  }

  db.deletePlaylist(playlist.id);
  res.json({ message: 'Playlist deleted.' });
});

// Add song to playlist
apiRouter.post('/playlists/:id/songs', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const playlist = db.getPlaylistById(req.params.id);
  if (!playlist) {
    res.status(404).json({ error: 'Playlist not found.' });
    return;
  }

  if (playlist.ownerId !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to modify this playlist.' });
    return;
  }

  const { songId } = req.body;
  if (!songId) {
    res.status(400).json({ error: 'Song ID is required.' });
    return;
  }

  if (req.body.song && typeof req.body.song === 'object' && req.body.song.id) {
    db.upsertSong(req.body.song);
  }

  if (!playlist.songIds.includes(songId)) {
    playlist.songIds.push(songId);
    db.save();
  }

  res.json({ playlist });
});

// Remove song from playlist
apiRouter.delete('/playlists/:id/songs/:songId', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const playlist = db.getPlaylistById(req.params.id);
  if (!playlist) {
    res.status(404).json({ error: 'Playlist not found.' });
    return;
  }

  if (playlist.ownerId !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to modify this playlist.' });
    return;
  }

  playlist.songIds = playlist.songIds.filter(id => id !== req.params.songId);
  db.save();
  res.json({ playlist });
});

// Reorder songs in playlist
apiRouter.put('/playlists/:id/reorder', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const playlist = db.getPlaylistById(req.params.id);
  if (!playlist) {
    res.status(404).json({ error: 'Playlist not found.' });
    return;
  }

  if (playlist.ownerId !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to modify this playlist.' });
    return;
  }

  const { songIds } = req.body;
  if (Array.isArray(songIds)) {
    playlist.songIds = songIds;
    db.save();
  }
  res.json({ playlist });
});

// ==========================================
// 9. ADMIN SYSTEM
// ==========================================
apiRouter.get('/admin/stats', requireAuth, requireAdmin, (req, res) => {
  const users = db.getUsers();
  const songs = db.getSongs();
  const playlists = db.getPlaylists();
  const artists = db.getArtists();
  const logs = db.getPlaybackLogs();

  const totalPlays = songs.reduce((sum, s) => sum + (s.plays || 0), 0);
  const errorLogs = logs.filter(l => l.type === 'error');

  res.json({
    totalUsers: users.length,
    activeUsers: users.filter(u => !u.disabled).length,
    totalSongs: songs.length,
    totalArtists: artists.length,
    totalPlaylists: playlists.length,
    totalStreamsServed: totalPlays,
    playbackErrorsCount: errorLogs.length,
  });
});

apiRouter.get('/admin/users', requireAuth, requireAdmin, (req, res) => {
  const users = db.getUsers().map(sanitizeUser);
  res.json({ users });
});

apiRouter.put('/admin/users/:id/disable', requireAuth, requireAdmin, (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const updated = db.updateUser(user.id, {
    disabled: !user.disabled,
  });
  res.json({ user: sanitizeUser(updated!) });
});

apiRouter.get('/admin/providers', requireAuth, requireAdmin, (req, res) => {
  const providers = db.getProviders();
  res.json({ providers });
});

apiRouter.put('/admin/providers/:id/toggle', requireAuth, requireAdmin, (req, res) => {
  const provider = db.getProviders().find(p => p.id === req.params.id);
  if (!provider) {
    res.status(404).json({ error: 'Provider not found.' });
    return;
  }

  const updated = db.updateProvider(provider.id, {
    enabled: !provider.enabled,
  });
  res.json({ provider: updated });
});

apiRouter.get('/admin/errors', requireAuth, requireAdmin, (req, res) => {
  const logs = db.getPlaybackLogs();
  res.json({ logs });
});

// Client playback error telemetry endpoint
apiRouter.post('/admin/log-error', (req, res) => {
  const { songId, message, userAgent } = req.body;
  db.logPlayback({
    songId: songId || 'unknown',
    type: 'error',
    message: `${message || 'Client playback failure'} (UA: ${userAgent || 'browser'})`,
  });
  res.json({ logged: true });
});

// Helper: Parse .LRC format into timed LyricLine[]
function parseLrc(lrcText: string): Array<{ time: number; text: string }> {
  const lines = lrcText.split('\n');
  const result: Array<{ time: number; text: string }> = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = parseFloat('0.' + match[3]);
      const totalSec = min * 60 + sec + ms;
      const text = match[4].trim();
      if (text && !text.startsWith('ar:') && !text.startsWith('ti:') && !text.startsWith('by:') && !text.startsWith('al:')) {
        result.push({ time: Math.round(totalSec * 10) / 10, text });
      }
    }
  }
  return result;
}

// Helper: Distribute plain lyrics lines across song duration
function parsePlainLyrics(plainText: string, totalDuration = 180): Array<{ time: number; text: string }> {
  const lines = plainText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('[') && !l.endsWith(']'));
  if (lines.length === 0) return [];
  const startOffset = 8;
  const usableDuration = Math.max(30, totalDuration - startOffset - 10);
  const step = usableDuration / lines.length;
  return lines.map((text, idx) => ({
    time: Math.round((startOffset + idx * step) * 10) / 10,
    text,
  }));
}

// ==========================================
// DYNAMIC REAL SYNCHRONIZED LYRICS (LRCLIB)
// ==========================================
apiRouter.get('/lyrics', async (req, res) => {
  const { title, artist, duration } = req.query;
  const songTitle = String(title || '').trim();
  const songArtist = String(artist || '').trim();
  const songDuration = parseFloat(String(duration || '180')) || 180;

  if (!songTitle) {
    res.status(400).json({ error: 'Title is required', lyrics: [] });
    return;
  }

  try {
    // Check our verified authentic database first for instant 100% accurate match
    const verified = getSongLyrics({
      id: '',
      title: songTitle,
      titleHe: songTitle,
      artistName: songArtist,
      duration: songDuration,
    });
    if (verified && verified.length > 0) {
      res.json({
        source: 'verified-authentic',
        trackName: songTitle,
        artistName: songArtist,
        lyrics: verified,
      });
      return;
    }

    // Clean track title: remove parenthesis, "- Single", "official video", "קליפ רשמי", etc.
    const cleanTitle = songTitle
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s*-\s*(single|ep|album|remix|version|deluxe|edit|acoustic|live)/gi, '')
      .replace(/קליפ רשמי/gi, '')
      .replace(/official video/gi, '')
      .replace(/official music video/gi, '')
      .replace(/audio/gi, '')
      .replace(/video/gi, '')
      .replace(/lyrics/gi, '')
      .replace(/שיר/gi, '')
      .replace(/[\"״׳']/g, '')
      .replace(/-/g, ' ')
      .trim();

    const primaryArtist = songArtist.split(/[,&]/)[0]?.trim() || '';

    const searchQueries = [
      cleanTitle,
      `${cleanTitle} ${primaryArtist}`.trim(),
      `${cleanTitle} ${songArtist}`.trim(),
      songTitle,
    ];

    let foundLrc: any = null;
    for (const q of searchQueries) {
      if (!q.trim()) continue;
      try {
        const resp = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q.trim())}`, {
          headers: { 'User-Agent': 'SimplyMusicApp/1.0' },
        });
        if (resp.ok) {
          const data: any = await resp.json();
          if (Array.isArray(data) && data.length > 0) {
            const withLyrics = data.find((item: any) => item.syncedLyrics || item.plainLyrics);
            if (withLyrics) {
              foundLrc = withLyrics;
              break;
            }
          }
        }
      } catch (err) {
        // Continue to next query
      }
    }

    if (foundLrc) {
      if (foundLrc.syncedLyrics) {
        const parsed = parseLrc(foundLrc.syncedLyrics);
        if (parsed.length > 0) {
          res.json({
            source: 'lrclib-synced',
            trackName: foundLrc.trackName,
            artistName: foundLrc.artistName,
            lyrics: parsed,
          });
          return;
        }
      }

      if (foundLrc.plainLyrics) {
        const parsed = parsePlainLyrics(foundLrc.plainLyrics, songDuration);
        if (parsed.length > 0) {
          res.json({
            source: 'lrclib-plain',
            trackName: foundLrc.trackName,
            artistName: foundLrc.artistName,
            lyrics: parsed,
          });
          return;
        }
      }
    }

    res.json({ source: 'none', lyrics: [] });
  } catch (err: any) {
    console.error('Lyrics fetch error:', err.message);
    res.json({ source: 'error', lyrics: [] });
  }
});

// ==========================================
// EXPORT PROJECT ZIP ARCHIVE
// ==========================================
apiRouter.get(['/download-zip', '/export-zip'], async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    const zipPath = path.join(os.tmpdir(), `simply-music-codebase-${Date.now()}.zip`);

    const script = `
import os, zipfile
zip_path = r"${zipPath}"
exclude_dirs = {'node_modules', '.git', 'dist', '.cache'}
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.relpath(full, '.')
            zipf.write(full, arc)
`;
    execSync(`python3 -c '${script.replace(/'/g, "'\\''")}'`, { cwd: process.cwd() });

    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'simply-music-project.zip', (err) => {
        try {
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
          }
        } catch (_) {}
      });
    } else {
      res.status(500).json({ error: 'Failed to generate ZIP archive' });
    }
  } catch (err: any) {
    console.error('ZIP generation error:', err);
    res.status(500).json({ error: 'Failed to create ZIP: ' + err.message });
  }
});

// ==========================================
// WINDOWS MSI INSTALLER & EXECUTABLE DOWNLOADS
// ==========================================
apiRouter.get('/download/msi-data', (req, res) => {
  const msiPath = path.join(process.cwd(), 'public', 'simply-music-installer.msi');
  const fallbackMsi = path.join(process.cwd(), 'public', 'simply-music.msi');
  let targetMsi = fs.existsSync(msiPath) ? msiPath : (fs.existsSync(fallbackMsi) ? fallbackMsi : null);

  if (!targetMsi) {
    try {
      const { execSync } = require('child_process');
      execSync('python3 scripts/build_windows_msi.py', { cwd: process.cwd() });
      targetMsi = fs.existsSync(msiPath) ? msiPath : (fs.existsSync(fallbackMsi) ? fallbackMsi : null);
    } catch (e) {
      console.error('Failed to regenerate MSI:', e);
    }
  }

  if (!targetMsi) {
    res.status(404).json({ error: 'קובץ MSI לא נמצא' });
    return;
  }

  const fileBuf = fs.readFileSync(targetMsi);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({
    filename: 'simply-music-installer.msi',
    size: fileBuf.length,
    base64: fileBuf.toString('base64'),
  });
});

apiRouter.get(['/download/msi', '/download-msi', '/msi', '/simply-music.msi', '/simply-music-installer.msi'], (req, res) => {
  res.redirect('/#install-windows');
});

apiRouter.get(['/download/exe', '/SimplyMusic.exe'], (req, res) => {
  res.redirect('/#install-windows');
});

apiRouter.get(['/download/windows-zip', '/simply-music-windows.zip'], (req, res) => {
  res.redirect('/#install-windows');
});

// ==========================================
// ANDROID APK DIRECT DOWNLOAD & BASE64 API
// ==========================================
apiRouter.get('/download/apk-data', (req, res) => {
  const publicApk = path.join(process.cwd(), 'public', 'simply-music.apk');
  const dataApk = path.join(process.cwd(), 'data', 'simply-music.apk');
  const targetApk = fs.existsSync(publicApk) ? publicApk : (fs.existsSync(dataApk) ? dataApk : null);

  if (!targetApk) {
    res.status(404).json({ error: 'קובץ APK לא נמצא' });
    return;
  }

  const fileBuf = fs.readFileSync(targetApk);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({
    filename: 'simply-music.apk',
    size: fileBuf.length,
    base64: fileBuf.toString('base64'),
    mirrorLinks: {
      gofile: 'https://gofile.io/d/UxjvHA2G',
      filebinZip: 'https://filebin.net/simplymusic2026/simply-music-apk.zip',
    }
  });
});

apiRouter.get(['/download/apk', '/download-apk', '/apk', '/simply-music.apk'], async (req, res) => {
  const publicApk = path.join(process.cwd(), 'public', 'simply-music.apk');
  const dataApk = path.join(process.cwd(), 'data', 'simply-music.apk');
  let targetApk = fs.existsSync(publicApk) ? publicApk : (fs.existsSync(dataApk) ? dataApk : null);

  if (!targetApk) {
    try {
      const { execSync } = await import('child_process');
      execSync('python3 scripts/generate_apk_and_assets.py', { cwd: process.cwd() });
      targetApk = fs.existsSync(publicApk) ? publicApk : (fs.existsSync(dataApk) ? dataApk : null);
    } catch (e) {
      console.error('Failed to regenerate APK on the fly:', e);
    }
  }

  if (!targetApk) {
    res.status(404).json({ error: 'קובץ ה-APK לא נמצא כרגע, אנא נסה שוב בעוד מספר שניות.' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="simply-music.apk"');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(targetApk);
});

apiRouter.get(['/download/zip', '/simply-music-apk.zip'], (req, res) => {
  const zipPath = path.join(process.cwd(), 'public', 'simply-music-apk.zip');
  if (!fs.existsSync(zipPath)) {
    res.status(404).json({ error: 'קובץ ZIP לא נמצא' });
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="simply-music-apk.zip"');
  res.sendFile(zipPath);
});


