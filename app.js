import express from 'express';
import archiver from 'archiver';
import multer from 'multer';
import {main} from "./index.js";
const app = express()
const port = 3000

const upload = multer({ dest: "uploads/" });


app.post('/api/transcribe',upload.single("audio"), async (req, res) => {
    let audioSegments = []
    if (req.body.segments !== undefined) {
        audioSegments = req.body.segments
    }
    await main(req.file.path,audioSegments);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="output.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => res.status(500).send(err.message));

    archive.pipe(res);
    archive.directory('output', false);
    await archive.finalize();
    //todo remove files when done
})
app.get('/api/test',(req,res) => {
    res.json({message:"This is a test"})
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})