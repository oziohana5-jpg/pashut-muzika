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

## Background audio

YouTube iframes stop when a phone fully closes the app. For full-length background audio, create a Jamendo developer client ID and set these server environment variables:

```text
MUSIC_PROVIDER=jamendo
JAMENDO_CLIENT_ID=your_client_id
```

On Render, add `JAMENDO_CLIENT_ID` as a secret environment variable. The application never stores this value in the repository. Without it, the existing catalog remains available as a fallback.
