from __future__ import annotations

from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
CONFIGS_DIR = BACKEND_ROOT / "configs"
MODELS_CONFIG = CONFIGS_DIR / "models.yaml"
AGENTS_CONFIG = CONFIGS_DIR / "agents.yaml"
