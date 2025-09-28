import 'dotenv/config';
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import  { convertArrayToCSV } from 'convert-array-to-csv';
import { randomUUID } from "node:crypto";
import {createClient} from "@deepgram/sdk";

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
const outputDir = './output';

const transcribe = async (filePath,audioSegments) => {

    const {result, error} = await deepgramClient.listen.prerecorded.transcribeFile(
        fs.readFileSync(filePath),
        {
            model: "nova-3",
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
        await fs.writeFile(outputDir+'/transcribe_data.json',JSON.stringify(results),'',(err)=> {
            if (err) {
                console.error('Error writing file:', err);
                return;
            }
            console.log('Transcript data saved!');
        });
        // console.dir(transcriptionObj.transcript,{depth:null});
        if (audioSegments.length === 0) {
            // console.dir(transcriptionObj.paragraphs.paragraphs, {depth: null});
            return transcriptionObj.paragraphs.paragraphs;
        } else {
            const words = transcriptionObj.words;
            let paragraphs = [];
            let sentences = [];
            audioSegments.forEach(segment => {
                const startSegment = parseFloat(segment.start);
                const endSegment = parseFloat(segment.end);
                const phrase = words.filter( word => (
                    (word.start >= startSegment && word.start <= endSegment) ||
                    (word.start <= startSegment && startSegment <= word.end)
                ))
                const text = phrase.map(word => {
                    return word.punctuated_word
                })
                sentences.push({
                    "text": text.join(" "),
                    start: startSegment,
                    end:endSegment
                })
            })
            paragraphs.push({
                "sentences": sentences
            })

            return paragraphs
        }
    }
}
const ensureDir = (p) => fs.promises.mkdir(p, { recursive: true });

const ffprobeAsync = (filePath) =>
    new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata);
        });
    });

const sanitizeTime = (t, { min = 0, decimals = 6 } = {}) => {
    if (!Number.isFinite(t)) return 0;
    // Treat tiny magnitudes as zero
    if (Math.abs(t) < 1e-3) t = 0;
    // No negatives
    t = Math.max(min, t);
    // Return as fixed-decimal string (prevents 1.2e-7)
    return t.toFixed(decimals);
};
const exportClip = (srcPath, start, end, outPath) =>
    new Promise((resolve, reject) => {
        ffmpeg(srcPath)
            .setStartTime(sanitizeTime(start))
            .setDuration(sanitizeTime(end - start))
            .output(outPath)
            .on("end", resolve)
            .on("error", reject)
            .run();
    });

export const main = async (filePath, audioSegments = []) => {
    try {
        await ensureDir(outputDir);
        await ensureDir(path.join(outputDir, "audioClips"));

        const transcribeData = await transcribe(filePath, audioSegments);


        const metadata = await ffprobeAsync(filePath);
        console.log(`Audio duration: ${metadata.format.duration}s`);

        const segmentGuid = randomUUID();

        let i = 0;
        let clipJobs = [];
        for (const paragraph of transcribeData) {
            const sentences = paragraph.sentences;
            for (const sentence of sentences) {
                const startTime = sentence.start;
                const endTime = sentence.end += 0.3;
                const sentenceId = i;
                ++i;
                const segmentName = `${segmentGuid}_${sentenceId}.mp3`;
                sentence['sentenceAudioName'] = segmentName;
                const outputPath = path.join(outputDir + '/audioClips', segmentName);

                clipJobs.push(
                    exportClip(filePath, startTime, endTime, outputPath).then(() => {
                        console.log(`sentence ${sentenceId}`)
                    })
                )
            }
        }

        await Promise.all(clipJobs);

        const allSentences = transcribeData.flatMap(paragraph => paragraph.sentences);
        const csv = convertArrayToCSV(allSentences.map(sentence =>
                [sentence.text, " ", `[sound:${sentence.sentenceAudioName}]`]),
            {separator: ','}
        )
        await fs.writeFile(path.join(outputDir, "sentences.csv"), csv, err => {
            console.error(err);
        });
        console.log('CSV saved!');
    } catch (e) {
        console.error("An error occurred",e)
    }

}