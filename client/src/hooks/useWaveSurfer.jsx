import React, {useRef, useState} from 'react';
import RegionsPlugin from "wavesurfer.js/plugins/regions";
import ZoomPlugin from "wavesurfer.js/plugins/zoom";

const useWaveSurfer = () => {

    const wsRef = useRef(null);
    const regionsRef = useRef(null);
    const zoomRef = useRef(null);

    const [selectedStart, setSelectedStart] = useState(0);
    const [selectedEnd, setSelectedEnd] = useState(1);

    const onMount = (ws) => {
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

            if (currentStartSegment && currentEndSegment ) {
                setSelectedStart(Number(currentStartSegment))
                setSelectedEnd(Number(currentEndSegment))
            }
            else {
                setSelectedStart(r.start)
                setSelectedEnd(r.end)
            }
        });
        regionsRef.current.on("region-updated", (r) => {
            const start = r.start;
            const end = r.end;
            setSelectedStart(start)
            setSelectedEnd(end)
            localStorage.setItem('currentStartSegment',start)
            localStorage.setItem('currentEndSegment',end)

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
    };
    return {
        setSelectedStart,selectedStart,
        setSelectedEnd,selectedEnd,
        zoomRef,regionsRef,wsRef,
        onMount
    };
};

export default useWaveSurfer;