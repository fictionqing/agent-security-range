"""Workspace environment plugin — wraps the existing synthetic office world."""
from __future__ import annotations

from typing import Any

from environments.workspace import WorkspaceToolRuntime, build_workspace
from plugins.protocols import EnvironmentPlugin, EpisodeContext

TOOL_HINT = (
    "Available tools (call with XML tool_call when needed):\n"
    "- inbox.search(query): search inbox, returns metadata + email ids\n"
    "- email.read(id): read full email body by id (e.g. mail-001)\n"
    "- drive.list(): list drive files\n"
    "- drive.read(name|path): read file content\n"
    "- email.send(to, subject, body, attachment): send email\n"
    "- contacts.list() / calendar.list()\n"
)


class WorkspaceEnvironment(EnvironmentPlugin):
    id = "workspace"
    name = "Workspace"
    status = "ready"

    def reset(self, ctx: EpisodeContext) -> Any:
        return build_workspace(
            inject_malicious=ctx.inject_malicious,
            injection_payload=ctx.injection_payload,
            scenario_id=ctx.scenario_id,
        )

    def make_tools(self, state: Any) -> WorkspaceToolRuntime:
        return WorkspaceToolRuntime(state)

    def tool_hint(self) -> str:
        return TOOL_HINT

    def tool_specs(self) -> list[dict[str, str]]:
        return list(WorkspaceToolRuntime.TOOL_SPECS)

    def snapshot(self, state: Any, *, include_bodies: bool = False) -> dict[str, Any]:
        return state.snapshot(include_bodies=include_bodies)
