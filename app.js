import express from 'express';
import archiver from 'archiver';
import multer from 'multer';
import {main} from "./index.js";
import path from "path";
import {fileURLToPath} from "url"
import {dirname} from "path";
import fs from "fs";
const app = express()
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

app.post('/api/transcribe',upload.single("audio"), async (req, res) => {
    let audioSegments = []
    if (req.body.segments !== undefined) {
        audioSegments = req.body.segments
    }
    const requestDir = await main(req.file.path,audioSegments);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="output.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => res.status(500).send(err.message));

    archive.pipe(res);
    archive.directory(requestDir, false);
    await archive.finalize();
    fs.rmSync(requestDir, { recursive: true, force: true });
})

app.get('/api/upload/get/:filename', (req,res,next) => {

    const filename = req.params.filename;
    console.log("file name",filename);
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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})