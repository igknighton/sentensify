import OpenAI from "openai";
import 'dotenv/config';
import ffmpeg from "fluent-ffmpeg";
import { argv } from 'node:process';
import path from "path";
import fs from "fs";
import  { convertArrayToCSV } from 'convert-array-to-csv';

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

const main = async (filePath) => {
const transcribeData = await transcribe(filePath);
ffmpeg.ffprobe(filePath, (err, metadata) => {
  if (err) return console.error(err);
  const duration = metadata.format.duration;
  console.log(`Audio duration: ${duration}s`);

  const numSegments = transcribeData.length;

    const outputDir = './output';
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
    fs.mkdirSync(outputDir+'/audioClips');
}
  

  
  
  transcribeData.forEach(segment => {
    const startTime = segment.start;
    const endTime = segment.end;

    const segmentId = segment.id;
    const outputPath = path.join(outputDir+'/audioClips', `segment_${segmentId}.mp3`);

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
      fs.writeFile(outputDir+`/sentences.csv`,convertArrayToCSV(transcribeData.map(segment => [segment.text," ",`[sound:segment_${segment.id}.mp3]`]),{
        separator: ','
    }),err => {
        console.error(err);
    });
    console.log('File saved!');

});
}


main(argv[2]);