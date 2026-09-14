import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { authMiddleware } from './server/auth';
import { apiRouter } from './server/routes';
import { db } from './server/db';

async function startServer() {
  await db.ready;
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Global Auth extraction middleware
  app.use(authMiddleware as express.RequestHandler);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'פשוט מוזיקה Audio Engine & Streaming Platform',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Short URL redirects
  app.get(['/pashut-muzika', '/pashut', '/muzika', '/pashutmusic', '/m'], (req, res) => {
    res.redirect('/');
  });

  // Mount API router
  app.use('/api', apiRouter);
  app.get('/download-zip', (req, res) => {
    res.redirect('/api/download-zip');
  });
  app.get(['/download-apk', '/download/apk', '/simply-music.apk', '/app.apk'], (req, res) => {
    const apkPath = path.join(process.cwd(), 'public', 'simply-music.apk');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="simply-music.apk"');
    res.sendFile(apkPath);
  });

  // Windows MSI Installer Direct Downloads
  app.get(['/download-msi', '/download/msi', '/simply-music.msi', '/simply-music-installer.msi', '/installer.msi'], (req, res) => {
    const msiPath = path.join(process.cwd(), 'public', 'simply-music-installer.msi');
    const fallbackMsi = path.join(process.cwd(), 'public', 'simply-music.msi');
    const targetMsi = fs.existsSync(msiPath) ? msiPath : fallbackMsi;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'application/x-msi');
    res.setHeader('Content-Disposition', 'attachment; filename="simply-music-installer.msi"');
    res.sendFile(targetMsi);
  });

  // Windows Standalone Executable & ZIP
  app.get(['/SimplyMusic.exe', '/download/exe', '/download-exe'], (req, res) => {
    const exePath = path.join(process.cwd(), 'public', 'SimplyMusic.exe');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
    res.setHeader('Content-Disposition', 'attachment; filename="SimplyMusic.exe"');
    res.sendFile(exePath);
  });

  app.get(['/download/windows-zip', '/simply-music-windows.zip'], (req, res) => {
    const zipPath = path.join(process.cwd(), 'public', 'simply-music-windows.zip');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="simply-music-windows.zip"');
    res.sendFile(zipPath);
  });

  // Redirect standalone shortcuts directly to the main full application
  app.get(['/site', '/website', '/player', '/simply-music.html'], (req, res) => {
    res.redirect('/');
  });

  app.get('/download-website', (req, res) => {
    const htmlPath = path.join(process.cwd(), 'public', 'simply-music.html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="simply-music.html"');
    res.sendFile(htmlPath);
  });


  // Vite middleware for development or static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Simply Music server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Simply Music server:', err);
  process.exit(1);
});
