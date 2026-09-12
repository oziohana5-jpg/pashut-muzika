#!/usr/bin/env python3
"""
Simply Music - Standalone Offline Player Engine Builder
Generates a complete, beautiful, modern music player HTML file containing:
- All 28 songs from simply_music_db.json
- All synchronized lyrics from lyricsData.ts
- 5-band Equalizer with Bass Boost (Web Audio API)
- Sleep Timer with countdown
- Full player with Vinyl disc turntable, Sync Lyrics view, and Queue
- MediaSession API for Android background playback & lockscreen controls
- Instant live search & category chips
- Clean, matte dark UI matching the React app
"""

import json
import os
import re

def get_lyrics_map():
    lyrics_file = 'src/data/lyricsData.ts'
    if not os.path.exists(lyrics_file):
        return {}
    
    with open(lyrics_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract SYNCHRONIZED_LYRICS object entries
    # Format: 'song-id': [ { time: 0, text: '...' }, ... ]
    lyrics_map = {}
    
    # We can match keys and arrays
    pattern = r"['\"]([a-zA-Z0-9_-]+)['\"]\s*:\s*\[([\s\S]*?)\]\s*,"
    for match in re.finditer(pattern, content):
        song_key = match.group(1)
        raw_lines = match.group(2)
        lines = []
        line_pat = r"\{\s*time\s*:\s*([0-9.]+)\s*,\s*text\s*:\s*['\"](.*?)['\"]\s*\}"
        for l_match in re.finditer(line_pat, raw_lines):
            lines.append({
                'time': float(l_match.group(1)),
                'text': l_match.group(2).replace('\\"', '"').replace("\\'", "'")
            })
        if lines:
            lyrics_map[song_key] = lines

    return lyrics_map

def build_standalone_html():
    db_file = 'data/simply_music_db.json'
    with open(db_file, 'r', encoding='utf-8') as f:
        db = json.load(f)

    lyrics_map = get_lyrics_map()

    # Map lyrics key to song IDs
    # song-omer-1 -> 'shnei-meshugaim'
    # song-omer-2 -> 'paskol-chayay'
    # song-omer-3 -> 'noetzet-mabat'
    # song-omer-4 -> 'tel-aviv'
    # song-hanan-1 -> 'aluf-haolam'
    # song-hanan-2 -> 'im-tirzi'
    # song-hanan-3 -> 'atalef-iver'
    # song-hanan-4 -> 'wikipedia'
    # song-hanan-5 -> 'moledet'
    # song-osher-1 -> 'kulam-ganavim'
    # song-osher-2 -> 'down'
    # song-osher-3 -> 'leolam-vaed'
    # song-osher-4 -> 'beemet-shel-haemet'
    # song-peer-1 -> 'ahava-chola'
    # song-peer-2 -> 'derech-hashalom'
    # song-peer-3 -> 'halevai'
    # song-tuna-1 -> 'gam-ze-yaavor'
    # song-tuna-2 -> 'scharchoret'
    # song-tuna-3 -> 'hey-babe'
    # song-eyal-1 -> 'am-yisrael-chai'
    # song-eyal-2 -> 'tslil-meitar'
    # song-shlomo-1 -> 'tetaaru-lachem'
    # song-shlomo-2 -> 'yareach'
    # song-coldplay-1 -> 'viva-la-vida'
    # song-coldplay-2 -> 'sky-full-of-stars'
    # song-coldplay-3 -> 'yellow'
    # song-weeknd-1 -> 'blinding-lights'
    # song-weeknd-2 -> 'save-your-tears'
    
    import base64
    logo_data_uri = '/logo.png'
    logo_path = 'public/logo.png'
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as lf:
            logo_data_uri = 'data:image/png;base64,' + base64.b64encode(lf.read()).decode('utf-8')

    key_mapping = {
        'song-omer-1': 'shnei-meshugaim',
        'song-omer-2': 'paskol-chayay',
        'song-omer-3': 'noetzet-mabat',
        'song-omer-4': 'tel-aviv',
        'song-hanan-1': 'aluf-haolam',
        'song-hanan-2': 'im-tirzi',
        'song-hanan-3': 'atalef-iver',
        'song-hanan-4': 'wikipedia',
        'song-hanan-5': 'moledet',
        'song-osher-1': 'kulam-ganavim',
        'song-osher-2': 'down',
        'song-osher-3': 'leolam-vaed',
        'song-osher-4': 'beemet-shel-haemet',
        'song-peer-1': 'ahava-chola',
        'song-peer-2': 'derech-hashalom',
        'song-peer-3': 'halevai',
        'song-tuna-1': 'gam-ze-yaavor',
        'song-tuna-2': 'secharchoret',
        'song-tuna-3': 'hey-babe',
        'song-eyal-1': 'am-israel-chai',
        'song-eyal-2': 'tzlil-meitar',
        'song-shlomo-1': 'tetaaru-lachem',
        'song-shlomo-2': 'yareach',
        'song-coldplay-1': 'viva-la-vida',
        'song-coldplay-2': 'a-sky-full-of-stars',
        'song-coldplay-3': 'yellow',
        'song-weeknd-1': 'blinding-lights',
        'song-weeknd-2': 'save-your-tears',
    }

    catalog = []
    for s in db.get('songs', []):
        sid = s['id']
        lkey = key_mapping.get(sid, sid)
        song_lyrics = lyrics_map.get(lkey, [])
        if not song_lyrics:
            # Fallback by title match
            t_he = s.get('titleHe') or s.get('title') or ''
            for k, val in lyrics_map.items():
                if val and t_he and t_he in val[0].get('text', ''):
                    song_lyrics = val
                    break
        
        # Category classification
        cat = 'israeli'
        if s.get('genre') == 'Mizrahi' or 'אדם' in s.get('artistName', '') or 'גולן' in s.get('artistName', '') or 'כהן' in s.get('artistName', ''):
            cat = 'mizrahi'
        elif 'Coldplay' in s.get('artistName', '') or 'Weeknd' in s.get('artistName', ''):
            cat = 'international'
        elif 'טונה' in s.get('artistName', ''):
            cat = 'rock'
        elif 'ארצי' in s.get('artistName', ''):
            cat = 'nostalgia'

        catalog.append({
            'id': sid,
            'title': s.get('titleHe') or s.get('title'),
            'artist': s.get('artistName'),
            'album': s.get('albumName'),
            'cover': s.get('coverUrl'),
            'audioUrl': s.get('streamUrl'),
            'duration': s.get('duration', 180),
            'ytId': s.get('youtubeId'),
            'category': cat,
            'lyrics': song_lyrics
        })

    catalog_json = json.dumps(catalog, ensure_ascii=False)

    html = f'''<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>פשוט מוזיקה</title>
  <meta name="description" content="אפליקציית פשוט מוזיקה - שירים ישראליים ובינלאומיים, מילים מסונכרנות, איקוולייזר וטיימר שינה" />
  <meta name="theme-color" content="#0a0b0f" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="icon" type="image/png" href="/logo.png" />
  <style>
    :root {{
      --bg-dark: #0a0b0f;
      --card-bg: #12141c;
      --card-hover: #181a26;
      --border-subtle: rgba(255, 255, 255, 0.08);
      --text-main: #f4f4f5;
      --text-muted: #a1a1aa;
      --accent: #ffffff;
      --accent-blue: #3b82f6;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }}
    body {{
      background: var(--bg-dark);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      padding-bottom: 90px;
    }}
    /* Top Bar */
    header {{
      position: sticky;
      top: 0;
      z-index: 30;
      background: rgba(10, 11, 15, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }}
    .brand {{
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }}
    .brand-logo {{
      width: 32px;
      height: 32px;
      border-radius: 8px;
      object-fit: contain;
    }}
    .brand-name {{
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #fff;
    }}
    .header-actions {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .icon-btn {{
      background: #181922;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }}
    .icon-btn:hover, .icon-btn:active {{
      background: #232532;
      color: #fff;
    }}

    /* Search & Categories */
    .controls-panel {{
      padding: 14px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }}
    .search-box {{
      position: relative;
      width: 100%;
    }}
    .search-box input {{
      width: 100%;
      background: #14161f;
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 10px 40px 10px 14px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border 0.2s;
    }}
    .search-box input:focus {{
      border-color: rgba(255, 255, 255, 0.25);
    }}
    .search-icon {{
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 16px;
      pointer-events: none;
    }}
    .chips-row {{
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      padding-bottom: 2px;
    }}
    .chips-row::-webkit-scrollbar {{
      display: none;
    }}
    .chip {{
      padding: 6px 14px;
      border-radius: 20px;
      background: #151722;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .chip.active {{
      background: #fff;
      color: #000;
      border-color: #fff;
    }}

    /* Track List */
    .content-area {{
      padding: 8px 16px;
      flex: 1;
    }}
    .section-title {{
      font-size: 15px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .track-list {{
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}
    .track-item {{
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 10px;
      border-radius: 12px;
      background: var(--card-bg);
      border: 1px solid transparent;
      cursor: pointer;
      transition: background 0.2s, border 0.2s;
    }}
    .track-item:hover {{
      background: var(--card-hover);
    }}
    .track-item.playing {{
      background: #1c1e2d;
      border-color: rgba(59, 130, 246, 0.3);
    }}
    .track-idx {{
      width: 20px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-align: center;
      flex-shrink: 0;
    }}
    .track-cover {{
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
      background: #0f1016;
      flex-shrink: 0;
    }}
    .track-info {{
      flex: 1;
      min-width: 0;
    }}
    .track-title {{
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    .track-artist {{
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    .track-actions {{
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }}
    .btn-action {{
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 16px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
    }}
    .btn-action:hover {{
      color: #fff;
    }}
    .btn-action.liked {{
      color: #f43f5e;
    }}

    /* Bottom Mini Player */
    .mini-player {{
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 74px;
      background: rgba(18, 20, 28, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      z-index: 50;
      cursor: pointer;
    }}
    .mini-progress {{
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.1);
    }}
    .mini-progress-fill {{
      height: 100%;
      background: #3b82f6;
      width: 0%;
      transition: width 0.15s linear;
    }}
    .mini-cover {{
      width: 46px;
      height: 46px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
      background: #0f1016;
    }}
    .mini-info {{
      flex: 1;
      min-width: 0;
    }}
    .mini-title {{
      font-size: 13.5px;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    .mini-artist {{
      font-size: 11.5px;
      color: var(--text-muted);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    .mini-controls {{
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      cursor: default;
    }}
    .mini-btn {{
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
    }}
    .mini-btn-play {{
      width: 40px;
      height: 40px;
      background: #fff;
      color: #000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }}

    /* Full Player Modal */
    .full-player {{
      position: fixed;
      inset: 0;
      background: #0a0b0f;
      z-index: 100;
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 16px;
      padding-top: max(16px, env(safe-area-inset-top));
      padding-bottom: max(20px, env(safe-area-inset-bottom));
      overflow-y: auto;
    }}
    .full-player.open {{
      transform: translateY(0);
    }}
    .fp-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }}
    .fp-tabs {{
      display: flex;
      background: #14161f;
      border-radius: 10px;
      padding: 3px;
      gap: 3px;
      border: 1px solid var(--border-subtle);
    }}
    .fp-tab {{
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 7px;
      cursor: pointer;
    }}
    .fp-tab.active {{
      background: #222533;
      color: #fff;
    }}
    .fp-body {{
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 280px;
    }}

    /* Vinyl Disc Turntable */
    .vinyl-container {{
      width: 250px;
      height: 250px;
      border-radius: 50%;
      background: #0f1015;
      border: 4px solid #1a1c26;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.9);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }}
    .vinyl-disc {{
      width: 230px;
      height: 230px;
      border-radius: 50%;
      background: radial-gradient(circle, #1a1b24 30%, #0d0e14 70%);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: spin 18s linear infinite;
      animation-play-state: paused;
    }}
    .vinyl-disc.spinning {{
      animation-play-state: running;
    }}
    @keyframes spin {{
      from {{ transform: rotate(0deg); }}
      to {{ transform: rotate(360deg); }}
    }}
    .vinyl-center {{
      width: 96px;
      height: 96px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid #000;
    }}
    .vinyl-center img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
    }}

    /* Synchronized Lyrics Container */
    .lyrics-view {{
      width: 100%;
      max-width: 480px;
      height: 320px;
      overflow-y: auto;
      scrollbar-width: none;
      display: flex;
      flex-direction: column;
      gap: 14px;
      text-align: center;
      padding: 20px 10px;
    }}
    .lyrics-view::-webkit-scrollbar {{
      display: none;
    }}
    .lyric-line {{
      font-size: 18px;
      color: #636674;
      font-weight: 600;
      line-height: 1.6;
      transition: all 0.25s ease;
      cursor: pointer;
    }}
    .lyric-line.active {{
      font-size: 23px;
      color: #fff;
      font-weight: 800;
      transform: scale(1.04);
    }}

    /* Audio Quick Bar */
    .quick-bar {{
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 12px 0;
      width: 100%;
      max-width: 400px;
    }}
    .quick-btn {{
      background: #141620;
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 7px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }}
    .quick-btn.active {{
      background: #25283a;
      color: #fff;
      border-color: rgba(255, 255, 255, 0.2);
    }}

    /* Progress & Scrubber */
    .scrubber-panel {{
      width: 100%;
      max-width: 440px;
      margin-top: 8px;
    }}
    .scrubber-slider {{
      width: 100%;
      -webkit-appearance: none;
      appearance: none;
      height: 5px;
      border-radius: 3px;
      background: #252734;
      outline: none;
      cursor: pointer;
    }}
    .scrubber-slider::-webkit-slider-thumb {{
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #fff;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    }}
    .time-row {{
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 4px;
    }}

    /* Playback Controls */
    .fp-controls {{
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
      margin-top: 14px;
      width: 100%;
      max-width: 400px;
    }}
    .fp-btn {{
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 22px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .fp-btn:hover {{
      color: #fff;
    }}
    .fp-btn-play {{
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #fff;
      color: #000;
      font-size: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 20px rgba(255,255,255,0.15);
    }}

    /* Modal dialogs (Equalizer, Sleep Timer, Server Config) */
    .modal-overlay {{
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 200;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }}
    .modal-overlay.open {{
      display: flex;
    }}
    .modal-card {{
      background: #141620;
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 20px;
      width: 100%;
      max-width: 380px;
      max-height: 85vh;
      overflow-y: auto;
    }}
    .modal-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }}
    .modal-title {{
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }}
    .slider-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }}
    .slider-label {{
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      width: 60px;
    }}
    .slider-input {{
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 4px;
      border-radius: 2px;
      background: #262938;
      outline: none;
    }}
    .slider-input::-webkit-slider-thumb {{
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
    }}
    .btn-preset {{
      padding: 6px 12px;
      border-radius: 8px;
      background: #1e202d;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }}
    .btn-preset.active {{
      background: #fff;
      color: #000;
    }}
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="brand" onclick="window.scrollTo({{ top: 0, behavior: 'smooth' }})">
      <img src="{logo_data_uri}" alt="פשוט מוזיקה" class="brand-logo" />
      <span class="brand-name">פשוט מוזיקה</span>
    </div>
    <div class="header-actions">
      <button class="icon-btn" onclick="openServerModal()" title="הגדרות שרת וחיבור">
        <span>🌐 שרת / ענן</span>
      </button>
      <button class="icon-btn" onclick="openSleepModal()" id="btn-sleep-header" title="טיימר שינה">
        <span>⏱️ טיימר</span>
      </button>
      <button class="icon-btn" onclick="openEqModal()" title="איקוולייזר">
        <span>🎚️ איקוולייזר</span>
      </button>
    </div>
  </header>

  <!-- Controls Panel: Search & Category Chips -->
  <div class="controls-panel">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" id="search-input" placeholder="חיפוש שירים, זמרים או מילים..." />
    </div>

    <div class="chips-row">
      <button class="chip active" onclick="filterCat('all', this)">הכול</button>
      <button class="chip" onclick="filterCat('liked', this)">שירים שאהבתי ❤️</button>
      <button class="chip" onclick="filterCat('israeli', this)">ישראלי</button>
      <button class="chip" onclick="filterCat('mizrahi', this)">ים תיכוני</button>
      <button class="chip" onclick="filterCat('rock', this)">רוק וראפ</button>
      <button class="chip" onclick="filterCat('international', this)">בינלאומי</button>
      <button class="chip" onclick="filterCat('nostalgia', this)">נוסטלגיה</button>
    </div>
  </div>

  <!-- Content Area: Song List -->
  <main class="content-area">
    <div class="section-title">
      <span id="section-heading">קטלוג שירים מלא</span>
      <span id="track-count-badge" style="font-size: 11px; font-weight: 600; color: #71717a;">28 שירים</span>
    </div>
    <div class="track-list" id="track-list-container"></div>
  </main>

  <!-- Bottom Mini Player -->
  <div class="mini-player" id="mini-player" onclick="expandFullPlayer()" style="display: none;">
    <div class="mini-progress">
      <div class="mini-progress-fill" id="mini-progress-fill"></div>
    </div>
    <img src="" alt="" class="mini-cover" id="mini-cover" />
    <div class="mini-info">
      <div class="mini-title" id="mini-title">-</div>
      <div class="mini-artist" id="mini-artist">-</div>
    </div>
    <div class="mini-controls" onclick="event.stopPropagation()">
      <button class="mini-btn" onclick="toggleLikeCurrent()" id="mini-like-btn" title="אהבתי">🤍</button>
      <button class="mini-btn" onclick="playPrev()" title="הקודם">⏮️</button>
      <button class="mini-btn mini-btn-play" onclick="togglePlay()" id="mini-play-btn" title="נגן/השהה">▶</button>
      <button class="mini-btn" onclick="playNext()" title="הבא">⏭️</button>
    </div>
  </div>

  <!-- Full Player Modal -->
  <div class="full-player" id="full-player">
    <div class="fp-header">
      <button class="icon-btn" onclick="closeFullPlayer()" style="font-size: 16px; padding: 6px 12px;">▼</button>
      <div class="fp-tabs">
        <button class="fp-tab active" onclick="switchFpTab('vinyl', this)">תקליט 💿</button>
        <button class="fp-tab" onclick="switchFpTab('lyrics', this)">מילים 📜</button>
        <button class="fp-tab" onclick="switchFpTab('queue', this)">תור השמעה 📑</button>
      </div>
      <button class="icon-btn" onclick="toggleLikeCurrent()" id="fp-like-btn">🤍</button>
    </div>

    <!-- Center Tab Body -->
    <div class="fp-body" id="fp-body">
      <!-- Tab 1: Vinyl Disc -->
      <div id="tab-vinyl-content" style="display: flex; flex-direction: column; align-items: center;">
        <div class="vinyl-container">
          <div class="vinyl-disc" id="vinyl-disc">
            <div class="vinyl-center">
              <img src="" id="fp-vinyl-img" alt="" />
            </div>
          </div>
        </div>
        <h2 id="fp-title" style="font-size: 18px; font-weight: 800; color: #fff; margin-top: 4px; text-align: center;">-</h2>
        <p id="fp-artist" style="font-size: 14px; color: var(--text-muted); margin-top: 2px; text-align: center;">-</p>
      </div>

      <!-- Tab 2: Synchronized Lyrics -->
      <div id="tab-lyrics-content" style="display: none; width: 100%; flex-direction: column; align-items: center;">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button class="icon-btn" onclick="changeLyricFontSize(-2)">A-</button>
          <button class="icon-btn" onclick="changeLyricFontSize(2)">A+</button>
        </div>
        <div class="lyrics-view" id="lyrics-scroll-box"></div>
      </div>

      <!-- Tab 3: Queue -->
      <div id="tab-queue-content" style="display: none; width: 100%; max-width: 440px; max-height: 320px; overflow-y: auto;">
        <div class="track-list" id="queue-list-container"></div>
      </div>
    </div>

    <!-- Audio Quick Bar (Equalizer, Sleep Timer, Speed, Video) -->
    <div class="quick-bar">
      <button class="quick-btn" onclick="openEqModal()">🎚️ איקוולייזר</button>
      <button class="quick-btn" onclick="openSleepModal()" id="btn-sleep-quick">⏱️ טיימר</button>
      <button class="quick-btn" onclick="cyclePlaybackRate()" id="btn-speed-quick">1.0x</button>
      <button class="quick-btn" onclick="toggleVideoMode()" id="btn-video-quick">📺 וידאו</button>
    </div>

    <!-- Scrubber -->
    <div class="scrubber-panel">
      <input type="range" min="0" max="100" value="0" class="scrubber-slider" id="scrubber" oninput="onScrub(this.value)" />
      <div class="time-row">
        <span id="time-current">0:00</span>
        <span id="time-duration">0:00</span>
      </div>
    </div>

    <!-- Playback Controls -->
    <div class="fp-controls">
      <button class="fp-btn" onclick="toggleShuffle()" id="btn-shuffle" title="ערבב">🔀</button>
      <button class="fp-btn" onclick="playPrev()" title="הקודם" style="font-size: 28px;">⏮️</button>
      <button class="fp-btn fp-btn-play" onclick="togglePlay()" id="fp-play-btn" title="נגן/השהה">▶</button>
      <button class="fp-btn" onclick="playNext()" title="הבא" style="font-size: 28px;">⏭️</button>
      <button class="fp-btn" onclick="toggleRepeat()" id="btn-repeat" title="חזור">🔁</button>
    </div>
  </div>

  <!-- Equalizer Modal -->
  <div class="modal-overlay" id="eq-modal" onclick="closeModal('eq-modal')">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-header">
        <span class="modal-title">איקוולייזר ובאס (Equalizer)</span>
        <button class="icon-btn" onclick="closeModal('eq-modal')">✕</button>
      </div>
      
      <!-- Presets -->
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
        <button class="btn-preset active" onclick="applyPreset('flat', this)">שטוח</button>
        <button class="btn-preset" onclick="applyPreset('bass', this)">באס עוצמתי</button>
        <button class="btn-preset" onclick="applyPreset('vocal', this)">ווקאלי</button>
        <button class="btn-preset" onclick="applyPreset('rock', this)">רוק</button>
        <button class="btn-preset" onclick="applyPreset('electronic', this)">אלקטרוני</button>
      </div>

      <!-- Bass Boost Slider -->
      <div class="slider-row">
        <span class="slider-label" style="color: #60a5fa;">באס בוסט</span>
        <input type="range" min="0" max="15" value="0" class="slider-input" id="eq-bass" oninput="updateEq()" />
        <span id="val-bass" style="font-size: 11px; width: 30px; text-align: left;">0 dB</span>
      </div>

      <!-- 5 Bands -->
      <div class="slider-row">
        <span class="slider-label">60 Hz</span>
        <input type="range" min="-12" max="12" value="0" class="slider-input" id="eq-60" oninput="updateEq()" />
        <span id="val-60" style="font-size: 11px; width: 30px; text-align: left;">0 dB</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">230 Hz</span>
        <input type="range" min="-12" max="12" value="0" class="slider-input" id="eq-230" oninput="updateEq()" />
        <span id="val-230" style="font-size: 11px; width: 30px; text-align: left;">0 dB</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">910 Hz</span>
        <input type="range" min="-12" max="12" value="0" class="slider-input" id="eq-910" oninput="updateEq()" />
        <span id="val-910" style="font-size: 11px; width: 30px; text-align: left;">0 dB</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">3.6 kHz</span>
        <input type="range" min="-12" max="12" value="0" class="slider-input" id="eq-3600" oninput="updateEq()" />
        <span id="val-3600" style="font-size: 11px; width: 30px; text-align: left;">0 dB</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">14 kHz</span>
        <input type="range" min="-12" max="12" value="0" class="slider-input" id="eq-14000" oninput="updateEq()" />
        <span id="val-14000" style="font-size: 11px; width: 30px; text-align: left;">0 dB</span>
      </div>
    </div>
  </div>

  <!-- Sleep Timer Modal -->
  <div class="modal-overlay" id="sleep-modal" onclick="closeModal('sleep-modal')">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-header">
        <span class="modal-title">טיימר שינה (Sleep Timer)</span>
        <button class="icon-btn" onclick="closeModal('sleep-modal')">✕</button>
      </div>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">
        הנגן יכבה את המוזיקה באופן הדרגתי ושקט בזמן שתבחר:
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="icon-btn" style="padding: 10px;" onclick="setSleep(15)">⏱️ 15 דקות</button>
        <button class="icon-btn" style="padding: 10px;" onclick="setSleep(30)">⏱️ 30 דקות</button>
        <button class="icon-btn" style="padding: 10px;" onclick="setSleep(45)">⏱️ 45 דקות</button>
        <button class="icon-btn" style="padding: 10px;" onclick="setSleep(60)">⏱️ 60 דקות (שעה)</button>
        <button class="icon-btn" style="padding: 10px;" onclick="setSleep('end')">🎵 בסיום השיר הנוכחי</button>
        <button class="icon-btn" style="padding: 10px; color: #f43f5e;" onclick="cancelSleep()">ביטול טיימר שינה</button>
      </div>
    </div>
  </div>

  <!-- Server & Sync Modal -->
  <div class="modal-overlay" id="server-modal" onclick="closeModal('server-modal')">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-header">
        <span class="modal-title">חיבור ענן וסנכרון שרת</span>
        <button class="icon-btn" onclick="closeModal('server-modal')">✕</button>
      </div>
      <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">
        האפליקציה פועלת כרגע ב-<strong>מצב עצמאי מקומי (Offline Standalone)</strong> עם כל 28 השירים והמילים המלאות ללא תלות ברשת.
      </p>
      <div style="margin-bottom: 12px;">
        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">
          כתובת שרת ענן מותאמת אישית:
        </label>
        <input type="text" id="custom-server-url" placeholder="https://simply-music.onrender.com" 
               style="width: 100%; background: #0f1016; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 13px;" />
      </div>
      <div style="display: flex; gap: 8px; margin-bottom: 14px;">
        <button class="icon-btn" onclick="testServerConnection()" style="flex: 1; justify-content: center;">🔍 בדוק חיבור</button>
        <button class="icon-btn" onclick="connectToCustomServer()" style="flex: 1; justify-content: center; background: #2563eb; color: #fff;">🚀 התחבר עכשיו</button>
      </div>
      <div id="server-ping-result" style="font-size: 12px; color: #a1a1aa; text-align: center;"></div>
    </div>
  </div>

  <!-- Video Container (Hidden or Floating) -->
  <div id="video-overlay" style="display: none; position: fixed; top: 60px; left: 16px; right: 16px; z-index: 120; background: #000; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-subtle);">
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: #12141c;">
      <span style="font-size: 12px; font-weight: 700; color: #fff;">קליפ וידאו רשמי</span>
      <button class="icon-btn" onclick="toggleVideoMode()" style="padding: 2px 8px;">✕</button>
    </div>
    <div id="yt-player-slot" style="width: 100%; aspect-ratio: 16/9;"></div>
  </div>

  <!-- Audio Element -->
  <audio id="audio-engine" preload="auto"></audio>

  <script>
    // Embedded Catalog
    const CATALOG = {catalog_json};

    // State
    let currentList = [...CATALOG];
    let currentIndex = -1;
    let isPlaying = false;
    let likedTrackIds = JSON.parse(localStorage.getItem('simply_liked_tracks') || '[]');
    let isShuffle = false;
    let isRepeat = false;
    let currentCategory = 'all';
    let playbackRates = [1.0, 1.25, 1.5, 0.75];
    let rateIdx = 0;
    let sleepTimerId = null;
    let sleepEndTime = null;
    let lyricFontSize = 18;

    // Audio & Web Audio API
    const audio = document.getElementById('audio-engine');
    let audioCtx = null;
    let eqNodes = [];
    let bassNode = null;

    function initWebAudio() {{
      if (audioCtx) return;
      try {{
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(audio);

        // Create 5 peaking filters + 1 low shelf for bass boost
        bassNode = audioCtx.createBiquadFilter();
        bassNode.type = 'lowshelf';
        bassNode.frequency.value = 100;
        bassNode.gain.value = 0;

        const freqs = [60, 230, 910, 3600, 14000];
        let lastNode = source;
        lastNode.connect(bassNode);
        lastNode = bassNode;

        eqNodes = freqs.map((freq) => {{
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1.0;
          filter.gain.value = 0;
          lastNode.connect(filter);
          lastNode = filter;
          return filter;
        }});

        lastNode.connect(audioCtx.destination);
      }} catch(e) {{
        console.warn('Web Audio init error:', e);
      }}
    }}

    // Render Track List
    function renderTracks(tracks) {{
      const container = document.getElementById('track-list-container');
      container.innerHTML = '';
      document.getElementById('track-count-badge').textContent = tracks.length + ' שירים';

      tracks.forEach((track, idx) => {{
        const isCurrent = currentIndex >= 0 && currentList[currentIndex] && currentList[currentIndex].id === track.id;
        const liked = likedTrackIds.includes(track.id);

        const item = document.createElement('div');
        item.className = 'track-item' + (isCurrent ? ' playing' : '');
        item.onclick = () => playTrack(track);

        const min = Math.floor(track.duration / 60);
        const sec = (track.duration % 60).toString().padStart(2, '0');

        item.innerHTML = `
          <span class="track-idx">${{isCurrent && isPlaying ? '🔊' : (idx + 1)}}</span>
          <img src="${{track.cover}}" class="track-cover" alt="" loading="lazy" onerror="this.src='/logo.png'" />
          <div class="track-info">
            <div class="track-title">${{track.title}}</div>
            <div class="track-artist">${{track.artist}} • ${{min}}:${{sec}}</div>
          </div>
          <div class="track-actions" onclick="event.stopPropagation()">
            <button class="btn-action ${{liked ? 'liked' : ''}}" onclick="toggleLike('${{track.id}}', this)">
              ${{liked ? '❤️' : '🤍'}}
            </button>
          </div>
        `;
        container.appendChild(item);
      }});
    }}

    // Play Track
    function playTrack(track) {{
      initWebAudio();
      if (audioCtx && audioCtx.state === 'suspended') {{
        audioCtx.resume();
      }}

      const idx = currentList.findIndex(t => t.id === track.id);
      currentIndex = idx >= 0 ? idx : 0;
      const current = currentList[currentIndex];

      audio.src = current.audioUrl;
      audio.playbackRate = playbackRates[rateIdx];
      audio.play().then(() => {{
        isPlaying = true;
        updateUI();
      }}).catch(err => {{
        console.warn('Audio play failed:', err);
      }});

      // Media Session API for lockscreen controls
      if ('mediaSession' in navigator) {{
        navigator.mediaSession.metadata = new MediaMetadata({{
          title: current.title,
          artist: current.artist,
          album: current.album || 'פשוט מוזיקה',
          artwork: [
            {{ src: current.cover, sizes: '512x512', type: 'image/jpeg' }}
          ]
        }});

        navigator.mediaSession.setActionHandler('play', () => togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
      }}

      renderLyrics(current.lyrics || []);
      updateUI();
      renderTracks(currentList);
    }}

    function togglePlay() {{
      if (currentIndex === -1 && currentList.length > 0) {{
        playTrack(currentList[0]);
        return;
      }}
      if (audio.paused) {{
        audio.play().then(() => {{
          isPlaying = true;
          updateUI();
        }});
      }} else {{
        audio.pause();
        isPlaying = false;
        updateUI();
      }}
      renderTracks(currentList);
    }}

    function playNext() {{
      if (currentList.length === 0) return;
      if (isShuffle) {{
        currentIndex = Math.floor(Math.random() * currentList.length);
      }} else {{
        currentIndex = (currentIndex + 1) % currentList.length;
      }}
      playTrack(currentList[currentIndex]);
    }}

    function playPrev() {{
      if (currentList.length === 0) return;
      if (audio.currentTime > 3) {{
        audio.currentTime = 0;
        return;
      }}
      currentIndex = (currentIndex - 1 + currentList.length) % currentList.length;
      playTrack(currentList[currentIndex]);
    }}

    function updateUI() {{
      if (currentIndex < 0 || !currentList[currentIndex]) return;
      const current = currentList[currentIndex];
      const liked = likedTrackIds.includes(current.id);

      // Mini Player
      document.getElementById('mini-player').style.display = 'flex';
      document.getElementById('mini-cover').src = current.cover;
      document.getElementById('mini-title').textContent = current.title;
      document.getElementById('mini-artist').textContent = current.artist;
      document.getElementById('mini-play-btn').textContent = isPlaying ? '⏸' : '▶';
      document.getElementById('mini-like-btn').textContent = liked ? '❤️' : '🤍';

      // Full Player
      document.getElementById('fp-vinyl-img').src = current.cover;
      document.getElementById('fp-title').textContent = current.title;
      document.getElementById('fp-artist').textContent = current.artist;
      document.getElementById('fp-play-btn').textContent = isPlaying ? '⏸' : '▶';
      document.getElementById('fp-like-btn').textContent = liked ? '❤️' : '🤍';

      const vinyl = document.getElementById('vinyl-disc');
      if (isPlaying) {{
        vinyl.classList.add('spinning');
      }} else {{
        vinyl.classList.remove('spinning');
      }}
    }}

    // Scrubber & Time
    audio.addEventListener('timeupdate', () => {{
      if (!audio.duration) return;
      const cur = audio.currentTime;
      const dur = audio.duration;
      const pct = (cur / dur) * 100;

      document.getElementById('mini-progress-fill').style.width = pct + '%';
      document.getElementById('scrubber').value = pct;

      document.getElementById('time-current').textContent = formatTime(cur);
      document.getElementById('time-duration').textContent = formatTime(dur);

      syncLyricsHighlight(cur);
    }});

    audio.addEventListener('ended', () => {{
      if (sleepEndTime && Date.now() >= sleepEndTime) {{
        cancelSleep();
        return;
      }}
      if (isRepeat) {{
        audio.currentTime = 0;
        audio.play();
      }} else {{
        playNext();
      }}
    }});

    function formatTime(s) {{
      if (isNaN(s)) return '0:00';
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60).toString().padStart(2, '0');
      return m + ':' + sec;
    }}

    function onScrub(val) {{
      if (!audio.duration) return;
      audio.currentTime = (val / 100) * audio.duration;
    }}

    // Synchronized Lyrics
    function renderLyrics(lines) {{
      const container = document.getElementById('lyrics-scroll-box');
      container.innerHTML = '';
      if (!lines || lines.length === 0) {{
        container.innerHTML = '<p style="color: #52525b; margin-top: 40px;">לא נמצאו מילים מסונכרנות לשיר זה</p>';
        return;
      }}

      lines.forEach((line, idx) => {{
        const p = document.createElement('p');
        p.className = 'lyric-line';
        p.id = 'lyric-line-' + idx;
        p.style.fontSize = lyricFontSize + 'px';
        p.textContent = line.text;
        p.onclick = () => {{
          audio.currentTime = line.time;
        }};
        container.appendChild(p);
      }});
    }}

    function syncLyricsHighlight(currentTime) {{
      if (currentIndex < 0) return;
      const lines = currentList[currentIndex].lyrics;
      if (!lines || lines.length === 0) return;

      let activeIdx = -1;
      for (let i = 0; i < lines.length; i++) {{
        if (currentTime >= lines[i].time) {{
          activeIdx = i;
        }} else {{
          break;
        }}
      }}

      document.querySelectorAll('.lyric-line').forEach((el, idx) => {{
        if (idx === activeIdx) {{
          if (!el.classList.contains('active')) {{
            el.classList.add('active');
            el.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
          }}
        }} else {{
          el.classList.remove('active');
        }}
      }});
    }}

    function changeLyricFontSize(delta) {{
      lyricFontSize = Math.max(14, Math.min(28, lyricFontSize + delta));
      document.querySelectorAll('.lyric-line').forEach(el => {{
        el.style.fontSize = lyricFontSize + 'px';
      }});
    }}

    // Likes
    function toggleLike(id, btn) {{
      if (likedTrackIds.includes(id)) {{
        likedTrackIds = likedTrackIds.filter(x => x !== id);
        if (btn) {{
          btn.classList.remove('liked');
          btn.textContent = '🤍';
        }}
      }} else {{
        likedTrackIds.push(id);
        if (btn) {{
          btn.classList.add('liked');
          btn.textContent = '❤️';
        }}
      }}
      localStorage.setItem('simply_liked_tracks', JSON.stringify(likedTrackIds));
      updateUI();
    }}

    function toggleLikeCurrent() {{
      if (currentIndex >= 0 && currentList[currentIndex]) {{
        toggleLike(currentList[currentIndex].id);
      }}
    }}

    // Categories
    function filterCat(cat, btn) {{
      currentCategory = cat;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');

      if (cat === 'all') {{
        currentList = [...CATALOG];
        document.getElementById('section-heading').textContent = 'קטלוג שירים מלא';
      }} else if (cat === 'liked') {{
        currentList = CATALOG.filter(t => likedTrackIds.includes(t.id));
        document.getElementById('section-heading').textContent = 'שירים שאהבתי ❤️';
      }} else {{
        currentList = CATALOG.filter(t => t.category === cat);
        document.getElementById('section-heading').textContent = btn.textContent;
      }}
      renderTracks(currentList);
    }}

    // Live Search
    document.getElementById('search-input').addEventListener('input', (e) => {{
      const q = e.target.value.trim().toLowerCase();
      if (!q) {{
        filterCat('all', document.querySelector('.chip'));
        return;
      }}
      currentList = CATALOG.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.artist.toLowerCase().includes(q) ||
        (t.lyrics && t.lyrics.some(l => l.text.toLowerCase().includes(q)))
      );
      document.getElementById('section-heading').textContent = 'תוצאות חיפוש עבור "' + q + '"';
      renderTracks(currentList);
    }});

    // Full Player Modal Navigation
    function expandFullPlayer() {{
      document.getElementById('full-player').classList.add('open');
    }}
    function closeFullPlayer() {{
      document.getElementById('full-player').classList.remove('open');
    }}

    function switchFpTab(tab, btn) {{
      document.querySelectorAll('.fp-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.getElementById('tab-vinyl-content').style.display = tab === 'vinyl' ? 'flex' : 'none';
      document.getElementById('tab-lyrics-content').style.display = tab === 'lyrics' ? 'flex' : 'none';
      document.getElementById('tab-queue-content').style.display = tab === 'queue' ? 'block' : 'none';

      if (tab === 'queue') {{
        renderQueue();
      }}
    }}

    function renderQueue() {{
      const qCont = document.getElementById('queue-list-container');
      qCont.innerHTML = '';
      currentList.forEach((track, idx) => {{
        const item = document.createElement('div');
        item.className = 'track-item' + (idx === currentIndex ? ' playing' : '');
        item.onclick = () => playTrack(track);
        item.innerHTML = `
          <span class="track-idx">${{idx === currentIndex ? '🔊' : (idx + 1)}}</span>
          <img src="${{track.cover}}" class="track-cover" alt="" />
          <div class="track-info">
            <div class="track-title">${{track.title}}</div>
            <div class="track-artist">${{track.artist}}</div>
          </div>
        `;
        qCont.appendChild(item);
      }});
    }}

    // Audio Quick Actions
    function cyclePlaybackRate() {{
      rateIdx = (rateIdx + 1) % playbackRates.length;
      const rate = playbackRates[rateIdx];
      audio.playbackRate = rate;
      document.getElementById('btn-speed-quick').textContent = rate + 'x';
    }}

    function toggleVideoMode() {{
      const overlay = document.getElementById('video-overlay');
      if (overlay.style.display === 'none') {{
        if (currentIndex >= 0 && currentList[currentIndex] && currentList[currentIndex].ytId) {{
          const ytId = currentList[currentIndex].ytId;
          document.getElementById('yt-player-slot').innerHTML = `
            <iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/${{ytId}}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          `;
          overlay.style.display = 'block';
          audio.pause();
          isPlaying = false;
          updateUI();
        }} else {{
          alert('שיר זה לא כולל קליפ וידאו');
        }}
      }} else {{
        overlay.style.display = 'none';
        document.getElementById('yt-player-slot').innerHTML = '';
      }}
    }}

    // Equalizer Controls
    function openEqModal() {{
      document.getElementById('eq-modal').classList.add('open');
    }}
    function openSleepModal() {{
      document.getElementById('sleep-modal').classList.add('open');
    }}
    function openServerModal() {{
      document.getElementById('server-modal').classList.add('open');
    }}
    function closeModal(id) {{
      document.getElementById(id).classList.remove('open');
    }}

    function updateEq() {{
      initWebAudio();
      if (!bassNode || eqNodes.length === 0) return;

      const bassVal = parseFloat(document.getElementById('eq-bass').value);
      bassNode.gain.value = bassVal;
      document.getElementById('val-bass').textContent = bassVal + ' dB';

      const bandIds = ['eq-60', 'eq-230', 'eq-910', 'eq-3600', 'eq-14000'];
      bandIds.forEach((id, idx) => {{
        const val = parseFloat(document.getElementById(id).value);
        eqNodes[idx].gain.value = val;
        document.getElementById('val-' + id.replace('eq-', '')).textContent = val + ' dB';
      }});
    }}

    function applyPreset(preset, btn) {{
      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');

      const presets = {{
        flat: [0, 0, 0, 0, 0, 0],
        bass: [9, 8, 4, 0, 1, 2],
        vocal: [0, -2, 2, 5, 4, 1],
        rock: [4, 5, 2, -1, 3, 5],
        electronic: [7, 6, 2, 0, 3, 6]
      }};

      const vals = presets[preset] || presets.flat;
      document.getElementById('eq-bass').value = vals[0];
      document.getElementById('eq-60').value = vals[1];
      document.getElementById('eq-230').value = vals[2];
      document.getElementById('eq-910').value = vals[3];
      document.getElementById('eq-3600').value = vals[4];
      document.getElementById('eq-14000').value = vals[5];
      updateEq();
    }}

    // Sleep Timer
    function setSleep(minutes) {{
      cancelSleep();
      if (minutes === 'end') {{
        sleepEndTime = Date.now() + ((audio.duration - audio.currentTime) * 1000);
        document.getElementById('btn-sleep-header').innerHTML = '<span>⏱️ סיום שיר</span>';
        document.getElementById('btn-sleep-quick').textContent = '⏱️ סיום שיר';
      }} else {{
        sleepEndTime = Date.now() + (minutes * 60 * 1000);
        document.getElementById('btn-sleep-header').innerHTML = '<span>⏱️ ' + minutes + ' דק</span>';
        document.getElementById('btn-sleep-quick').textContent = '⏱️ ' + minutes + ' דק';
      }}

      sleepTimerId = setInterval(() => {{
        if (Date.now() >= sleepEndTime) {{
          audio.pause();
          isPlaying = false;
          updateUI();
          cancelSleep();
        }}
      }}, 1000);

      closeModal('sleep-modal');
    }}

    function cancelSleep() {{
      if (sleepTimerId) clearInterval(sleepTimerId);
      sleepTimerId = null;
      sleepEndTime = null;
      document.getElementById('btn-sleep-header').innerHTML = '<span>⏱️ טיימר</span>';
      document.getElementById('btn-sleep-quick').textContent = '⏱️ טיימר';
      closeModal('sleep-modal');
    }}

    // Server & Cloud Sync
    async function testServerConnection() {{
      const input = document.getElementById('custom-server-url').value.trim();
      const resEl = document.getElementById('server-ping-result');
      resEl.textContent = 'בודק קישוריות לרשת...';
      resEl.style.color = '#38bdf8';

      const target = input || window.location.origin;
      try {{
        const r = await fetch(target + '/api/music/stats', {{ cache: 'no-cache' }});
        if (r.ok) {{
          resEl.textContent = '✅ שרת ענן פעיל ומחובר בהצלחה!';
          resEl.style.color = '#4ade80';
        }} else {{
          resEl.textContent = '⚠️ שרת השיב בקוד ' + r.status;
          resEl.style.color = '#fbbf24';
        }}
      }} catch(err) {{
        resEl.textContent = '❌ לא ניתן להתחבר לשרת ענן. הנגן ממשיך לפעול רגיל במצב עצמאי.';
        resEl.style.color = '#f87171';
      }}
    }}

    function connectToCustomServer() {{
      const input = document.getElementById('custom-server-url').value.trim();
      if (input) {{
        localStorage.setItem('simply_music_server_url', input);
        window.location.href = input;
      }}
    }}

    // Init
    renderTracks(currentList);
  </script>
</body>
</html>'''
    return html

if __name__ == '__main__':
    html = build_standalone_html()
    print("Generated HTML length:", len(html))
    
    # Save to public test locations
    with open('public/mobile-player.html', 'w', encoding='utf-8') as f:
        f.write(html)
    with open('public/player.html', 'w', encoding='utf-8') as f:
        f.write(html)
    with open('public/simply-music.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print("Wrote to public/mobile-player.html, public/player.html, public/simply-music.html")
