import OpenAI from "openai";
import 'dotenv/config';
import axios from "axios";
import fs from "fs";

const client = new OpenAI({apiKey:process.env.API_KEY});


const transcribe = async () => {

    const res = await client.audio.transcriptions.create({
    file: fs.createReadStream("/root/audio.mp3"),
    model: "whisper-1",
    });

    console.log("Result ",res.text);
    
}

transcribe();