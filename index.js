require('dotenv').config();
const axios = require("axios");
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

//test route
app.get('/', (req, res) => {
    res.send('Speech service funcionando');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

const sdk = require("microsoft-cognitiveservices-speech-sdk");
const multer = require("multer");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

app.post("/speech-to-text", upload.single("audio"), async (req, res) => {
    try {
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            process.env.AZURE_SPEECH_KEY,
            process.env.AZURE_REGION
        );

        speechConfig.speechRecognitionLanguage = "es-MX";

        const audioConfig = sdk.AudioConfig.fromWavFileInput(
            fs.readFileSync(req.file.path)
        );

        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizeOnceAsync(result => {
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                res.json({ text: result.text });
            } else {
                res.status(500).json({ error: "No se pudo reconocer el audio" });
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en Speech to Text" });
    }
});

app.post("/translate", async (req, res) => {
    try {
        const { text, to } = req.body;

        const endpoint = "https://api.cognitive.microsofttranslator.com/translate";

        const response = await axios.post(
            endpoint,
            [{
                text: text
            }],
            {
                params: {
                    "api-version": "3.0",
                    "to": to
                },
                headers: {
                    "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY,
                    "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION,
                    "Content-Type": "application/json"
                }
            }
        );
        const translatedText = response.data[0].translations[0].text;

        res.json({
            translated: translatedText
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en traducción" });
    }
});

app.post("/text-to-speech", async (req, res) => {
    try {
        const { text, language } = req.body;

        const speechConfig = sdk.SpeechConfig.fromSubscription(
            process.env.AZURE_SPEECH_KEY,
            process.env.AZURE_REGION
        );

        // es-MX español, en-US ingles, fr-FR frances
        speechConfig.speechSynthesisVoiceName = language;

        const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();

        const synthesizer = new sdk.SpeechSynthesizer(
            speechConfig,
            null
        );

        synthesizer.speakTextAsync(
            text,
            result => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    const audioBuffer = Buffer.from(result.audioData);

                    // res.set({
                    //     "Content-Type": "audio/wav",
                    //     "Content-Length": audioBuffer.length
                    // });

                    // res.send(audioBuffer);

                    const base64Audio = audioBuffer.toString("base64");

                    res.json({
                        audio: base64Audio
                    });

                } else {
                    res.status(500).json({ error: "No se pudo generar audio" });
                }
            },
            error => {
                console.error(error);
                res.status(500).json({ error: "Error en Text to Speech" });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error general" });
    }
});