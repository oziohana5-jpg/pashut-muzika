#!/usr/bin/env python3
import os
import sys
import struct
import zlib
import base64
import hashlib
import zipfile
import tempfile
import subprocess
import shutil

# Import full standalone player engine
try:
    from build_standalone_engine import build_standalone_html
except ImportError:
    # If run from root directory
    from scripts.build_standalone_engine import build_standalone_html

def patch_arsc_app_name(data, old_name="My Application", new_name="פשוט מוזיקה"):
    """
    Safely patches the global string pool in resources.arsc to rename the app,
    updating offset tables, chunk size, and ResTable size with strict 4-byte alignment.
    """
    arsc = bytearray(data)
    sp_count, sp_style_count, sp_flags, sp_strings_start, sp_styles_start = struct.unpack('<IIIII', arsc[20:40])
    is_utf8 = (sp_flags & (1 << 8)) != 0
    sp_offsets = [struct.unpack('<I', arsc[40+i*4:44+i*4])[0] for i in range(sp_count)]

    target_idx = None
    for i, off in enumerate(sp_offsets):
        abs_off = 12 + sp_strings_start + off
        u8len = arsc[abs_off+1] if is_utf8 else (arsc[abs_off] * 2)
        s = arsc[abs_off+2:abs_off+2+u8len].decode('utf-8' if is_utf8 else 'utf-16le', errors='ignore')
        if s == old_name:
            target_idx = i
            break

    if target_idx is None:
        print(f"Warning: '{old_name}' not found in resources.arsc string pool; keeping original.")
        return bytes(arsc)

    new_bytes = new_name.encode('utf-8')
    u16len = len(new_name)
    u8len = len(new_bytes)
    new_entry = bytes([u16len, u8len]) + new_bytes + b'\x00'

    old_off = sp_offsets[target_idx]
    old_abs_off = 12 + sp_strings_start + old_off
    old_u8len = arsc[old_abs_off+1]
    old_len = 2 + old_u8len + 1

    diff = len(new_entry) - old_len
    pad = (4 - (diff % 4)) % 4
    new_entry += b'\x00' * pad
    diff += pad

    prefix = arsc[:old_abs_off]
    suffix = arsc[old_abs_off + old_len:]
    new_arsc = bytearray(prefix + new_entry + suffix)

    for i in range(target_idx + 1, sp_count):
        new_off = sp_offsets[i] + diff
        new_arsc[40+i*4:44+i*4] = struct.pack('<I', new_off)

    if sp_styles_start != 0:
        new_arsc[36:40] = struct.pack('<I', sp_styles_start + diff)

    sp_size = struct.unpack('<I', new_arsc[16:20])[0]
    new_arsc[16:20] = struct.pack('<I', sp_size + diff)

    total_size = struct.unpack('<I', new_arsc[4:8])[0]
    new_arsc[4:8] = struct.pack('<I', total_size + diff)

    print(f"Successfully patched app name in resources.arsc to '{new_name}' (idx {target_idx})")
    return bytes(new_arsc)

