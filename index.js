import 'dotenv/config';
import ffmpeg from "fluent-ffmpeg";
import { argv } from 'node:process';
import path from "path";
import fs from "fs";
import  { convertArrayToCSV } from 'convert-array-to-csv';
import { randomUUID } from "node:crypto";
import {createClient} from "@deepgram/sdk";

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
const outputDir = './output';

const transcribe = async filePath => {

    const {result, error} = await deepgramClient.listen.prerecorded.transcribeFile(
        fs.readFileSync(filePath),
        {
            model: "nova-2",
            smart_format: true,
            language: "es",
        }
    );

    if (error) throw error;
    // if (!error) console.dir(result, { depth: null });
    if (!error) {
        const {results} = result;
        const transcriptionObj = results.channels[0]['alternatives'][0]

        // export transcribe data
        fs.writeFile(outputDir+'/transcribe_data.json',JSON.stringify(results),'',(err)=> {
            if (err) {
                console.error('Error writing file:', err);
                return;
            }
            console.log('Transcript data saved!');
        });
        // console.dir(transcriptionObj.transcript,{depth:null});
        const paragraphs = transcriptionObj.paragraphs.paragraphs;
        console.dir(paragraphs,{depth:null});
        return paragraphs
    }
}
export const main = async (filePath) => {
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
    fs.mkdirSync(outputDir+'/audioClips');
}

  const transcribeData = await transcribe(filePath);



ffmpeg.ffprobe(filePath, (err, metadata) => {
  if (err) return console.error(err);
  const duration = metadata.format.duration;
  console.log(`Audio duration: ${duration}s`);

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
    fs.mkdirSync(outputDir+'/audioClips');
}
const segmentGuid = randomUUID();

let i = 0;
transcribeData.forEach((paragraph) => {
    const sentences = paragraph.sentences;

    sentences.forEach(sentence => {
        const startTime = sentence.start;
        const endTime = sentence.end;
        const sentenceId = i;
        ++i;
        const segmentName = `${segmentGuid}_${sentenceId}.mp3`;
        sentence['sentenceAudioName'] = segmentName;
        const outputPath = path.join(outputDir+'/audioClips', segmentName);

        ffmpeg(filePath)
            .setStartTime(startTime)
            .setDuration(endTime-startTime)
            .output(outputPath)
            .on('end', () => {
                console.log(`sentence ${sentenceId} saved.`);
            })
            .on('error', (err) => {
                console.error(`Error processing sentence ${sentenceId}:`, err.message);
            })
            .run();
    })
})


    let allSentences = [];
    transcribeData.map(paragraph => {
        paragraph.sentences.map(sentence => {
            allSentences.push(sentence);
        })
    })
    
    // console.log(allSentences);
    //header for csv
      fs.writeFile(outputDir+`/sentences.csv`,convertArrayToCSV(allSentences.map(sentence => [sentence.text," ",`[sound:${sentence.sentenceAudioName}]`]),{
        separator: ','
    }),err => {
        console.error(err);
    });
    console.log('File saved!');

});
}