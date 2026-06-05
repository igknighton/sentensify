# Sentensify

Sentensify turns audio and video files into ready-to-import Anki flashcard decks. It transcribes speech using AI, slices the audio into individual sentence clips, and exports everything as a ZIP containing a CSV and the audio files — one card per sentence.

## How it works

1. **Upload** an audio or video file via the browser UI.
2. **Select a language** from the searchable dropdown.
3. **Define segments** — drag a region on the waveform to mark a time range, then click **Add Audio Segment**. Repeat for each part of the audio you want to include.
4. **Transcribe** — click **Transcribe Audio Segments**. The server sends the audio to [Deepgram](https://deepgram.com/) (nova-3 model), slices it into per-sentence MP3 clips with ffmpeg, and streams back a ZIP file.
5. **Import** the ZIP into Anki using the included card template.

## Features

- Waveform visualizer with drag-to-seek and scroll-to-zoom
- Draggable region selector to isolate specific parts of the audio
- Anki card template with type-what-you-hear input and a word-level diff score on the back

## Anki card template

The `ankiCardTemplate/` directory contains a custom note type with:

- **Front** — plays the sentence audio and prompts you to type what you hear
- **Back** — shows the correct transcript, replays the audio, and displays a word-level diff (correct / missing / extra words) with a percentage score

See [`ankiCardTemplate/README.md`](ankiCardTemplate/README.md) for setup instructions.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [ffmpeg](https://ffmpeg.org/) installed and on your `PATH`
- A [Deepgram](https://deepgram.com/) API key

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
