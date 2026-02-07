"""Lavarrock backend - FastAPI application entry point."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from lavarrock.routes import themes
from lavarrock.routes import config as config_routes

load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Lavarrock",
    description="Self-hosted Obsidian-style AI copilot editor",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(themes.router)
app.include_router(config_routes.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "0.1.0"}


# Health check startup
@app.on_event("startup")
async def startup_event():
    """Application startup."""
    print("🚀 Lavarrock backend starting...")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown."""
    print("🛑 Lavarrock backend shutting down...")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
