#!/usr/bin/env python3
import os
import subprocess
import struct
import shutil

def build_windows_artifacts():
    print("Building Windows MSI and standalone executable...")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    build_dir = os.path.join(base_dir, 'build_win')
    public_dir = os.path.join(base_dir, 'public')
    os.makedirs(build_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    # 1. Create logo.ico from icon-192.png
    png_path = os.path.join(public_dir, 'icon-192.png')
    ico_path = os.path.join(public_dir, 'logo.ico')
    if os.path.exists(png_path):
        with open(png_path, 'rb') as f:
            png_data = f.read()
        header = struct.pack('<HHH', 0, 1, 1)
        entry = struct.pack('<BBBBHHII', 0, 0, 0, 0, 1, 32, len(png_data), 22)
        with open(ico_path, 'wb') as f:
            f.write(header + entry + png_data)
        print("Generated logo.ico")

    # 2. Write C launcher
    launcher_c_path = os.path.join(build_dir, 'launcher.c')
    with open(launcher_c_path, 'w', encoding='utf-8') as f:
        f.write(r'''#include <windows.h>
#include <shellapi.h>
#include <stdio.h>
#include <string.h>

#define IDI_APPICON 101

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    char* lastSlash = strrchr(exePath, '\\');
    
    char localDir[MAX_PATH];
    char localHtml[MAX_PATH];
    char iniPath[MAX_PATH];
    
    if (lastSlash) {
        *lastSlash = '\0';
        strncpy(localDir, exePath, MAX_PATH);
        snprintf(localHtml, MAX_PATH, "%s\\simply-music.html", localDir);
        snprintf(iniPath, MAX_PATH, "%s\\SimplyMusic.ini", localDir);
    } else {
        strncpy(localDir, ".", MAX_PATH);
        snprintf(localHtml, MAX_PATH, "simply-music.html");
        snprintf(iniPath, MAX_PATH, "SimplyMusic.ini");
    }

    char targetUrl[1024];
    // Read from INI if configured, else default to production public URL
    GetPrivateProfileStringA("Config", "AppUrl", "https://ais-pre-shsgevr4tcebdfbgelks6p-656763784562.europe-west1.run.app/", targetUrl, sizeof(targetUrl), iniPath);

    // If command line arguments passed (e.g. specific song or url), use them
    if (lpCmdLine && strlen(lpCmdLine) > 0 && strstr(lpCmdLine, "http")) {
        strncpy(targetUrl, lpCmdLine, sizeof(targetUrl));
    }

    char args[2048];
    snprintf(args, sizeof(args), "--app=\"%s\" --window-size=1300,850", targetUrl);

    // 1. Try launching in Google Chrome first (where user's Google session is active)
    char chromePath[MAX_PATH];
    ExpandEnvironmentStringsA("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe", chromePath, MAX_PATH);
    if (GetFileAttributesA(chromePath) == INVALID_FILE_ATTRIBUTES) {
        ExpandEnvironmentStringsA("%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe", chromePath, MAX_PATH);
    }
    if (GetFileAttributesA(chromePath) == INVALID_FILE_ATTRIBUTES) {
        ExpandEnvironmentStringsA("%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe", chromePath, MAX_PATH);
    }
    if (GetFileAttributesA(chromePath) != INVALID_FILE_ATTRIBUTES) {
        HINSTANCE res = ShellExecuteA(NULL, "open", chromePath, args, NULL, SW_SHOWNORMAL);
        if ((INT_PTR)res > 32) return 0;
    }

    // 2. Try launching in Microsoft Edge app mode
    char edgePath[MAX_PATH];
    ExpandEnvironmentStringsA("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe", edgePath, MAX_PATH);
    if (GetFileAttributesA(edgePath) == INVALID_FILE_ATTRIBUTES) {
        ExpandEnvironmentStringsA("%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe", edgePath, MAX_PATH);
    }
    if (GetFileAttributesA(edgePath) != INVALID_FILE_ATTRIBUTES) {
        HINSTANCE res = ShellExecuteA(NULL, "open", edgePath, args, NULL, SW_SHOWNORMAL);
        if ((INT_PTR)res > 32) return 0;
    }

    // 3. Fallback to default browser
    HINSTANCE res = ShellExecuteA(NULL, "open", targetUrl, NULL, NULL, SW_SHOWNORMAL);
    if ((INT_PTR)res <= 32 && GetFileAttributesA(localHtml) != INVALID_FILE_ATTRIBUTES) {
        // 4. Offline fallback: local html player
        ShellExecuteA(NULL, "open", localHtml, NULL, NULL, SW_SHOWNORMAL);
    }
    return 0;
}
''')

    # 3. Create Windows Resource file with Icon
    rc_path = os.path.join(build_dir, 'resource.rc')
    res_path = os.path.join(build_dir, 'resource.res')
    with open(rc_path, 'w', encoding='utf-8') as f:
        f.write(f'101 ICON "{ico_path}"\n')

    # 4. Compile resource and executable
    subprocess.run(['x86_64-w64-mingw32-windres', rc_path, '-O', 'coff', '-o', res_path], check=True)
    
    exe_output = os.path.join(build_dir, 'SimplyMusic.exe')
    subprocess.run([
        'x86_64-w64-mingw32-gcc',
        '-mwindows',
        '-O2',
        launcher_c_path,
        res_path,
        '-o', exe_output
    ], check=True)
    print("Compiled SimplyMusic.exe successfully")

    # 5. Write default INI file
    ini_path = os.path.join(build_dir, 'SimplyMusic.ini')
    with open(ini_path, 'w', encoding='utf-8') as f:
        f.write("[Config]\nAppUrl=https://ais-pre-shsgevr4tcebdfbgelks6p-656763784562.europe-west1.run.app/\nName=Simply Music\n")

    # 6. Generate WiX Source XML for MSI
    wxs_path = os.path.join(build_dir, 'simply-music.wxs')
    with open(wxs_path, 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*"
           Name="פשוט מוזיקה"
           Language="1033"
           Version="2.0.0"
           Manufacturer="Simply Music"
           UpgradeCode="6f3b879c-930a-4fa8-b21a-55447192bc51">
    <Package Description="Simply Music Windows Installer"
             Comments="פשוט מוזיקה - נגן המוזיקה המקצועי למחשב"
             Manufacturer="Simply Music"
             InstallerVersion="200"
             Compressed="yes" />

    <Media Id="1" Cabinet="simplymusic.cab" EmbedCab="yes" />

    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLDIR" Name="SimplyMusic">
          <Component Id="MainExecutable" Guid="a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d">
            <File Id="SimplyMusicEXE" Name="SimplyMusic.exe" Source="build_win/SimplyMusic.exe" KeyPath="yes">
              <Shortcut Id="DesktopShortcut"
                        Directory="DesktopFolder"
                        Name="פשוט מוזיקה"
                        WorkingDirectory="INSTALLDIR"
                        Icon="AppIcon.ico"
                        IconIndex="0"
                        Advertise="yes" />
              <Shortcut Id="StartMenuShortcut"
                        Directory="ProgramMenuDir"
                        Name="פשוט מוזיקה"
                        WorkingDirectory="INSTALLDIR"
                        Icon="AppIcon.ico"
                        IconIndex="0"
                        Advertise="yes" />
            </File>
            <File Id="SimplyMusicHTML" Name="simply-music.html" Source="public/simply-music.html" />
            <File Id="SimplyMusicINI" Name="SimplyMusic.ini" Source="build_win/SimplyMusic.ini" />
            <File Id="AppIconFile" Name="logo.ico" Source="public/logo.ico" />
          </Component>
        </Directory>
      </Directory>

      <Directory Id="ProgramMenuFolder">
        <Directory Id="ProgramMenuDir" Name="פשוט מוזיקה">
          <Component Id="ProgramMenuDirComponent" Guid="f2e3d4c5-b6a7-8901-2345-6789abcdef01">
            <RemoveFolder Id="ProgramMenuDir" On="uninstall" />
            <RegistryValue Root="HKCU" Key="Software\\SimplyMusic" Type="string" Value="" KeyPath="yes" />
          </Component>
        </Directory>
      </Directory>

      <Directory Id="DesktopFolder" Name="Desktop" />
    </Directory>

    <Icon Id="AppIcon.ico" SourceFile="public/logo.ico" />

    <Feature Id="Complete" Level="1">
      <ComponentRef Id="MainExecutable" />
      <ComponentRef Id="ProgramMenuDirComponent" />
    </Feature>
  </Product>
</Wix>
''')

    # 7. Compile MSI with wixl
    msi_output = os.path.join(public_dir, 'simply-music.msi')
    subprocess.run(['wixl', '-o', msi_output, wxs_path], cwd=base_dir, check=True)
    
    # Copy alias simply-music-installer.msi
    installer_msi = os.path.join(public_dir, 'simply-music-installer.msi')
    shutil.copyfile(msi_output, installer_msi)

    # Copy portable exe
    portable_exe = os.path.join(public_dir, 'SimplyMusic.exe')
    shutil.copyfile(exe_output, portable_exe)

    # 8. Create a portable zip with MSI + standalone EXE + Readme
    portable_zip = os.path.join(public_dir, 'simply-music-windows.zip')
    html_source = os.path.join(public_dir, 'simply-music.html')
    import zipfile
    with zipfile.ZipFile(portable_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.write(msi_output, 'simply-music-installer.msi')
        zf.write(portable_exe, 'SimplyMusic.exe')
        zf.write(html_source, 'simply-music.html')
        zf.write(ico_path, 'logo.ico')
        zf.writestr('הוראות_התקנה_Windows.txt', 
                    "התקנת פשוט מוזיקה למחשב (Windows)\n"
                    "===================================\n\n"
                    "1. התקנה מומלצת: לחץ פעמיים על simply-music-installer.msi\n"
                    "   התוכנה תותקן במחשב וייווצר קיצור דרך בשולחן העבודה ובתפריט התחלה.\n\n"
                    "2. גרסה ניידת (ללא התקנה): לחץ על SimplyMusic.exe להפעלה מיידית!\n\n"
                    "יוצר: עוז אוחנה\n"
                    "תהנה מהמוזיקה!\n")

    print(f"MSI generated successfully: {msi_output} ({os.path.getsize(msi_output)} bytes)")
    print(f"Windows ZIP package generated: {portable_zip} ({os.path.getsize(portable_zip)} bytes)")

if __name__ == '__main__':
    build_windows_artifacts()
