import express from 'express';
import archiver from 'archiver';
import multer from 'multer';
import {main} from "./index.js";
const app = express()
const port = 3000

const upload = multer({ dest: "uploads/" });


app.post('/api/transcribe',upload.single("audio"), async (req, res) => {
    // console.log(req.file.path);
    await main(req.file.path);
    res.json({ message: "Audio received", file: req.file });
})
app.get('/api/test',(req,res)=> {
    res.json({message:"This is a test"})
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})