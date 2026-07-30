import React, {useCallback, useEffect, useRef, useState} from 'react';
import RegionsPlugin from "wavesurfer.js/plugins/regions";
import ZoomPlugin from "wavesurfer.js/plugins/zoom";

const useWaveSurfer = (fileUrl) => {

    const wsRef = useRef(null);
    const regionsRef = useRef(null);
    const zoomRef = useRef(null);

    const [selectedStart, setSelectedStart] = useState(0);
    const [selectedEnd, setSelectedEnd] = useState(1);

    // wavesurfer rebuilds the instance whenever `url` changes, and wavesurfer emits
    // `load` in a microtask before React has subscribed to it, so track which url actually
    // reached `ready` instead of listening for the start of the load.
    const urlRef = useRef(fileUrl);
    urlRef.current = fileUrl;
    const [readyUrl, setReadyUrl] = useState(null);
    const [wsError, setWsError] = useState('');
    const wsLoading = Boolean(fileUrl) && readyUrl !== fileUrl;

    useEffect(() => setWsError(''), [fileUrl]);

    const onWsError = useCallback((_ws, err) => {
        // Swapping files destroys the previous instance, which aborts its in-flight fetch.
        if (err?.name === 'AbortError') return;
        setReadyUrl(urlRef.current);
        setWsError('Could not load this audio file');
    }, []);

    const onMount = useCallback((ws) => {
        setReadyUrl(urlRef.current);
        wsRef.current = ws;
        // Register the Regions plugin (returns the plugin instance)
        regionsRef.current = ws.registerPlugin(RegionsPlugin.create());
        zoomRef.current = ws.registerPlugin(ZoomPlugin.create({
            scale:0.5,
            maxZoom:100
        }));

        const currentStartSegment = localStorage.getItem("currentStartSegment");
        const currentEndSegment = localStorage.getItem("currentEndSegment");
        // Handy region events
        regionsRef.current.on("region-created", (r) => {


            r.on("update", () => {
                setSelectedStart(r.start)
                setSelectedEnd(r.end)
            });

            r.on("update-end",() => {
                setSelectedStart(r.start)
                setSelectedEnd(r.end)
                localStorage.setItem('currentStartSegment',r.start)
                localStorage.setItem('currentEndSegment',r.end)
            })
            if (currentStartSegment && currentEndSegment ) {
                setSelectedStart(Number(currentStartSegment))
                setSelectedEnd(Number(currentEndSegment))
            }
            else {
                setSelectedStart(r.start)
                setSelectedEnd(r.end)
            }
        });
        regionsRef.current.on("region-clicked", (r, e) => {
            e.stopPropagation();
            ws.play(r.start, r.end);
        });
        ws.on("ready", () => {
            const dur = ws.getDuration();
            if (dur > 1.5) {
                regionsRef.current.addRegion({
                    start: currentStartSegment ? currentStartSegment : Math.max(0, dur * 0.1),
                    end: currentEndSegment ? currentEndSegment: Math.min(dur, dur * 0.25),
                    color: "rgba(150, 205, 255, .25)",
                });
            }
        });
    }, []);
    const clearWaveSurfer = () => {
        regionsRef.current?.clearRegions();
        wsRef.current?.empty();
        setSelectedStart(0);
        setSelectedEnd(1);
        regionsRef.current = null;
        setReadyUrl(null);
        setWsError('');
    };

    return {
        setSelectedStart,selectedStart,
        setSelectedEnd,selectedEnd,
        zoomRef,regionsRef,wsRef,
        onMount,clearWaveSurfer,
        wsLoading,wsError,onWsError
    };
};

export default useWaveSurfer;