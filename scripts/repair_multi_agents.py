"""
KEV multi_agents repair script.

Fixes the systemic template bug affecting agents generated from the
ROBUST_AGENT_BASE template (education_and_knowledge, education_policy_and_reform,
dream_based_education_and_subconscious_learning,
multispecies_education_and_cross_kin_learning,
mythic_education_and_archetypal_learning, hr_and_talent_agents):

  1. `from ROBUST_AGENT_BASE import ...` -> module never existed on sys.path.
     Fixed by vendoring robust_agent_base.py into kev/multi_agents/ and
     importing it as `kev.multi_agents.robust_agent_base`.
  2. `class XAgent(KevAgent):` -> KevAgent was never defined anywhere.
     Fixed by subclassing the real base class, RobustAgent.
  3. Missing `Dict`/`Any`/`datetime` imports used in method bodies but
     never imported.

Safe to re-run: skips files that are already fixed.
"""
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent  # .../kev
MULTI_AGENTS = REPO_ROOT / "multi_agents"

OLD_IMPORT_RE = re.compile(r"from ROBUST_AGENT_BASE import (.+)")
KEVAGENT_RE = re.compile(r"\(KevAgent\):")


def fix_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "from ROBUST_AGENT_BASE import" not in text:
        return False  # not a template-broken file

    original = text

    # 1. Fix the import to point at the vendored, importable module.
    text = OLD_IMPORT_RE.sub(
        r"from kev.multi_agents.robust_agent_base import \1", text
    )

    # 2. Fix the undefined base class.
    text = KEVAGENT_RE.sub("(RobustAgent):", text)

    # 3. Ensure Dict/Any/datetime are imported (method bodies use them
    #    freely but the template never imported them).
    needs_typing = ("Dict[" in text or "Any" in text) and (
        "from typing import" not in text
    )
    needs_datetime = "datetime.utcnow()" in text and (
        "from datetime import datetime" not in text
    )
    if needs_typing or needs_datetime:
        insert_after = text.index("\n", text.index("robust_agent_base import")) + 1
        extra_imports = ""
        if needs_typing:
            extra_imports += "from typing import Dict, Any, List, Optional\n"
        if needs_datetime:
            extra_imports += "from datetime import datetime\n"
        text = text[:insert_after] + extra_imports + text[insert_after:]

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    py_files = sorted(MULTI_AGENTS.rglob("*.py"))
    fixed, skipped, errors = [], 0, []

    for f in py_files:
        try:
            if fix_file(f):
                fixed.append(str(f.relative_to(REPO_ROOT)))
            else:
                skipped += 1
        except Exception as exc:  # noqa: BLE001
            errors.append((str(f.relative_to(REPO_ROOT)), str(exc)))

    print(f"Scanned {len(py_files)} files under multi_agents/")
    print(f"Fixed:   {len(fixed)}")
    print(f"Skipped (already fine / not template-broken): {skipped}")
    print(f"Errors:  {len(errors)}")
    for path, err in errors:
        print(f"  ERROR {path}: {err}")
    if fixed:
        print("\nFirst 10 fixed files:")
        for p in fixed[:10]:
            print(f"  {p}")


if __name__ == "__main__":
    main()
