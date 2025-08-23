from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import soundfile as sf
import torch
from datasets import load_dataset
from fastapi import WebSocket

app = FastAPI()

origins = [
    "*",
    "http://localhost:5173",
]

synthesiser = None
speaker_embedding = None


@app.on_event("startup")
async def load_module():
    global synthesiser, speaker_embedding
    synthesiser = pipeline("text-to-speech", "microsoft/speecht5_tts")
    embeddings_dataset = load_dataset(
        "Matthijs/cmu-arctic-xvectors", split="validation")
    speaker_embedding = torch.tensor(
        embeddings_dataset[7306]["xvector"]).unsqueeze(0)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.websocket("/foo")
async def read_item(websocket: WebSocket):
    await websocket.accept()
    while True:
        text = await websocket.receive_text()
        speech = synthesiser(text, forward_params={
                             "speaker_embeddings": speaker_embedding})
        sf.write("speech.wav", speech["audio"],
                 samplerate=speech["sampling_rate"])
        print(speech["audio"].tobytes())
        await websocket.send_bytes(speech["audio"].tobytes())
    # {"audio": speech["audio"].tolist(),
    #                            "samplerate": speech["sampling_rate"]}))

    # return FileResponse("speech.wav")
