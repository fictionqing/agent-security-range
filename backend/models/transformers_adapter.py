from __future__ import annotations

import json
import re
import threading
from typing import Any

from models.schemas import ChatMessage, ModelGenerateResult, ModelRecord, ToolCall


_TOOL_RE = re.compile(
    r"<tool_call>\s*(\{.*?\})\s*</tool_call>",
    re.DOTALL,
)
_FUNC_RE = re.compile(
    r"```(?:json)?\s*(\{\s*\"name\"\s*:.*?)\s*```",
    re.DOTALL,
)


def _parse_tool_calls(text: str) -> list[ToolCall]:
    calls: list[ToolCall] = []
    for match in _TOOL_RE.finditer(text or ""):
        try:
            obj = json.loads(match.group(1))
            name = obj.get("name") or obj.get("tool")
            args = obj.get("arguments") or obj.get("parameters") or {}
            if name:
                calls.append(ToolCall(name=str(name), arguments=dict(args)))
        except json.JSONDecodeError:
            continue
    if calls:
        return calls
    for match in _FUNC_RE.finditer(text or ""):
        try:
            obj = json.loads(match.group(1))
            name = obj.get("name") or obj.get("tool")
            args = obj.get("arguments") or obj.get("parameters") or {}
            if name:
                calls.append(ToolCall(name=str(name), arguments=dict(args)))
        except json.JSONDecodeError:
            continue
    return calls


class TransformersLocalAdapter:
    """Local HuggingFace Transformers adapter (CUDA preferred, CPU fallback)."""

    _lock = threading.Lock()
    _cache: dict[str, Any] = {}

    def __init__(self, record: ModelRecord) -> None:
        self.record = record
        if not record.path:
            raise RuntimeError(f"Model '{record.id}' has no local path")

    @property
    def model_id(self) -> str:
        return self.record.id

    def _load(self):
        key = self.record.path or self.record.id
        with self._lock:
            if key in self._cache:
                return self._cache[key]
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer

            path = self.record.path
            use_cuda = torch.cuda.is_available()
            dtype = torch.bfloat16 if use_cuda else torch.float32
            device_map = "cuda" if use_cuda else "cpu"
            print(
                f"[TransformersLocalAdapter] loading {path} "
                f"device_map={device_map} dtype={dtype}",
                flush=True,
            )
            tokenizer = AutoTokenizer.from_pretrained(path, trust_remote_code=True)
            model = AutoModelForCausalLM.from_pretrained(
                path,
                trust_remote_code=True,
                dtype=dtype,
                low_cpu_mem_usage=True,
                device_map=device_map,
            )
            model.eval()
            self._cache[key] = (tokenizer, model, use_cuda)
            return tokenizer, model, use_cuda

    def generate(
        self,
        messages: list[ChatMessage],
        *,
        tools: list[str] | None = None,
        temperature: float = 0.0,
        seed: int | None = None,
    ) -> ModelGenerateResult:
        import torch

        tokenizer, model, use_cuda = self._load()
        tools = tools or []

        system_extra = ""
        if tools:
            system_extra = (
                "\nYou can use tools. Available tools:\n"
                + "\n".join(f"- {t}" for t in tools)
                + "\nWhen you need a tool, reply ONLY with:\n"
                '<tool_call>{"name":"tool_name","arguments":{...}}</tool_call>\n'
                "Otherwise answer the user directly in Chinese."
            )

        chat: list[dict[str, str]] = []
        for m in messages:
            role = m.role if m.role in ("system", "user", "assistant") else "user"
            content = m.content
            if role == "tool":
                role = "user"
                content = f"[Tool Result]\n{content}"
            if role == "system" and system_extra and system_extra not in content:
                content = content + system_extra
            chat.append({"role": role, "content": content})

        if not any(c["role"] == "system" for c in chat) and system_extra:
            chat.insert(0, {"role": "system", "content": system_extra.strip()})

        if hasattr(tokenizer, "apply_chat_template"):
            prompt = tokenizer.apply_chat_template(
                chat, tokenize=False, add_generation_prompt=True
            )
        else:
            prompt = "\n".join(f"{c['role']}: {c['content']}" for c in chat) + "\nassistant:"

        inputs = tokenizer(prompt, return_tensors="pt")
        if use_cuda:
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
        if seed is not None:
            torch.manual_seed(seed)
            if use_cuda:
                torch.cuda.manual_seed_all(seed)

        with torch.no_grad():
            out = model.generate(
                **inputs,
                max_new_tokens=512,
                do_sample=temperature > 0,
                temperature=temperature if temperature > 0 else None,
                pad_token_id=getattr(tokenizer, "eos_token_id", None),
            )
        gen = out[0][inputs["input_ids"].shape[-1] :]
        text = tokenizer.decode(gen, skip_special_tokens=True).strip()
        # Qwen3 may emit thinking blocks — strip lightly
        if "</think>" in text:
            text = text.split("</think>")[-1].strip()

        tool_calls = _parse_tool_calls(text)
        if tool_calls:
            return ModelGenerateResult(
                content=None,
                tool_calls=tool_calls,
                finish_reason="tool_calls",
                raw={"adapter": "transformers_local", "text": text, "cuda": use_cuda},
            )
        return ModelGenerateResult(
            content=text,
            tool_calls=[],
            finish_reason="stop",
            raw={"adapter": "transformers_local", "cuda": use_cuda},
        )
