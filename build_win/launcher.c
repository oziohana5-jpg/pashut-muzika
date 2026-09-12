#include <windows.h>
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
