import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {

const [audio, setAudio] = useState(null);
const [texto, setTexto] = useState("");
const [traduccion, setTraduccion] = useState("");
const [idioma, setIdioma] = useState("en-US-JennyNeural");
const [audioResult, setAudioResult] = useState(null);

const handleAudioChange = (e) => {
    setAudio(e.target.files[0]);
};

const enviarAudio = async () => {
    const formData = new FormData();
    formData.append("audio", audio);

    const res = await axios.post("http://localhost:5000/speech-to-text", formData);
    setTexto(res.data.text);
};

const traducir = async () => {
    if (!texto) {
        alert("Primero convierte el audio");
        return;
    }

    const res = await axios.post("http://localhost:5000/translate", {
        text: texto,
        to: idioma.split("-")[0]
    });

    setTraduccion(res.data.translated);
};

const generarAudio = async () => {
    if (!traduccion) {
        alert("Primero traduce el texto");
        return;
    }

    const res = await axios.post("http://localhost:5000/text-to-speech", {
        text: traduccion,
        language: idioma
    });

    setAudioResult(res.data.audio);
};

const reproducir = () => {
    if (!audioResult) return;

    const audio = new Audio(`data:audio/wav;base64,${audioResult}`);
    audio.play();
};

return (
<div className="container">

<div className="card">

<h1>Traductor de Voz</h1>

<input type="file" onChange={handleAudioChange} className="input"/>

<button className="btn primary" onClick={enviarAudio}>
    Convertir voz
</button>

<div className="box">
<h3>Texto detectado</h3>
<p>{texto || "Aquí aparecerá el texto..."}</p>
</div>

<select 
className="select"
onChange={(e)=>setIdioma(e.target.value)}
>
<option value="en-US-JennyNeural">🇺🇸 Inglés</option>
<option value="fr-FR-DeniseNeural">🇫🇷 Francés</option>
<option value="de-DE-KatjaNeural">🇩🇪 Alemán</option>
</select>

<button className="btn secondary" onClick={traducir}>
    Traducir
</button>

<div className="box">
<h3>Traducción</h3>
<p>{traduccion || "Aquí aparecerá la traducción..."}</p>
</div>

<button className="btn success" onClick={generarAudio}>
🔊 Generar voz
</button>

<button className="btn play" onClick={reproducir}>
▶ Reproducir
</button>

</div>

</div>
);
}

export default App;