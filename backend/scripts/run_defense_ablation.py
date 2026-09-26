#!/usr/bin/env python3
"""Run Indirect PI × Defense ablation (sync, Mock-friendly)."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--agent", default="agent-mock-workspace")
    p.add_argument("--runs", type=int, default=3)
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()

    from models.registry import AgentRegistry, ModelRegistry
    from runtime.agent_runtime import AgentRuntime
    from experiments.manager import ABLATION_DEFENSES, ExperimentManager

    mr = ModelRegistry()
    ar = AgentRegistry(mr)
    rt = AgentRuntime(mr, ar)
    mgr = ExperimentManager(rt, mr, ar)
    created = []
    for did in ABLATION_DEFENSES:
        rec = mgr.create(
            name=f"Ablation {did}",
            agent_id=args.agent,
            attack_id="atk-indirect-pi",
            defense_id=did,
            runs=args.runs,
            seed=args.seed,
        )
        rec = mgr.start(rec["id"], background=False)
        created.append(
            {
                "id": rec["id"],
                "defense": rec.get("defense_name"),
                "defense_id": rec.get("defense_id"),
                "status": rec["status"],
                "asr": rec.get("asr"),
                "utility": rec.get("utility"),
            }
        )
        print(
            f"{did:20} status={rec['status']} asr={rec.get('asr')} util={rec.get('utility')}"
        )
    report = mgr.reports()
    print(json.dumps({"rows": created, "ablation": report.get("ablation")}, ensure_ascii=False, indent=2))
    return 0 if all(r["status"] == "done" for r in created) else 1


if __name__ == "__main__":
    raise SystemExit(main())
