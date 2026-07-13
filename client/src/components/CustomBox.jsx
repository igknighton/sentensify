import React from 'react';
import {Box} from "@mui/material";

const sx = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 200,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4
}

export default function CustomBox(props) {
    return <Box sx={sx} {...props}>{props.children}</Box>
};