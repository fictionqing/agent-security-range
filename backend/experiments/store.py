"""JSON-file persistence for experiments + traces."""
from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DATA_ROOT = Path(__file__).resolve().parents[1] / "data" / "experiments"


def utcnow() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )


class ExperimentStore:
    def __init__(self, root: Path | None = None) -> None:
        self.root = Path(root) if root else DATA_ROOT
        self.root.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def _exp_dir(self, exp_id: str) -> Path:
        return self.root / exp_id

    def _meta_path(self, exp_id: str) -> Path:
        return self._exp_dir(exp_id) / "experiment.json"

    def _traces_dir(self, exp_id: str) -> Path:
        d = self._exp_dir(exp_id) / "traces"
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _write_json(self, path: Path, payload: Any) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(path)

    def save_experiment(self, record: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            record = dict(record)
            record["updated_at"] = utcnow()
            self._write_json(self._meta_path(record["id"]), record)
            return record

    def get_experiment(self, exp_id: str) -> dict[str, Any]:
        path = self._meta_path(exp_id)
        if not path.exists():
            raise KeyError(f"Unknown experiment: {exp_id}")
        return json.loads(path.read_text(encoding="utf-8"))

    def list_experiments(self) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        if not self.root.exists():
            return items
        for child in self.root.iterdir():
            meta = child / "experiment.json"
            if meta.is_file():
                try:
                    items.append(json.loads(meta.read_text(encoding="utf-8")))
                except json.JSONDecodeError:
                    continue
        items.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        return items

    def save_trace(self, exp_id: str, trace: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            tid = trace["id"]
            self._write_json(self._traces_dir(exp_id) / f"{tid}.json", trace)
            return trace

    def get_trace(self, trace_id: str) -> dict[str, Any]:
        # Prefer index lookup, then scan
        for exp in self.list_experiments():
            for summary in exp.get("traces") or []:
                if summary.get("id") == trace_id:
                    path = self._traces_dir(exp["id"]) / f"{trace_id}.json"
                    if path.exists():
                        return json.loads(path.read_text(encoding="utf-8"))
        for path in self.root.glob("*/traces/*.json"):
            if path.stem == trace_id:
                return json.loads(path.read_text(encoding="utf-8"))
        raise KeyError(f"Unknown trace: {trace_id}")

    def list_traces(self, experiment_id: str | None = None) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        experiments = (
            [self.get_experiment(experiment_id)]
            if experiment_id
            else self.list_experiments()
        )
        for exp in experiments:
            for summary in exp.get("traces") or []:
                items.append(
                    {
                        **summary,
                        "experiment_id": exp["id"],
                        "experiment_name": exp.get("name"),
                    }
                )
        items.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        return items

    def append_trace_summary(
        self, exp_id: str, summary: dict[str, Any]
    ) -> dict[str, Any]:
        with self._lock:
            record = json.loads(self._meta_path(exp_id).read_text(encoding="utf-8"))
            traces = list(record.get("traces") or [])
            traces.append(summary)
            record["traces"] = traces
            record["updated_at"] = utcnow()
            self._write_json(self._meta_path(exp_id), record)
            return record
