import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
// Optional plugins:
// import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";

export default function LocalAudioWaveform() {
    const containerRef = useRef(null);
    const waveSurferRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [filename, setFilename] = useState("");

    useEffect(() => {
        // Create the instance once the container is mounted
        waveSurferRef.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: "#9ca3af",      // Tailwind gray-400
            progressColor: "#4b5563",   // gray-600
            cursorColor: "#d5d8dd",     // gray-900
            height: 96,
            barWidth: 2,
            barGap: 1,
            interact: true,
            dragToSeek: true,
            minPxPerSec: 50,            // zoom baseline; adjust as you like
            normalize: true,
        });

        const ws = waveSurferRef.current;

        // Example: add Regions plugin if you want markers/clips
        // const regions = RegionsPlugin.create();
        // ws.registerPlugin(regions);

        ws.on("ready", () => setIsReady(true));
        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("finish", () => setIsPlaying(false));

        // Responsive redraw on resize
        const onResize = () => ws?.setOptions({}); // triggers re-render
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            ws?.destroy();
        };
    }, []);

    const loadFile = (file) => {
        if (!file) return;
        setIsReady(false);
        setFilename(file.name);
        // This decodes audio and renders the waveform
        waveSurferRef.current.loadBlob(file);
    };

    const onInputChange = (e) => {
        const file = e.target.files?.[0];
        loadFile(file);
    };

    const onDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        loadFile(file);
    };
    const onDragOver = (e) => e.preventDefault();

    const togglePlay = () => {
        // Browsers require a user gesture before audio can start
        waveSurferRef.current.playPause();
    };

    const zoomIn = () => {
        const ws = waveSurferRef.current;
        ws.setOptions({ minPxPerSec: Math.min((ws.options.minPxPerSec || 50) * 1.25, 1000) });
    };
    const zoomOut = () => {
        const ws = waveSurferRef.current;
        ws.setOptions({ minPxPerSec: Math.max((ws.options.minPxPerSec || 50) / 1.25, 20) });
    };

    return (
        <div className="max-w-xl mx-auto p-4">
            <label
                htmlFor="uploader"
                className="block mb-2 font-medium"
            >
                Upload an audio file (mp3, wav, m4a, etc.)
            </label>

            <input
                id="uploader"
                type="file"
                accept="audio/*"
                onChange={onInputChange}
                className="mb-3"
            />

            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="mb-3 p-6 border-2 border-dashed rounded-lg text-center text-sm text-gray-600"
            >
                Drag & drop an audio file here
            </div>

            {filename && <div className="mb-2 text-sm text-gray-700">Loaded: {filename}</div>}

            <div ref={containerRef} className="w-full mb-3" />

            <div className="flex gap-2">
                <button
                    onClick={togglePlay}
                    disabled={!isReady}
                    className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
                >
                    {isPlaying ? "Pause" : "Play"}
                </button>
                <button onClick={zoomIn} className="px-3 py-2 rounded border">Zoom In</button>
                <button onClick={zoomOut} className="px-3 py-2 rounded border">Zoom Out</button>
            </div>
        </div>
    );
}
