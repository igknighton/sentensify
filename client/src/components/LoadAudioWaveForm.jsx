import React, { useState, useEffect } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import RegionsPlugin from "wavesurfer.js/plugins/regions";
import {useRef} from "react";
import DeleteIcon from '@mui/icons-material/Delete';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
export default function LocalWaveform() {
    const wsRef = useRef(null);
    const regionsRef = useRef(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [selectedStart, setSelectedStart] = useState(0);
    const [selectedEnd, setSelectedEnd] = useState(1);
    const [segments, setSegments] = useState([]);
    useEffect(() => () => fileUrl && URL.revokeObjectURL(fileUrl), [fileUrl]);

    const onMount = (ws) => {
        wsRef.current = ws;

        // Register the Regions plugin (returns the plugin instance)
        regionsRef.current = ws.registerPlugin(RegionsPlugin.create());

        regionsRef.current.enableDragSelection({
            color: "rgba(37,99,235,0.25)",
            drag: true,
            resize: true,
        });

        // Handy region events
        regionsRef.current.on("region-created", (r) => {
            console.log("region-created", r.id, r.start, r.end);
            setSelectedStart(r.start)
            setSelectedEnd(r.end)
        });
        regionsRef.current.on("region-updated", (r) => {
            console.log("region-updated", r.id, r.start, r.end);
            setSelectedStart(r.start)
            setSelectedEnd(r.end)
        });
        regionsRef.current.on("region-clicked", (r, e) => {
            e.stopPropagation();
            ws.play(r.start, r.end);
        });


        ws.on("ready", () => {
            const dur = ws.getDuration();
            if (dur > 1.5) {
                regionsRef.current.addRegion({
                    start: Math.max(0, dur * 0.1),
                    end: Math.min(dur, dur * 0.25),
                    color: "rgba(16,185,129,0.25)",
                });
            }
        });
    };

    const handleFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        setFileUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
        });
    };

    const addAudioSegment = () => {
        setSegments([...segments,{id:crypto.randomUUID(),start:selectedStart,end:selectedEnd}])
    }

    const removeAudioSegment = id => {
        console.log("Removing segment",id)
        setSegments(segments.filter(segment => segment.id !== id))
    }

    return (
        <div className="max-w-xl mx-auto p-4">
            <input type="file" accept="audio/*" onChange={handleFile} className="mb-3" />
            <WavesurferPlayer
                url={fileUrl || undefined}
                height={100}
                barWidth={2}
                barGap={1}
                waveColor="#9ca3af"
                progressColor="#4b5563"
                cursorColor="#111827"
                normalize
                dragToSeek
                onReady={onMount}
            />
            <div className="mt-3 flex flex-wrap gap-2">
                {wsRef.current && <div className={'startEndDisplay'}><h2>Start: {selectedStart.toFixed(2)}</h2> <h2>End: {selectedEnd.toFixed(2)}</h2></div>}
                <button
                    onClick={() => wsRef.current?.play(selectedStart,selectedEnd)}
                    className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
                    disabled={!wsRef.current}
                >
                    {wsRef.current?.isPlaying() ? "Pause" : "Play"}
                </button>
                <button onClick={addAudioSegment} className="px-3 py-2 rounded border" disabled={!regionsRef.current}>
                    Add Audio Segment
                </button>
                <ul>
                    {
                        segments.map((segment) => (
                            <div className={'audioSegment'} key={segment.id}>
                                <div>{segment.start.toFixed(2)}-{segment.end.toFixed(2)}</div>
                                <div>
                                    <PlayCircleIcon color={'success'} onClick={() => wsRef.current?.play(segment.start,segment.end)}/>
                                    <DeleteIcon color={'error'} onClick={() => removeAudioSegment(segment.id)}/>
                                </div>
                            </div>
                        ))
                    }
                </ul>
            </div>
        </div>
    );
}
