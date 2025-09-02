from kokoro import KPipeline
import asyncio
from pypdf import PdfReader
from pydantic import BaseModel
import torch
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from fastapi import FastAPI, WebSocket, Form, File, UploadFile
from fastapi import WebSocketDisconnect
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select

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
            text = (await websocket.receive_text()).lower()
            start_pos = 0
            lines = []
            while (start_pos < len(text)):
                if "." not in text[start_pos:]:
                    lines.append(text[start_pos:])
                    break
                index = text.index(".", start_pos)
                lines.append(text[start_pos:index+1])
                start_pos = index + 1

            print(lines)
            task = asyncio.create_task(send_bytes(websocket, lines))
            await task
    except WebSocketDisconnect:
        task.cancel()
        print("disconnected")


# data base

class Hero(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    password: str


sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
