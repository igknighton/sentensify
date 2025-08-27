import {useMemo, useRef, useState} from 'react'
import WaveSurfer from "wavesurfer.js/dist/wavesurfer.js";

import RegionsPlugin from "wavesurfer.js/src/plugin/regions/index.js";
import './App.css'
import {Button} from "@mui/material";
import LocalAudioWaveform from "./components/LoadAudioWaveForm.jsx";

function App() {
    console.log()
    return (
        <div>
            <h1>Sentensify</h1>
            <LocalAudioWaveform/>
        </div>
    )
}

export default App
