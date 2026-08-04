"""
Real multi_agents/ catalog - indexes the 1,000+ actual tutor-agent files on
disk (statically, via ast, without importing every module) and lazily
imports + instantiates only the one agent a given request actually needs.

This is what makes the agents usable on a stateless server: nothing here
holds state between requests. Each call to get_agent() does a fresh
import + instantiate, and the caller (the API endpoint) discards it after
use - safe to run on any number of Fargate tasks.
"""

import ast
import importlib
import logging
import os
from dataclasses import dataclass
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Root of the real multi_agents/ tree, and the dotted-path prefix used to
# import from it (mirrors how existing agent files already import
# `from kev.multi_agents.base_tutor_agent import ...`).
_MULTI_AGENTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "multi_agents")
_IMPORT_PREFIX = "kev.multi_agents"

# Files that are infrastructure, not actual tutor agents - never indexed.
_SKIP_FILES = {
    "base_tutor_agent.py", "robust_agent_base.py", "learning_development_agent.py",
    "tutor_generator.py", "create_all_tutors.py", "create_remaining_tutors.py",
    "create_tutors_simple.py", "__init__.py",
}


@dataclass
class AgentEntry:
    tutor_id: str
    subject: str
    specialization: str
    tutor_type: str
    education_levels: List[str]
    module_path: str   # dotted path, e.g. kev.multi_agents.mathematics.high_school.tutors.algebra_2_tutors
    class_name: str    # e.g. Algebra2Tutor


def _extract_str_or_attr(node) -> Optional[str]:
    """Read a plain string constant, or an Enum-style Attribute (X.Y -> 'Y')."""
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _extract_init_kwargs(class_node: ast.ClassDef) -> Optional[Dict]:
    """Find `super().__init__(tutor_id=..., subject=..., ...)` inside
    this class's __init__ and pull out the literal keyword values."""
    for item in class_node.body:
        if not (isinstance(item, ast.FunctionDef) and item.name == "__init__"):
            continue
        for stmt in ast.walk(item):
            if not isinstance(stmt, ast.Call):
                continue
            func = stmt.func
            if not (isinstance(func, ast.Attribute) and func.attr == "__init__"
                    and isinstance(func.value, ast.Call)
                    and isinstance(func.value.func, ast.Name) and func.value.func.id == "super"):
                continue

            kwargs = {}
            for kw in stmt.keywords:
                if kw.arg == "education_levels" and isinstance(kw.value, ast.List):
                    kwargs["education_levels"] = [
                        _extract_str_or_attr(el) for el in kw.value.elts if _extract_str_or_attr(el)
                    ]
                else:
                    val = _extract_str_or_attr(kw.value)
                    if val is not None:
                        kwargs[kw.arg] = val
            return kwargs
    return None


def _module_path_for(file_path: str) -> str:
    rel = os.path.relpath(file_path, os.path.dirname(_MULTI_AGENTS_DIR))
    dotted = os.path.splitext(rel)[0].replace(os.sep, ".").replace("/", ".")
    return dotted


_INDEX: Dict[str, AgentEntry] = {}
_BUILT = False


def build_index(force: bool = False) -> int:
    """Statically scan multi_agents/ and populate the in-memory catalog.
    Cheap: parses source text with ast, never imports/executes anything.
    Safe to call once at startup; returns the number of agents indexed."""
    global _BUILT
    if _BUILT and not force:
        return len(_INDEX)

    _INDEX.clear()
    for root, _dirs, files in os.walk(_MULTI_AGENTS_DIR):
        if "__pycache__" in root:
            continue
        for filename in files:
            if not filename.endswith(".py") or filename in _SKIP_FILES:
                continue
            file_path = os.path.join(root, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    tree = ast.parse(f.read(), filename=file_path)
            except (SyntaxError, UnicodeDecodeError) as exc:
                logger.warning(f"Skipping unparsable agent file {file_path}: {exc}")
                continue

            for node in ast.walk(tree):
                if not isinstance(node, ast.ClassDef):
                    continue
                kwargs = _extract_init_kwargs(node)
                if not kwargs or "tutor_id" not in kwargs:
                    continue

                entry = AgentEntry(
                    tutor_id=kwargs["tutor_id"],
                    subject=kwargs.get("subject", "General"),
                    specialization=kwargs.get("specialization", node.name),
                    tutor_type=kwargs.get("tutor_type", "tutor"),
                    education_levels=kwargs.get("education_levels", []),
                    module_path=_module_path_for(file_path),
                    class_name=node.name,
                )
                _INDEX[entry.tutor_id] = entry

    _BUILT = True
    logger.info(f"Indexed {len(_INDEX)} real multi_agents/ tutor agents")
    return len(_INDEX)


def list_agents(subject: Optional[str] = None, education_level: Optional[str] = None,
                 tutor_type: Optional[str] = None) -> List[AgentEntry]:
    """Metadata-only listing from the index - no imports happen here."""
    build_index()
    entries = list(_INDEX.values())
    if subject:
        entries = [e for e in entries if e.subject.lower() == subject.lower()]
    if education_level:
        entries = [e for e in entries if education_level.lower() in [l.lower() for l in e.education_levels]]
    if tutor_type:
        entries = [e for e in entries if e.tutor_type.lower() == tutor_type.lower()]
    return entries


def get_entry(tutor_id: str) -> Optional[AgentEntry]:
    build_index()
    return _INDEX.get(tutor_id)


def instantiate_agent(tutor_id: str):
    """Lazily import the ONE module this agent lives in and instantiate
    it fresh. Nothing is cached across calls - every request gets a new,
    stateless instance, which is what lets this run safely on any Fargate
    task without shared in-memory state between requests."""
    entry = get_entry(tutor_id)
    if entry is None:
        return None
    module = importlib.import_module(entry.module_path)
    agent_class = getattr(module, entry.class_name)
    return agent_class()
