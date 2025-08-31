import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import { purple } from '@mui/material/colors';


const ColorButton = styled(Button)(({ theme }) => ({
    color: "#ffffff",
    backgroundColor: "#5e6a5b",
    '&:hover': {
        backgroundColor: "#40483e",
    },
}));

export default function CustomButton(props) {
    console.log("Props",props)
    return <ColorButton {...props} variant={"contained"}>{props.children}</ColorButton>;
}
