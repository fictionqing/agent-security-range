#!/usr/bin/env python3
"""Flatten ModelScope cache snapshot into /root/models/<Name>/ for Transformers."""
from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path


def flatten(model_dir: Path) -> int:
    snaps = list(model_dir.glob(".ms_cache/models/*/snapshots/*"))
    if not snaps:
        print(f"no snapshot under {model_dir}")
        return 1
    src = snaps[0]
    print(f"source={src}")
    count = 0
    for item in src.iterdir():
        if item.name.endswith(".incomplete"):
            print(f"  skip incomplete {item.name}")
            continue
        dest = model_dir / item.name
        if dest.exists():
            if dest.is_symlink() or dest.stat().st_size == item.stat().st_size:
                continue
        if dest.exists() or dest.is_symlink():
            dest.unlink()
        # hardlink if possible else copy
        try:
            os.link(item, dest)
        except OSError:
            if item.is_dir():
                shutil.copytree(item, dest, dirs_exist_ok=True)
            else:
                shutil.copy2(item, dest)
        count += 1
        print(f"  linked {item.name}")
    shards = list(model_dir.glob("model*.safetensors"))
    print(f"done linked={count} shards={len(shards)}")
    return 0 if shards or (model_dir / "model.safetensors").exists() else 2


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("dir")
    args = p.parse_args()
    return flatten(Path(args.dir))


if __name__ == "__main__":
    raise SystemExit(main())
