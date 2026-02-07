"""Theme management routes."""
import json
import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/themes", tags=["themes"])

# Store themes in user's home directory
THEMES_DIR = Path.home() / ".lavarrock" / "themes"
THEMES_DIR.mkdir(parents=True, exist_ok=True)
ACTIVE_THEME_FILE = THEMES_DIR / "active_theme.json"


class ThemeUpload(BaseModel):
    """Theme upload model."""
    name: str
    theme: dict


class ThemeResponse(BaseModel):
    """Theme response model."""
    name: str
    theme: dict
    active: bool


@router.post("", response_model=ThemeResponse)
async def upload_theme(theme_data: ThemeUpload):
    """Upload and save a VSCode theme."""
    try:
        # Save theme file
        theme_file = THEMES_DIR / f"{theme_data.name}.json"
        with open(theme_file, "w") as f:
            json.dump(theme_data.theme, f, indent=2)
        
        # Set as active theme
        with open(ACTIVE_THEME_FILE, "w") as f:
            json.dump({"name": theme_data.name}, f)
        
        return ThemeResponse(
            name=theme_data.name,
            theme=theme_data.theme,
            active=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save theme: {str(e)}")


@router.get("/active", response_model=Optional[ThemeResponse])
async def get_active_theme():
    """Get the currently active theme."""
    try:
        if not ACTIVE_THEME_FILE.exists():
            return None
        
        with open(ACTIVE_THEME_FILE, "r") as f:
            active_data = json.load(f)
        
        theme_name = active_data.get("name")
        if not theme_name:
            return None
        
        theme_file = THEMES_DIR / f"{theme_name}.json"
        if not theme_file.exists():
            return None
        
        with open(theme_file, "r") as f:
            theme = json.load(f)
        
        return ThemeResponse(
            name=theme_name,
            theme=theme,
            active=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load theme: {str(e)}")


@router.get("", response_model=list[ThemeResponse])
async def list_themes():
    """List all available themes."""
    try:
        active_name = None
        if ACTIVE_THEME_FILE.exists():
            with open(ACTIVE_THEME_FILE, "r") as f:
                active_data = json.load(f)
                active_name = active_data.get("name")
        
        themes = []
        for theme_file in THEMES_DIR.glob("*.json"):
            if theme_file.name == "active_theme.json":
                continue
            
            with open(theme_file, "r") as f:
                theme = json.load(f)
            
            theme_name = theme_file.stem
            themes.append(ThemeResponse(
                name=theme_name,
                theme=theme,
                active=(theme_name == active_name)
            ))
        
        return themes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list themes: {str(e)}")


@router.delete("/{theme_name}")
async def delete_theme(theme_name: str):
    """Delete a theme."""
    try:
        theme_file = THEMES_DIR / f"{theme_name}.json"
        if not theme_file.exists():
            raise HTTPException(status_code=404, detail="Theme not found")
        
        theme_file.unlink()
        
        # Clear active theme if it was deleted
        if ACTIVE_THEME_FILE.exists():
            with open(ACTIVE_THEME_FILE, "r") as f:
                active_data = json.load(f)
            if active_data.get("name") == theme_name:
                ACTIVE_THEME_FILE.unlink()
        
        return {"message": "Theme deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete theme: {str(e)}")
