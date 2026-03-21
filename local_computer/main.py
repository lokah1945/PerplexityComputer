from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from local_computer.agent import run_agent_turn

app = FastAPI(title="Local Computer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatBody(BaseModel):
    message: str = Field(..., min_length=1, max_length=200_000)


@app.post("/api/chat")
async def chat(body: ChatBody):
    try:
        return await run_agent_turn(body.message)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


STATIC = Path(__file__).resolve().parent.parent / "static"


@app.get("/")
async def index():
    index_path = STATIC / "index.html"
    if not index_path.is_file():
        raise HTTPException(status_code=404, detail="static/index.html missing")
    return FileResponse(index_path)


app.mount("/static", StaticFiles(directory=STATIC), name="assets")
