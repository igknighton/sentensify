import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';


const ColorButton = styled(Button)(() => ({
    color: "#ffffff",
    backgroundColor: "#5e6a5b",
    '&:hover': {
        backgroundColor: "#40483e",
    },
    '&.Mui-disabled': {
        backgroundColor: "#252a24",
        color: "#c0c0c0"
    }
}));

export default function CustomButton(props) {
    return <ColorButton {...props} variant={"contained"}>{props.children}</ColorButton>;
}
