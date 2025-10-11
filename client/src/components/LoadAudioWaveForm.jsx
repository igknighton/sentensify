import React, { useState, useEffect } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import RegionsPlugin from "wavesurfer.js/plugins/regions";
import ZoomPlugin from "wavesurfer.js/plugins/zoom";
import {useRef} from "react";
import DeleteIcon from '@mui/icons-material/Delete';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import Stack from '@mui/material/Stack';
import axios from "axios";
import CustomButton from "./CustomButton.jsx";
export default function LocalWaveform() {
    const wsRef = useRef(null);
    const regionsRef = useRef(null);
    const zoomRef = useRef(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [selectedStart, setSelectedStart] = useState(0);
    const [selectedEnd, setSelectedEnd] = useState(1);
    const [segments, setSegments] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    useEffect(() => () => fileUrl && URL.revokeObjectURL(fileUrl), [fileUrl]);


    useEffect(() => {
        //todo load filename from /upload upon refresh

        // const audioSegmentsLocal = JSON.parse(localStorage.getItem("audioSegments"))
        // console.log({ selectedFile,audioSegmentsLocal })
        // if (audioSegmentsLocal !== undefined && selectedFile !== undefined) {
        //     setSegments(audioSegmentsLocal);
        // }
    },[])

    useEffect(() => {
        if (showAlert) {
            setTimeout(() => {
                setShowAlert(false);
            }, 2000);
        }
    },[showAlert])
    const onMount = (ws) => {
        wsRef.current = ws;

        // Register the Regions plugin (returns the plugin instance)
        regionsRef.current = ws.registerPlugin(RegionsPlugin.create());
        zoomRef.current = ws.registerPlugin(ZoomPlugin.create({
            scale:0.5,
            maxZoom:100
        }));

        // Handy region events
        regionsRef.current.on("region-created", (r) => {
            setSelectedStart(r.start)
            setSelectedEnd(r.end)
        });
        regionsRef.current.on("region-updated", (r) => {
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
                    color: "rgba(150, 205, 255, .25)",
                });
            }
        });
    };

    const handleFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        setSelectedFile(f);
        setFileUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
        });
    };

    const addAudioSegment = () => {
        const audioSegments = [...segments,{
            id:crypto.randomUUID(),
            start:selectedStart,
            end:selectedEnd
        }]
        setSegments(audioSegments)
        localStorage.setItem('audioSegments', JSON.stringify(audioSegments))
        setShowAlert(true)
    }

    const removeAudioSegment = id => {
        setSegments(segments.filter(segment => segment.id !== id))
    }


    const transcribeSegments = async () => {
        try {
            setLoading(true);
            const res = await axios.post('/api/transcribe', {
                audio: selectedFile,
                segments
            }, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                responseType:'blob'
            })
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;


            link.setAttribute("download", `output.zip`);

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
            setLoading(false)
        }
        catch (e) {
            console.error("Error Transcribing audio",e)
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto p-4">
            <input type="file" accept="audio/*" onChange={handleFile} className="mb-3" />
            <WavesurferPlayer
                url={fileUrl || undefined}
                height={100}
                barWidth={2}
                barGap={1}
                waveColor="#f06543"
                progressColor="#712e22"
                cursorColor="#111827"
                normalize
                dragToSeek
                onReady={onMount}
            />
            {
                loading ? <div>Transcribing Audio...</div> :
                    <div>
                        {
                            wsRef.current && <>
                                {showAlert ? <p className={'alert-text'}>Audio Segment Added!</p> :
                                    <p>Scroll on audio to zoom in/out</p>}
                            </>
                        }
                        {wsRef.current && <div className={'startEndDisplay'}>
                            <h2>Start: {selectedStart.toFixed(2)}</h2>
                            <h2>End: {selectedEnd.toFixed(2)}</h2>
                        </div>}
                        <Stack
                            spacing={2}
                            direction="row"
                            sx={{
                                justifyContent: "center",
                                alignItems: "flex-start",
                            }}
                        >
                            <CustomButton
                                onClick={() => wsRef.current?.play(selectedStart,selectedEnd)}
                                disabled={!wsRef.current}
                            >
                                {wsRef.current?.isPlaying() ? "Pause" : "Play Audio Segment"}
                            </CustomButton>
                            <CustomButton onClick={addAudioSegment}  disabled={!regionsRef.current}>
                                Add Audio Segment
                            </CustomButton>
                            <CustomButton onClick={transcribeSegments}  disabled={!regionsRef.current || segments.length === 0}>
                                Transcribe Audio segments
                            </CustomButton>
                        </Stack>

                        <ul>
                            {
                                segments.map((segment) => (
                                    <div className={'audioSegment'} key={segment.id}>
                                        <div className={'timeSegment'}>{segment.start.toFixed(2)} - {segment.end.toFixed(2)}</div>
                                        <div>
                                            <PlayCircleIcon color={'success'} onClick={() => wsRef.current?.play(segment.start,segment.end)}/>
                                            <DeleteIcon color={'error'} onClick={() => removeAudioSegment(segment.id)}/>
                                        </div>
                                    </div>
                                ))
                            }
                        </ul>
                    </div>
            }
        </div>
    );
}
