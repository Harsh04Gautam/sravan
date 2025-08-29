from kokoro import KPipeline
import asyncio
from pypdf import PdfReader
from pydantic import BaseModel
import torch
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from fastapi import FastAPI, WebSocket, Form, File, UploadFile
from fastapi import WebSocketDisconnect

app = FastAPI()

origins = [
    "*",
    "http://localhost:5173",
]

synthesiser = None
speaker_embedding = None
pipeline = KPipeline(lang_code='a')
device = torch.accelerator.current_accelerator(
).type if torch.accelerator.is_available() else "cpu"


async def send_bytes(websocket: WebSocket, lines):
    for line in lines:
        print(line)
        generator = pipeline(line, voice='af_heart')
        for i, (gs, ps, audio) in enumerate(generator):
            await websocket.send_bytes(audio.numpy().tobytes())


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"]
)


class FormData(BaseModel):
    username: Annotated[str, Form()]
    accountNum: Annotated[str, Form()]
    file:   Annotated[UploadFile, File()]


@app.post("/file")
async def read_file(data: Annotated[FormData, Form()]):
    file = PdfReader(data.file.file)
    print(len(file.pages))
    print(file.pages[100].extract_text())


@app.websocket("/kokoro")
async def read_kokoro(websocket: WebSocket):
    await websocket.accept()
    task = None
    try:
        while True:
            lines = (await websocket.receive_text()).split(".")
            task = asyncio.create_task(send_bytes(websocket, lines))
            await task
    except WebSocketDisconnect:
        task.cancel()
        print("disconnected")
