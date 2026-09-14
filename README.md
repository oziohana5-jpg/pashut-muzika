<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7c53d180-b6e3-45af-9810-e612ed44b1b1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Spotify Playlist Import

The Library view can import a public Spotify playlist by URL. Configure Spotify Web API credentials on the server before using it:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

Create the credentials in the Spotify Developer Dashboard. The importer copies playlist metadata and track metadata only; it does not download audio from Spotify.
