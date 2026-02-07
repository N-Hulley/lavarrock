"""
Plugin configuration API.

Manages which plugins are enabled and their per-user settings.
Stores config in a JSON file at ~/.lavarrock/plugin_config.json
so it persists across container restarts (the volume is mounted).
"""

import json
import os
from pathlib import Path
from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/api/config", tags=["config"])

# ── Storage path ───────────────────────────────────
CONFIG_DIR = Path(os.environ.get("LAVARROCK_DATA_DIR", os.path.expanduser("~/.lavarrock")))
CONFIG_FILE = CONFIG_DIR / "plugin_config.json"

# ── Default plugin configuration ──────────────────
# These plugins are enabled out of the box.
DEFAULT_CONFIG: dict[str, Any] = {
    "plugins": [
        {"id": "lavarrock.ui", "enabled": True, "settings": {}},
        {"id": "lavarrock.wm", "enabled": True, "settings": {}},
        {"id": "lavarrock.tooltips", "enabled": True, "settings": {}},
        {"id": "lavarrock.header", "enabled": True, "settings": {}},
        {"id": "lavarrock.search-modal", "enabled": True, "settings": {}},
        {"id": "lavarrock.app-modal", "enabled": True, "settings": {}},
        {"id": "lavarrock.search-bar", "enabled": True, "settings": {}},
        {"id": "lavarrock.app-launcher", "enabled": True, "settings": {}},
        {"id": "lavarrock.json-tool", "enabled": True, "settings": {}},
        {"id": "lavarrock.theme-engine", "enabled": True, "settings": {}},
        {"id": "lavarrock.theme-manager", "enabled": True, "settings": {}},
        {"id": "lavarrock.theme-import", "enabled": True, "settings": {}},
        {"id": "lavarrock.layout-engine", "enabled": True, "settings": {}},
        {"id": "lavarrock.settings-engine", "enabled": True, "settings": {}},
        {"id": "lavarrock.layout-manager", "enabled": True, "settings": {}},
        {"id": "lavarrock.settings-manager", "enabled": True, "settings": {}},
    ],
}


def _read_config() -> dict[str, Any]:
    """Read config from disk, falling back to defaults."""
    if CONFIG_FILE.exists():
        try:
            return json.loads(CONFIG_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return DEFAULT_CONFIG.copy()


def _write_config(config: dict[str, Any]) -> None:
    """Persist config to disk."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(config, indent=2))


# ── Routes ─────────────────────────────────────────

@router.get("")
async def get_config():
    """Return the current plugin configuration."""
    return _read_config()


@router.put("")
async def put_config(body: dict[str, Any]):
    """Replace the entire plugin configuration."""
    _write_config(body)
    return body


@router.patch("/plugin/{plugin_id}")
async def patch_plugin(plugin_id: str, body: dict[str, Any]):
    """Update settings for a single plugin (merge)."""
    config = _read_config()
    for entry in config.get("plugins", []):
        if entry["id"] == plugin_id:
            entry["enabled"] = body.get("enabled", entry.get("enabled", True))
            entry["settings"] = {
                **entry.get("settings", {}),
                **body.get("settings", {}),
            }
            _write_config(config)
            return entry
    # Plugin not in config yet — add it
    new_entry = {
        "id": plugin_id,
        "enabled": body.get("enabled", True),
        "settings": body.get("settings", {}),
    }
    config.setdefault("plugins", []).append(new_entry)
    _write_config(config)
    return new_entry
