import { readFile } from 'fs/promises';

const ENDPOINT = "http://127.0.0.1:8765";

async function anki(action, params = {}, timeoutMs) {
    try {
        const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({action, version: 6, params}),
            signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
        });
        const data = await res.json();
        // console.log(`anki(${action}) data response `,data);
        if (data.error) throw new Error(`AnkiConnect: ${data.error}`);
        return data.result;
    } catch (e) {
        console.error("Anki call error",e)
        throw e;
    }
}

export const createNoteType = async () => {
    try {
        const models = await anki("modelNames");

        if (!models.includes("Audio input")) {
            const htmlBack = await readFile(new URL('./ankiCardTemplate/back.html', import.meta.url), 'utf8');
            const htmlFront = await readFile(new URL('./ankiCardTemplate/front.html', import.meta.url), 'utf8');
            const styling = await readFile(new URL('./ankiCardTemplate/styling.css', import.meta.url), 'utf8');

            await anki("createModel", {
                modelName: "Audio input",
                inOrderFields: ["Audio", "Answer"],
                css: styling,
                cardTemplates: [{
                    Name: "Audio Input",
                    Front: htmlFront,
                    Back: htmlBack,
                }],
            });
        } else {
            console.log("Note type exists.")
        }
    } catch (e) {
        console.error("Error creating note type",e)
        throw e;
    }
}

export const checkConnection = async () => {
    try {
        const version = await anki("version", {}, 3000);
        return Number(version) >= 6;
    } catch {
        console.log("Anki not reachable — will fall back to ZIP download");
        return false;
    }
}

export const createDeck = async (name) => {
    try {
        const res = await anki("createDeck", {deck: name});
        console.log(res.data)
    } catch (e) {
        console.error("Error: ",e)
        throw e;
    }
}


export const addCards = async (cards,deckName) => {
    try {
        const notes = await Promise.all(cards.map( async c => {
            const audioBuffer = await readFile(c.fPath)
            return {
                deckName: deckName,
                modelName: "Audio input",
                fields: {Audio: "", Answer: c.back},
                tags: [],
                options: {
                    allowDuplicate: false,
                    duplicateScope: "deck",
                },
                audio: [{
                    filename: c.fileName,
                    data: audioBuffer.toString('base64'),
                    fields:["Audio"]
                }]
            }
        }))
        const addNotesRes = await anki("addNotes", { notes });
        console.log("Add Notes Response",addNotesRes)
    } catch (e) {
        console.error("Failed to add cards",e)
        throw e;
    }
}