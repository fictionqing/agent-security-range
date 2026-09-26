#!/usr/bin/env python3
"""Download models via ModelScope (recommended in CN) into /root/models."""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="Qwen/Qwen3-8B")
    parser.add_argument("--dir", default="/root/models/Qwen3-8B")
    args = parser.parse_args()
    target = Path(args.dir)
    target.mkdir(parents=True, exist_ok=True)

    from modelscope.hub.snapshot_download import snapshot_download

    print(f"[modelscope] {args.model} -> {target}", flush=True)
    cached = snapshot_download(args.model, cache_dir=str(target / ".ms_cache"))
    cached_path = Path(cached)
    # Copy/symlink essential files into flat target dir for Transformers
    for item in cached_path.iterdir():
        dest = target / item.name
        if dest.exists() or item.name.startswith("."):
            continue
        if item.is_dir():
            shutil.copytree(item, dest, dirs_exist_ok=True)
        else:
            shutil.copy2(item, dest)
    files = [p for p in target.rglob("*") if p.is_file() and ".ms_cache" not in str(p)]
    size = sum(p.stat().st_size for p in files)
    print(f"[done] files={len(files)} size={size/1e9:.2f}GB", flush=True)
    for name in ("config.json", "tokenizer.json", "model.safetensors.index.json"):
        print(f"  {'OK' if (target/name).exists() else 'MISSING'}: {name}")
    print(f"  shards: {len(list(target.glob('model-*.safetensors')))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
