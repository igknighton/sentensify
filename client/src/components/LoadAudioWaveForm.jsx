import React, {useRef, useState} from "react";
import WavesurferPlayer from "@wavesurfer/react";
import languages from "../types/languages.js";
import Stack from '@mui/material/Stack';
import {FormControl, FormHelperText, Input, InputLabel, Modal} from "@mui/material";
import CustomButton from "./CustomButton.jsx";
import CustomBox from "./CustomBox.jsx";
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import useWaveSurfer from "../hooks/useWaveSurfer.jsx";
import AudioSegments from "./AudioSegments.jsx";
import useAudioSession from "../hooks/useAudioSession.jsx";
import useAlert from "../hooks/useAlert.jsx";
import Loader from "./Loader.jsx";

const languageOptions = Object.entries(languages).map(([label, code]) => ({ label, code }));

const YOUTUBE_URL_REGEX =
    /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|live\/)[\w-]{11}|youtu\.be\/[\w-]{11})(\S*)?$/;

export default function LocalWaveform() {

    const inputRef = useRef(null);
    const {
        selectedStart, selectedEnd,
        regionsRef,wsRef,
        onMount,clearWaveSurfer
    } = useWaveSurfer();
    const {
        transcribeSegments,addAudioSegment,removeAudioSegment,
        loading,converting,filename,segments,fileUrl,
        error,clearError,clearSession,handleFile,handleYoutubeUrl,errMsg,
        successMsg,clearSuccess,
        language,setLanguage
    } = useAudioSession();

    const {showAlert,setShowAlert} = useAlert();


    const [open, setOpen] = useState(false);
    const [deckName, setDeckName] = useState('');
    const [modalError, setModalError] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const youtubeUrlValid = YOUTUBE_URL_REGEX.test(youtubeUrl.trim());

    const handleConvert = async () => {
        await handleYoutubeUrl(youtubeUrl.trim());
        setYoutubeUrl('');
        if (inputRef.current) inputRef.current.value = '';
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (deckName !== '') {
                setOpen(false);
                const res = await transcribeSegments(deckName);
                if (res) {
                    setDeckName('')
                    setModalError(false)
                    clearWaveSurfer();
                    if (inputRef.current) inputRef.current.value = '';
                }
            }
            else {
                setModalError(true)
            }
        } catch (e) {
            console.error("Error submitting form",e)
        }
    };

    const handleOpen = () => {
        setOpen(true)
    }
    const handleClose = () => {
        setOpen(false);
    };


    return (
        <div className="max-w-xl mx-auto p-4">
            <p>Upload an mp3 file or paste a youtube link to start creating your flashcards.</p>
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
            {
                successMsg && <Alert
                action={<IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                       clearSuccess()
                    }}
                >
                    <CloseIcon fontSize="inherit" />
                </IconButton>}
                    variant={"filled"} severity="success">
                        {successMsg}
                </Alert>
            }
            <input ref={inputRef} type="file" accept="audio/*" onChange={handleFile} className="upload-file mb-3" />

            <Stack
                spacing={2}
                direction="row"
                sx={{
                    alignItems: "flex-start",
                    mb: 2
                }}
            >
                <TextField
                    label="YouTube URL"
                    size="small"
                    fullWidth
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    error={youtubeUrl !== '' && !youtubeUrlValid}
                    helperText={youtubeUrl !== '' && !youtubeUrlValid ? 'Enter a valid YouTube video URL' : ''}
                    disabled={converting}
                />
                <CustomButton
                    onClick={handleConvert}
                    disabled={!youtubeUrlValid || converting}
                    sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}

                >
                    {converting ? 'Processing...' : 'Convert'}
                </CustomButton>
            </Stack>
            <Autocomplete
                options={languageOptions}
                getOptionLabel={(option) => option.label}
                value={languageOptions.find(o => o.code === language) ?? null}
                onChange={(_, newValue) => { if (newValue) setLanguage(newValue.code); }}
                isOptionEqualToValue={(option, value) => option.code === value.code}
                renderInput={(params) => <TextField {...params} label="Language" size="small" />}
                sx={{ mb: 2 }}
            />
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
                            <CustomButton onClick={handleOpen}  disabled={!regionsRef.current || segments.length === 0}>
                                Transcribe Audio segments
                            </CustomButton>
                            <CustomButton onClick={() => {
                                clearSession();
                                clearWaveSurfer();
                                if (inputRef.current) inputRef.current.value = '';
                            }} disabled={!filename}>
                                Clear
                            </CustomButton>
                        </Stack>
                            <AudioSegments
                                segments={segments}
                                wsRef={wsRef}
                                removeAudioSegment={removeAudioSegment}
                            />
                    </div>
            }
            <Modal
                open={open}
                onClose={handleClose}
            >
                <CustomBox
                    component="form"
                    className={'modalForm'}
                    noValidate
                    autoComplete="off"
                    onSubmit={handleSubmit}
                >
                    <FormControl>
                        <InputLabel htmlFor="my-input">Deck Name</InputLabel>
                        <Input
                            id="my-input"
                            aria-describedby="my-helper-text"
                            value={deckName}
                            onChange={e => setDeckName(e.target.value)}
                            error={modalError}
                        />
                        <FormHelperText id="my-helper-text" error={modalError}>
                            {modalError ? 'Deck name cannot be blank' : 'Enter a name for your deck.'}
                        </FormHelperText>
                        <CustomButton type="submit" sx={{marginTop:2}} variant="contained">Submit</CustomButton>
                    </FormControl>
                </CustomBox>
            </Modal>
        </div>
    );
}
