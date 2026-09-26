#!/usr/bin/env python3
"""Create and run a Workspace experiment (CLI)."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--name", default="CLI Workspace Experiment")
    p.add_argument("--agent", default="agent-mock-workspace")
    p.add_argument("--attack", default="atk-indirect-pi")
    p.add_argument("--defense", default="def-baseline")
    p.add_argument("--runs", type=int, default=3)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--ablation", action="store_true", help="Run PI defense ablation sweep")
    args = p.parse_args()

    from models.registry import AgentRegistry, ModelRegistry
    from runtime.agent_runtime import AgentRuntime
    from experiments.manager import ExperimentManager

    mr = ModelRegistry()
    ar = AgentRegistry(mr)
    rt = AgentRuntime(mr, ar)
    mgr = ExperimentManager(rt, mr, ar)

    if args.ablation:
        from experiments.manager import ABLATION_DEFENSES

        rows = []
        for did in ABLATION_DEFENSES:
            rec = mgr.create(
                name=f"{args.name} · {did}",
                agent_id=args.agent,
                attack_id=args.attack,
                defense_id=did,
                runs=args.runs,
                seed=args.seed,
            )
            rec = mgr.start(rec["id"], background=False)
            rows.append(
                {
                    "defense_id": did,
                    "status": rec["status"],
                    "asr": rec.get("asr"),
                    "utility": rec.get("utility"),
                }
            )
        print(json.dumps(rows, ensure_ascii=False, indent=2))
        return 0 if all(r["status"] == "done" for r in rows) else 1

    rec = mgr.create(
        name=args.name,
        agent_id=args.agent,
        attack_id=args.attack,
        defense_id=args.defense,
        runs=args.runs,
        seed=args.seed,
    )
    rec = mgr.start(rec["id"], background=False)
    print(json.dumps(rec, ensure_ascii=False, indent=2))
    return 0 if rec.get("status") == "done" else 1


if __name__ == "__main__":
    raise SystemExit(main())
