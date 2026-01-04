import React from "react";
import WavesurferPlayer from "@wavesurfer/react";
import languages from "../types/languages.js";
import Stack from '@mui/material/Stack';
import CustomButton from "./CustomButton.jsx";
import Loader from "./Loader.jsx";
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import useWaveSurfer from "../hooks/useWaveSurfer.jsx";
import AudioSegments from "./AudioSegments.jsx";
import useAudioSession from "../hooks/useAudioSession.jsx";
import useAlert from "../hooks/useAlert.jsx";

export default function LocalWaveform() {

    const {
        selectedStart, selectedEnd,
        regionsRef,wsRef,
        onMount
    } = useWaveSurfer();
    const {
        transcribeSegments,addAudioSegment,removeAudioSegment,
        loading,filename,segments,fileUrl,
        error,clearError,handleFile,errMsg
    } = useAudioSession();

    const {showAlert,setShowAlert} = useAlert();


    return (
        <div className="max-w-xl mx-auto p-4">
            {
                error && <Alert
                action={<IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                       clearError()
                    }}
                >
                    <CloseIcon fontSize="inherit" />
                </IconButton>}
                    variant={"filled"} severity="error">
                        {errMsg}
                </Alert>
            }
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
                                {showAlert ? <p className={'alert-success'}>Audio Segment Added!</p> :
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
                            <CustomButton onClick={() => {
                                addAudioSegment(selectedStart, selectedEnd)
                                setShowAlert(true)
                            }}  disabled={!regionsRef.current}>
                                Add Audio Segment
                            </CustomButton>
                            <CustomButton onClick={transcribeSegments}  disabled={!regionsRef.current || segments.length === 0}>
                                Transcribe Audio segments
                            </CustomButton>
                        </Stack>
                        <AudioSegments
                            segments={segments}
                            wsRef={wsRef}
                            removeAudioSegment={removeAudioSegment}
                        />
                    </div>
            }
        </div>
    );
}
