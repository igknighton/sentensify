import {useEffect, useState} from 'react';
import axios from "axios";

const useAudioSession = () => {

    //todo cleanup loading states
    const [loading, setLoading] = useState(false);
    const [filename,setFilename] = useState(() =>localStorage.getItem('filename') ?? null);
    const [error, setError] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [segments, setSegments] = useState(() => JSON.parse(localStorage.getItem("audioSegments"))??[]);

    const clearError = () => {
        setError(false);
        setErrMsg('')
    }

    const transcribeSegments = async () => {
        try {
            clearError();
            setLoading(true);
            const res = await axios.post('/api/transcribe', {
                filename,
                segments
            }, {
                responseType:'blob'
            })
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;


            link.setAttribute("download", `${crypto.randomUUID()}.zip`);

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
            localStorage.removeItem("audioSegments");
            localStorage.removeItem("filename");
            localStorage.removeItem("currentStartSegment");
            localStorage.removeItem("currentEndSegment");
            setLoading(false)
        }
        catch (e) {
            setError(true)
            setErrMsg('Error Transcribing Audio')
            console.error("Error Transcribing audio",e)
            setLoading(false)
        }
    }

    const handleFile = async e => {
        clearError()
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.includes("audio") && !f.type.includes("video")) {
            setError(true)
            setErrMsg("File must be an audio or video file");
            return;
        }
        try {
            const res = await axios.post('/api/upload',
                {
                    audio: f
                },
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                }
            )
            if (res.status === 200 ) {
                const url = URL.createObjectURL(f);
                setSelectedFile(f);

                setFileUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                });
                const fName = res.data.filename
                localStorage.setItem("filename",fName);
                setFilename(fName)
                //clears old audio segments from previous file
                setSegments([])
                localStorage.removeItem('audioSegments');
            } else {
                console.error("Failed to upload file");
            }

        } catch (e) {
            console.error("An error occurred while uploading", e);
            setError(true)
            setErrMsg("Failed to upload file")
        }
    };

    const addAudioSegment = (selectedStart,selectedEnd) => {
        const audioSegments = [...segments,{
            id:crypto.randomUUID(),
            start:selectedStart,
            end:selectedEnd
        }]
        setSegments(audioSegments)
        localStorage.setItem('audioSegments', JSON.stringify(audioSegments))
    }

    const removeAudioSegment = id => {
        const updatedSegments = segments.filter(segment => segment.id !== id)
        setSegments(updatedSegments)
        localStorage.setItem('audioSegments', JSON.stringify(updatedSegments))
    }

    useEffect(() => {
        const getAudioFile = async filename => {
            try {
                const config = {
                    allowAbsoluteUrls: true,
                    responseType: 'blob'
                }
                const res = await axios.get(`/api/upload/get/${filename}`, config);
                if (res.status === 200) {
                    const blob = res.data;
                    const file = new File([blob], filename)
                    const url = URL.createObjectURL(blob);
                    setFileUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return url;
                    });
                    setSelectedFile(file);
                }
            } catch (e) {
                setError(true);
                setErrMsg("Failed to locate file")
                console.error("Failed to locate file",e)
            }
        }
        if (segments != null && filename != null) getAudioFile(filename).then()
    },[])

    useEffect(() => () => fileUrl && URL.revokeObjectURL(fileUrl), [fileUrl]);

    return {loading,fileUrl,segments,errMsg,error,
        handleFile,removeAudioSegment,transcribeSegments,addAudioSegment};
};

export default useAudioSession;