#!/usr/bin/env python3
"""End-to-end architecture verification for Agent Security Range MVP."""
from __future__ import annotations

import json
import os
import sys
import traceback
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def section(title: str) -> None:
    print("\n" + "=" * 64)
    print(title)
    print("=" * 64)


def main() -> int:
    from models.registry import AgentRegistry, ModelRegistry
    from models.adapters import build_adapter
    from models.schemas import ChatMessage, RuntimeRunRequest
    from runtime.agent_runtime import AgentRuntime

    failures: list[str] = []
    notes: list[str] = []

    section("1. Disk inventory — Qwen3-8B / Qwen3-0.6B")
    for name, expect_shards in (("Qwen3-8B", 5), ("Qwen3-0.6B", 0)):
        root = Path("/root/models") / name
        cfg = root / "config.json"
        shards = list(root.glob("model-*.safetensors"))
        single = root / "model.safetensors"
        size = sum(p.stat().st_size for p in root.rglob("*") if p.is_file())
        print(f"  {root}: {size/1e9:.2f} GB")
        print(f"    config.json: {'OK' if cfg.exists() else 'MISSING'}")
        print(f"    shards: {len(shards)} single_file={single.exists()}")
        if not cfg.exists():
            failures.append(f"{name} config missing")
        if name == "Qwen3-8B" and len(shards) < 5:
            failures.append(f"Qwen3-8B expected 5 shards, got {len(shards)}")
        if name == "Qwen3-0.6B" and not single.exists():
            failures.append("Qwen3-0.6B model.safetensors missing")

    section("2. Model Registry")
    mr = ModelRegistry()
    for m in mr.list_models():
        print(
            f"  {m.id:22} backend={m.backend.value:12} "
            f"status={m.status.value:10} weights={m.weights_present}"
        )
    q8 = mr.get("qwen3-8b")
    q06 = mr.get("qwen3-0.6b")
    if not q8.weights_present:
        failures.append("Registry: qwen3-8b weights_present=False")
    if not q06.weights_present:
        failures.append("Registry: qwen3-0.6b weights_present=False")

    section("3. Tokenizer / Config load (transformers, no full weights)")
    try:
        from transformers import AutoConfig, AutoTokenizer

        for path in (q8.path, q06.path):
            cfg = AutoConfig.from_pretrained(path, trust_remote_code=True)
            tok = AutoTokenizer.from_pretrained(path, trust_remote_code=True)
            print(f"  {path}: model_type={cfg.model_type} vocab={len(tok)}")
    except Exception as e:
        failures.append(f"tokenizer/config load failed: {e}")
        traceback.print_exc()

    section("4. Mock Adapter → Agent Runtime")
    ar = AgentRegistry(mr)
    rt = AgentRuntime(mr, ar)
    try:
        res = rt.run(
            RuntimeRunRequest(
                agent_id="agent-mock-workspace",
                user_task="帮我找到 Alice 最近发给我的报告。",
            )
        )
        print(f"  status={res.status} steps={len(res.steps)}")
        if res.status != "completed":
            failures.append("Mock runtime not completed")
        res_pi = rt.run(
            RuntimeRunRequest(
                agent_id="agent-mock-workspace",
                user_task="帮我找到 Alice 的报告",
            ),
            inject_malicious=True,
        )
        print(f"  PI status={res_pi.status}")
        if res_pi.status != "compromised":
            failures.append("Injection path did not mark compromised")
    except Exception as e:
        failures.append(f"Mock runtime failed: {e}")
        traceback.print_exc()

    section("5. TransformersLocalAdapter factory + optional CPU generate")
    import torch

    mem = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / (1024**3)
    print(f"  torch={torch.__version__} host_RAM≈{mem:.1f}GB")
    try:
        adapter = build_adapter(q06, mr)
        print(f"  build_adapter(qwen3-0.6b) OK → {type(adapter).__name__}")
    except Exception as e:
        failures.append(f"build_adapter 0.6b failed: {e}")
        adapter = None

    if adapter is not None and mem >= 3.5:
        try:
            out = adapter.generate(
                [
                    ChatMessage(role="system", content="用中文简短回答。"),
                    ChatMessage(role="user", content="1+1等于几？只回答数字。"),
                ],
                temperature=0.0,
                seed=42,
            )
            print(f"  0.6B generate: {out.content!r}")
            notes.append("cpu_generate_0.6b=ok")
        except Exception as e:
            notes.append(f"cpu_generate_0.6b_failed={e}")
            print(f"  0.6B generate SKIP/FAIL: {e}")
    else:
        notes.append("cpu_generate_0.6b=skipped_low_ram")
        print("  SKIP full 0.6B load (host RAM < 3.5GB — would OOM)")

    try:
        adapter8 = build_adapter(q8, mr)
        print(f"  build_adapter(qwen3-8b) OK → {type(adapter8).__name__}")
        notes.append("adapter_factory_8b=ok")
    except Exception as e:
        failures.append(f"build_adapter 8b failed: {e}")

    if mem < 24:
        notes.append("qwen3_8b_inference=deferred_to_vllm_or_a100")
        print("  SKIP Qwen3-8B weight load (need ~24GB+ RAM or A100/vLLM)")

    section("6. Summary")
    report = {
        "qwen3_8b_path": q8.path,
        "qwen3_8b_weights": q8.weights_present,
        "qwen3_0.6b_weights": q06.weights_present,
        "torch": torch.__version__,
        "notes": notes,
        "failures": failures,
        "ok": len(failures) == 0,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    out = BACKEND / "scripts" / "architecture_verify_report.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {out}")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
