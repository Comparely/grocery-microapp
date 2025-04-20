from fastapi import FastAPI
from app.routers.process_router import router as process_router

app = FastAPI(
    title="Ginger - Comparely AI Process Manager",
    description="Microapp to spawn and monitor background processes",
    version="1.0.0",
)

app.include_router(process_router)