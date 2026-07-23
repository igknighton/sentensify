import express from 'express';
import multer from 'multer';
import youtubedl from 'youtube-dl-exec';
import {main} from "./index.js";
import path from "path";
import {fileURLToPath} from "url"
import {dirname} from "path";
import fs from "fs";
const app = express()
app.use(express.json())
const port = 3000
// This function converts the current module's file URL into a file path.
const __filename = fileURLToPath(import.meta.url);
// This function extracts the directory name from the file path.
const __dirname = dirname(__filename);
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, './uploads');
    },

    filename(req, file, cb) {
        // Preserve the original extension
        const ext = path.extname(file.originalname); // e.g. ".mp3"
        const base = path.basename(file.originalname, ext);

        // Add timestamp or unique value to avoid collisions
        cb(null, `${base}-${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

app.post('/api/transcribe', async (req, res) => {
    try {
        let audioSegments = []
        let filename = req.body.filename || '';
        let deckName = req.body.deckName || '';
        if (req.body.segments !== undefined) {
            audioSegments = req.body.segments
        }
        const language = req.body.language || "es";

        filename = path.basename(filename);
        const filePath = path.join(__dirname, 'uploads', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send("File not found");
        }
        const {addedToAnki, apkgBuffer} = await main(filePath, audioSegments, language, deckName);

        if (addedToAnki) {
            return res.json({addedToAnki: true, message: `Deck "${deckName}" added to Anki`});
        }

        const safeName = (deckName || 'deck').replace(/[^\w.-]+/g, '_');
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeName}.apkg"`
        );
        res.send(Buffer.from(apkgBuffer));
    } catch (e) {
        console.error("Error transcribing data",e)
        if (res.headersSent) return res.destroy();
        res.status(e.status ?? 500).json({ message: e.message ?? "Transcription failed" });
    }
})

app.get('/api/upload/get/:filename', (req,res,next) => {
    const filename = req.params.filename;
    const filePath= path.join(__dirname, 'uploads', filename);
    if(fs.existsSync(filePath)) {
        res.type('audio/mp3');
        res.sendFile(filePath, err => {
            if (err) console.error("Error sending file",err)
        })
    } else {
        console.error("file doesn't exist.")
        next();
    }
})

app.post('/api/upload',upload.single("audio"),(req,res) => {
    res.json({filename:req.file.filename})
})

const isYoutubeUrl = raw => {
    try {
        const {hostname, protocol} = new URL(raw);
        if (protocol !== 'http:' && protocol !== 'https:') return false;
        const host = hostname.replace(/^www\./, '');
        return host === 'youtube.com' || host === 'm.youtube.com'
            || host === 'music.youtube.com' || host === 'youtu.be';
    } catch {
        return false;
    }
}

app.post('/api/youtube', async (req, res) => {
    const url = req.body.url || '';
    if (!isYoutubeUrl(url)) {
        return res.status(400).json({message: 'Invalid YouTube URL'});
    }
    // Add timestamp to avoid collisions, matching the multer convention
    const filename = `youtube-audio-${Date.now()}.mp3`;
    const outputPath = path.join(__dirname, 'uploads', filename);
    try {
        await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputPath,
            noPlaylist: true
        });
        if (!fs.existsSync(outputPath)) {
            return res.status(500).json({message: 'Conversion failed'});
        }
        res.json({filename});
    } catch (e) {
        console.error("Error converting YouTube video", e);
        // yt-dlp reports failures (private/unavailable video, etc.) on stderr
        const detail = (e.stderr?.split('\n').find(l => l.startsWith('ERROR:')) ?? '')
            .replace(/^ERROR:\s*/, '');
        res.status(500).json({message: detail || 'Failed to convert YouTube video'});
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})