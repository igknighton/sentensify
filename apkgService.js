import { readFile } from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import initSqlJs from 'sql.js';
import { Package, Deck, Model, Note } from 'ankipack';

const require = createRequire(import.meta.url);
const sqlWasmDir = path.dirname(require.resolve('sql.js/dist/sql-wasm.js'));

// Fixed model id so re-importing multiple decks reuses the same "Audio input"
// note type instead of creating duplicates.
const AUDIO_INPUT_MODEL_ID = 1700000000000;

let sqlPromise;
const getSql = () =>
    (sqlPromise ??= initSqlJs({ locateFile: (file) => path.join(sqlWasmDir, file) }));


export const buildApkg = async (cards, deckName) => {
    const SQL = await getSql();

    const [htmlBack, htmlFront, styling] = await Promise.all([
        readFile(new URL('./ankiCardTemplate/back.html', import.meta.url), 'utf8'),
        readFile(new URL('./ankiCardTemplate/front.html', import.meta.url), 'utf8'),
        readFile(new URL('./ankiCardTemplate/styling.css', import.meta.url), 'utf8'),
    ]);

    const model = new Model({
        id: AUDIO_INPUT_MODEL_ID,
        name: 'Audio input',
        css: styling,
        fields: [{ name: 'Audio' }, { name: 'Answer' }],
        templates: [{
            name: 'Audio Input',
            questionFormat: htmlFront,
            answerFormat: htmlBack,
        }],
    });

    const deck = new Deck({ name: deckName || 'deck', config: null });
    const pkg = new Package();
    pkg.addDeck(deck);

    for (const card of cards) {
        // Unlike AnkiConnect (which injects the sound tag), the field itself must
        // carry [sound:...] so the {{Audio}} template renders and plays.
        deck.addNote(new Note({
            model,
            fields: [`[sound:${card.fileName}]`, card.back],
        }));
        pkg.addMedia(card.fileName, await readFile(card.fPath));
    }

    return pkg.toUint8Array(SQL);
};
