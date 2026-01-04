import './App.css'
import LocalAudioWaveform from "./components/LoadAudioWaveForm.jsx";
import {createTheme, ThemeProvider} from "@mui/material/styles";
function App() {
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
    return (
        <ThemeProvider theme={theme}>
            <h1>Sentensify</h1>
            <LocalAudioWaveform/>
        </ThemeProvider>
    )
}

export default App
