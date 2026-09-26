#!/usr/bin/env python3
"""Download Qwen models into /root/models (no GPU required)."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Prefer China mirror when not overridden
os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")


def download(repo_id: str, local_dir: Path) -> Path:
    from huggingface_hub import snapshot_download

    local_dir.mkdir(parents=True, exist_ok=True)
    print(f"[download] {repo_id} -> {local_dir}", flush=True)
    path = snapshot_download(
        repo_id=repo_id,
        local_dir=str(local_dir),
        local_dir_use_symlinks=False,
        resume_download=True,
        max_workers=4,
    )
    print(f"[done] {path}", flush=True)
    return Path(path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--repo",
        default="Qwen/Qwen3-8B",
        help="HF repo id",
    )
    parser.add_argument(
        "--dir",
        default="/root/models/Qwen3-8B",
        help="Local directory",
    )
    args = parser.parse_args()
    download(args.repo, Path(args.dir))
    # quick inventory
    root = Path(args.dir)
    files = sorted(root.rglob("*"))
    total = sum(f.stat().st_size for f in files if f.is_file())
    print(f"[inventory] files={sum(1 for f in files if f.is_file())} size={total/1e9:.2f} GB")
    for name in ("config.json", "tokenizer.json", "model.safetensors.index.json"):
        p = root / name
        print(f"  {'OK' if p.exists() else 'MISSING'}: {name}")
    shards = list(root.glob("model-*.safetensors"))
    print(f"  shards: {len(shards)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