def generate_png_icon(src_img, size, bg_color="#0e1118"):
    """
    Generates a high-quality square PNG icon of given size using ImageMagick convert.
    """
    tmp_out = f"/tmp/icon_{size}.png"
    # Create dark metallic/radial background with logo centered
    subprocess.run([
        'convert', '-size', f'{size}x{size}', f'radial-gradient:#1c2333-{bg_color}',
        '(', src_img, '-resize', f'{int(size*0.72)}x{int(size*0.72)}', ')',
        '-gravity', 'center', '-composite', tmp_out
    ], check=True)
    with open(tmp_out, 'rb') as f:
        return f.read()

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(base_dir, 'public')
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)

    logo_src = '/tmp/logo_input.jpg'
    if not os.path.exists(logo_src):
        # Check in public if already saved
        if os.path.exists(os.path.join(public_dir, 'icon-512.png')):
            logo_src = os.path.join(public_dir, 'icon-512.png')

    print("Generating app icons and branding from user logo...")
    # Trim and extract transparent logo
    trimmed_logo = '/tmp/logo_trimmed.png'
    transparent_logo = '/tmp/logo_transparent.png'

    if os.path.exists('/tmp/logo_input.jpg'):
        subprocess.run([
            'convert', '/tmp/logo_input.jpg', '-fuzz', '15%', '-trim', '+repage', trimmed_logo
        ], check=True)
        subprocess.run([
            'convert', trimmed_logo, '-fuzz', '12%', '-transparent', '#fefefe', transparent_logo
        ], check=True)
    else:
        transparent_logo = os.path.join(public_dir, 'icon-512.png')
        trimmed_logo = transparent_logo

    # Generate PWA & Web assets
    subprocess.run([
        'convert', '-size', '512x512', 'radial-gradient:#1c2333-#0b0e14',
        '(', transparent_logo, '-resize', '350x350', ')',
        '-gravity', 'center', '-composite', os.path.join(public_dir, 'icon-512.png')
    ], check=True)

    subprocess.run([
        'convert', os.path.join(public_dir, 'icon-512.png'), '-resize', '192x192',
        os.path.join(public_dir, 'icon-192.png')
    ], check=True)

    subprocess.run([
        'convert', os.path.join(public_dir, 'icon-512.png'), '-resize', '180x180',
        os.path.join(public_dir, 'apple-touch-icon.png')
    ], check=True)

    subprocess.run([
        'convert', '-size', '512x512', 'radial-gradient:#1c2333-#0b0e14',
        '(', transparent_logo, '-resize', '300x300', ')',
        '-gravity', 'center', '-composite', os.path.join(public_dir, 'icon-maskable-512.png')
    ], check=True)

    subprocess.run([
        'convert', os.path.join(public_dir, 'icon-512.png'), '-resize', '64x64',
        os.path.join(public_dir, 'favicon.ico')
    ], check=True)

    subprocess.run([
        'convert', transparent_logo, '-resize', '256x256',
        os.path.join(public_dir, 'logo.png')
    ], check=True)

    print("Icons generated successfully in public/!")

    # APK Generation
    template_apk = os.path.join(base_dir, 'app-template.apk')
    if not os.path.exists(template_apk):
        print("Template APK not found, downloading...")
        import urllib.request
        url = 'https://raw.githubusercontent.com/bishwassagar/Android-Webview-App/master/app/release/app-release.apk'
        urllib.request.urlretrieve(url, template_apk)

    print("Unpacking template APK...")
    with open(template_apk, 'rb') as f:
        z_in = zipfile.ZipFile(f)
        files = {}
        for item in z_in.infolist():
            # Strip old META-INF signatures
            if item.filename.startswith('META-INF/'):
                if item.filename.endswith('.SF') or item.filename.endswith('.RSA') or \
                   item.filename.endswith('.DSA') or item.filename == 'META-INF/MANIFEST.MF':
                    continue
            files[item.filename] = z_in.read(item.filename)

    # 1. Patch app name in resources.arsc
    if 'resources.arsc' in files:
        files['resources.arsc'] = patch_arsc_app_name(files['resources.arsc'], "My Application", "פשוט מוזיקה")

    # 1b. Patch package name in AndroidManifest.xml
    if 'AndroidManifest.xml' in files:
        old_pkg = 'com.webview.myapplication'.encode('utf-16le')
        new_pkg = 'com.simplymusic.playerapp'.encode('utf-16le')
        files['AndroidManifest.xml'] = files['AndroidManifest.xml'].replace(old_pkg, new_pkg)

    # 2. Patch launcher icons with the new logo
    icon_map = {
        48: ['res/9w.png', 'res/zR.png'],
        72: ['res/8c.png', 'res/yn.png'],
        96: ['res/FS.png', 'res/wb.png'],
        144: ['res/fO.png', 'res/RJ.png'],
        192: ['res/Gc.png', 'res/o-.png']
    }
    for size, icon_paths in icon_map.items():
        icon_bytes = generate_png_icon(transparent_logo, size)
        for p in icon_paths:
            if p in files:
                files[p] = icon_bytes

    # 3. Patch DEX to open offline.html fallback and use new package name
    dex = bytearray(files['classes.dex'])
    dex = dex.replace(b'\x1a\x01\xdd\x0e', b'\x1a\x01\xc7\x0b')
    dex = dex.replace(b'\x1a\x00\xdd\x0e', b'\x1a\x00\xc7\x0b')
    dex = dex.replace(b'Lcom/webview/myapplication/MainActivity;', b'Lcom/simplymusic/playerapp/MainActivity;')
    dex_sha = hashlib.sha1(dex[32:]).digest()
    dex[12:32] = dex_sha
    dex_adler = zlib.adler32(dex[12:]) & 0xffffffff
    dex[8:12] = struct.pack('<I', dex_adler)
    files['classes.dex'] = bytes(dex)

    # Target URL for standalone music player
    target_url = 'https://ais-pre-ods6gzzj3hco5edhtdf4ov-247330922451.europe-west2.run.app'
    if len(sys.argv) > 1 and sys.argv[1].startswith('http'):
        target_url = sys.argv[1]
    elif os.environ.get('APP_URL') and os.environ.get('APP_URL').startswith('http'):
        target_url = os.environ.get('APP_URL')

    with open(os.path.join(public_dir, 'logo.png'), 'rb') as lf:
        logo_b64 = base64.b64encode(lf.read()).decode('ascii')

    launcher_html = f'''<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>פשוט מוזיקה</title>
<style>
  * {{ box-sizing: border-box; }}
  body {{
    background: #0a0b0e;
    color: #f1f3f7;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
    text-align: center;
    padding: 24px;
  }}
  .logo-img {{
    width: 90px;
    height: 90px;
    border-radius: 22px;
    object-fit: contain;
    margin-bottom: 20px;
    box-shadow: 0 12px 30px rgba(59, 130, 246, 0.35);
  }}
  .title {{
    font-size: 26px;
    font-weight: 800;
    margin: 0 0 6px;
    letter-spacing: -0.5px;
    color: #ffffff;
  }}
  .badge {{
    display: inline-block;
    padding: 3px 12px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 14px;
  }}
  .subtitle {{
    font-size: 14px;
    color: #94a3b8;
    margin: 0 0 20px;
    line-height: 1.5;
  }}
  .spinner {{
    width: 36px;
    height: 36px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }}
  @keyframes spin {{
    to {{ transform: rotate(360deg); }}
  }}
  .btn-retry {{
    display: none;
    margin-top: 16px;
    padding: 12px 24px;
    border-radius: 14px;
    background: #2563eb;
    color: #ffffff;
    font-weight: bold;
    font-size: 14px;
    border: none;
    cursor: pointer;
  }}
</style>
</head>
<body>
<img class="logo-img" src="data:image/png;base64,{logo_b64}" alt="פשוט מוזיקה">
<div class="title">פשוט מוזיקה</div>
<div class="badge">התוכנה הרשמית לאנדרואיד</div>
<div class="subtitle" id="status-text">מתחבר לנגן המוזיקה...</div>
<div class="spinner" id="spinner"></div>
<button class="btn-retry" id="retry-btn" onclick="connect()">נסה שוב</button>
<script>
  const targetUrl = '{target_url}';
  let connected = false;

  async function connect() {{
    if (connected) return;
    document.getElementById('status-text').innerText = 'מתחבר לנגן המוזיקה...';
    document.getElementById('spinner').style.display = 'block';
    document.getElementById('retry-btn').style.display = 'none';

    try {{
      const res = await fetch(targetUrl + '/api/health', {{ method: 'GET', cache: 'no-cache' }}).catch(() => null);
      if (res && res.status === 200) {{
        connected = true;
        window.location.replace(targetUrl);
        return;
      }}
    }} catch (e) {{}}

    // Direct redirection
    connected = true;
    window.location.replace(targetUrl);
  }}

  setTimeout(connect, 100);

  setTimeout(() => {{
    if (!connected) {{
      document.getElementById('status-text').innerText = 'נדרש חיבור אינטרנט להזרמת השירים';
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('retry-btn').style.display = 'inline-block';
    }}
  }}, 8000);
</script>
</body>
</html>'''
    # Generate complete, modern standalone player application for Android offline.html
    full_player_html = build_standalone_html()
    files['assets/offline.html'] = full_player_html.encode('utf-8')
    print(f"Generated standalone offline.html for APK: {len(full_player_html)} bytes with 28 songs and real lyrics!")

    with tempfile.TemporaryDirectory() as td:
        unaligned_apk = os.path.join(td, 'unaligned.apk')
        aligned_apk = os.path.join(td, 'aligned.apk')
        keystore_path = os.path.join(base_dir, 'simply-music.jks')

        # 1. Create permanent keystore if not exists
        if not os.path.exists(keystore_path):
            print("Creating permanent Simply Music signing keystore...")
            subprocess.run([
                'keytool', '-genkeypair', '-v',
                '-keystore', keystore_path,
                '-storepass', 'simplymusic123',
                '-alias', 'simplymusic',
                '-keypass', 'simplymusic123',
                '-keyalg', 'RSA',
                '-keysize', '2048',
                '-validity', '10000',
                '-dname', 'CN=SimplyMusic, OU=SimplyMusic, O=SimplyMusic, C=IL'
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 2. Write unaligned APK (no compression on resources.arsc or uncompressed assets)
        print("Writing unaligned APK...")
        uncompressed_files = {
            'resources.arsc',
            'classes.dex',
            'assets/dexopt/baseline.prof',
            'assets/dexopt/baseline.profm'
        }
        with zipfile.ZipFile(unaligned_apk, 'w') as z_out:
            for name, data in files.items():
                if name.startswith('META-INF/'):
                    continue
                if name in uncompressed_files or name.endswith('.png'):
                    z_out.writestr(name, data, compress_type=zipfile.ZIP_STORED)
                else:
                    z_out.writestr(name, data, compress_type=zipfile.ZIP_DEFLATED)

        # 3. Zipalign 4 bytes
        print("Zipaligning APK to 4-byte boundaries...")
        subprocess.run([
            'zipalign', '-p', '-f', '4', unaligned_apk, aligned_apk
        ], check=True)

        # 4. Sign using official apksigner (v1, v2, v3 schemes enabled)
        print("Signing APK with official apksigner (Scheme v1, v2, v3)...")
        subprocess.run([
            'apksigner', 'sign',
            '--ks', keystore_path,
            '--ks-pass', 'pass:simplymusic123',
            '--key-pass', 'pass:simplymusic123',
            '--ks-key-alias', 'simplymusic',
            '--min-sdk-version', '21',
            '--v1-signing-enabled', 'true',
            '--v2-signing-enabled', 'true',
            '--v3-signing-enabled', 'true',
            '--v4-signing-enabled', 'false',
            aligned_apk
        ], check=True)

        # 5. Verify signature
        print("Verifying APK signatures...")
        res = subprocess.run([
            'apksigner', 'verify', '--verbose', '--min-sdk-version', '21', aligned_apk
        ], capture_output=True, text=True)
        print("apksigner verification output:\n", res.stdout)
        if res.returncode != 0:
            print("Verification error:", res.stderr)
            raise RuntimeError("APK verification failed")

        # Copy to destination files
        out_public = os.path.join(public_dir, 'simply-music.apk')
        out_data = os.path.join(data_dir, 'simply-music.apk')
        out_root = os.path.join(base_dir, 'simply-music.apk')

        shutil.copyfile(aligned_apk, out_public)
        shutil.copyfile(aligned_apk, out_data)
        shutil.copyfile(aligned_apk, out_root)
        print(f"✅ Signed APK successfully created! File size: {os.path.getsize(out_public)} bytes")

        # Also pack into simply-music-apk.zip
        zip_path = os.path.join(public_dir, 'simply-music-apk.zip')
        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_STORED) as z_zip:
            z_zip.write(out_public, 'simply-music.apk')
        print(f"✅ Updated simply-music-apk.zip")

if __name__ == '__main__':
    main()
