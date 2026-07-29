"""Smoke test: import every repaired multi_agents module and instantiate any
*Agent classes found, to confirm the fix actually works end to end (not just
that the regex substitutions look right)."""
import sys
import importlib
import traceback
from pathlib import Path

CONSTELLATION_ROOT = Path(r"C:\Users\kpasc\source\repos\constellation")
sys.path.insert(0, str(CONSTELLATION_ROOT))

MULTI_AGENTS = CONSTELLATION_ROOT / "kev" / "multi_agents"

TARGET_DIRS = [
    "dream_based_education_and_subconscious_learning",
    "education_and_knowledge",
    "education_policy_and_reform",
    "multispecies_education_and_cross_kin_learning",
    "mythic_education_and_archetypal_learning",
    "hr_and_talent_agents",
]

def main():
    ok, failed = 0, []
    for dirname in TARGET_DIRS:
        d = MULTI_AGENTS / dirname
        if not d.exists():
            continue
        for f in sorted(d.glob("*.py")):
            if f.stem.startswith("__"):
                continue
            module_name = f"kev.multi_agents.{dirname}.{f.stem}"
            try:
                mod = importlib.import_module(module_name)
                agent_classes = [
                    getattr(mod, n) for n in dir(mod)
                    if n.endswith("Agent") and isinstance(getattr(mod, n), type)
                    and getattr(mod, n).__module__ == module_name
                ]
                for cls in agent_classes:
                    cls()  # instantiate -- exercises __init__/_initialize_capabilities
                ok += 1
            except Exception as exc:  # noqa: BLE001
                failed.append((module_name, f"{type(exc).__name__}: {exc}"))

    print(f"OK: {ok}")
    print(f"FAILED: {len(failed)}")
    for name, err in failed[:25]:
        print(f"  {name}: {err}")

if __name__ == "__main__":
    main()
