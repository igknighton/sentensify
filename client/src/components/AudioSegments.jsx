import React from 'react';
import {Tooltip} from "@mui/material";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import DeleteIcon from "@mui/icons-material/Delete";
import {createTheme, ThemeProvider} from "@mui/material/styles";

const AudioSegments = ({segments,removeAudioSegment,wsRef}) => {

    const theme = createTheme({
        palette: {
            primary: {
                light: '#dee0df',
                main: '#6c6c6c',
                dark: '#484747',
                contrastText: '#fff',
            }
        },
    });

    return <ThemeProvider theme={theme}>
        <ul>
            {
                segments.map((segment) => (
                    <div className={'audioSegment'} key={segment.id}>
                        <Tooltip title={'Click to play audio segment'} arrow placement={'right'}>
                            <Stack direction="row" key={segment.id}>
                                <Chip
                                    label={segment.start.toFixed(2) + ' - ' + segment.end.toFixed(2)}
                                    onClick={() => wsRef.current?.play(segment.start, segment.end)}
                                    onDelete={() => removeAudioSegment(segment.id)}
                                    deleteIcon={<DeleteIcon color={'error'}/>}
                                    color="primary"
                                />
                            </Stack>
                        </Tooltip>
                    </div>
                ))
            }
        </ul>
    </ThemeProvider>
};

export default AudioSegments;