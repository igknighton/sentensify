import OpenAI from "openai";
import 'dotenv/config';
import ffmpeg from "fluent-ffmpeg";
import { argv } from 'node:process';
import path from "path";
import fs from "fs";
import  { convertArrayToCSV } from 'convert-array-to-csv';
import { randomUUID } from "node:crypto";

const client = new OpenAI({apiKey:process.env.API_KEY});


const transcribe = async filePath => {

    const res = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    response_format:"verbose_json",
    model: "whisper-1",
    timestamp_granularities:"segment"
    });

    return res.segments;
}
const outputDir = './output';

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
    fs.mkdirSync(outputDir+'/audioClips');
}

const main = async (filePath) => {
const transcribeData = await transcribe(filePath);
// console.log(transcribeData);
// export transcribe data 
fs.writeFile(outputDir+'/transcribe_data.json',JSON.stringify(transcribeData),'',(err)=> {
    if (err) {
    console.error('Error writing file:', err);
    return;
  }
  console.log('Transcript data saved!');
});

ffmpeg.ffprobe(filePath, (err, metadata) => {
  if (err) return console.error(err);
  const duration = metadata.format.duration;
  console.log(`Audio duration: ${duration}s`);

  const numSegments = transcribeData.length;

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
    fs.mkdirSync(outputDir+'/audioClips');
}
  

  
  const segmentGuid = randomUUID();
  transcribeData.forEach(segment => {
    const startTime = segment.start;
    const endTime = segment.end;
    const segmentId = segment.id;
    const segmentName = `${segmentGuid}_${segmentId}.mp3`;
    segment['segmentName'] = segmentName;
    const outputPath = path.join(outputDir+'/audioClips', segmentName);

    ffmpeg(filePath)
      .setStartTime(startTime)
      .setDuration(endTime-startTime)
      .output(outputPath)
      .on('end', () => {
        console.log(`Segment ${segmentId} saved.`);
      })
      .on('error', (err) => {
        console.error(`Error processing segment ${segmentId}:`, err.message);
      })
      .run();
      
  });


  //header for csv
      fs.writeFile(outputDir+`/sentences.csv`,convertArrayToCSV(transcribeData.map(segment => [segment.text," ",`[sound:${segment.segmentName}]`]),{
        separator: ','
    }),err => {
        console.error(err);
    });
    console.log('File saved!');

});
}


main(argv[2]);