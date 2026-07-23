# Sentensify

Sentensify turns audio and video files — uploaded directly or pulled from a YouTube link — into Anki flashcard decks — one card per sentence. It transcribes speech using AI and slices the audio into individual sentence clips. If Anki is running locally with AnkiConnect, it adds the deck to your collection directly; otherwise it builds a self-contained `.apkg` file you can download and import by hand.

## How it works

1. **Load your audio** — upload an audio or video file via the browser UI, or paste a YouTube link and click **Convert to MP3** to have the server download and convert it for you.
2. **Select a language** from the searchable dropdown.
3. **Define segments** — drag a region on the waveform to mark a time range, then click **Add Audio Segment**. Repeat for each part of the audio you want to include.
4. **Name the deck and transcribe** — the server sends the audio to [Deepgram](https://deepgram.com/) (nova-3 model) and slices it into per-sentence MP3 clips with ffmpeg.
5. **Get your cards** — if Anki is open with [AnkiConnect](https://ankiweb.net/shared/info/2055492159), the deck is added straight to your collection. If not, an `.apkg` file downloads instead; double-click it to import into Anki.

The "Audio input" note type is created automatically on both paths, so you don't need to import a template first.

## Features

- Load audio from a local file or straight from a YouTube URL (converted to MP3 server-side via [yt-dlp](https://github.com/yt-dlp/yt-dlp))
- Waveform visualizer with drag-to-seek and scroll-to-zoom
- Draggable region selector to isolate specific parts of the audio
- Direct push into a running Anki via AnkiConnect, with automatic `.apkg` download as a fallback
- Anki card template with type-what-you-hear input and a word-level diff score on the back

## Anki card template

The app creates an "Audio input" note type for you (both when pushing via AnkiConnect and when building an `.apkg`). Its source lives in the `ankiCardTemplate/` directory:

- **Front** — plays the sentence audio and prompts you to type what you hear
- **Back** — shows the correct transcript, replays the audio, and displays a word-level diff (correct / missing / extra words) with a percentage score

See [`ankiCardTemplate/README.md`](ankiCardTemplate/README.md) if you want to set up or tweak the note type manually.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [ffmpeg](https://ffmpeg.org/) installed and on your `PATH`
- A [Deepgram](https://deepgram.com/) API key
- Optional: [Anki](https://apps.ankiweb.net/) with the [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on running, for direct deck push (without it, you'll get an `.apkg` download instead)

## Setup

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

Create a `.env` file in the project root:

```
DEEPGRAM_API_KEY=your_api_key_here
```

## Running

```bash
# Start both the Express server (port 3000) and the Vite dev server concurrently
cd client && npm run app
```

Or start them separately:

```bash
# Server
node app.js

# Client (in another terminal)
cd client && npm run dev
```
