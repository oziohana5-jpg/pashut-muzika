#!/usr/bin/env python3
"""
Delegates to scripts/generate_apk_and_assets.py to ensure the APK is always
built with the full Simply Music player engine (28 tracks, authentic synchronized lyrics,
sleep timer, equalizer, and offline assets).
"""
import os
import sys

# Add scripts dir to path
scripts_dir = os.path.dirname(os.path.abspath(__file__))
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

from generate_apk_and_assets import main

if __name__ == '__main__':
    main()
