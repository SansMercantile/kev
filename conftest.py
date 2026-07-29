import os
import sys

# Tests import `from kev.backend...` / `from kev.multi_agents...`, which only
# resolves if the *parent* of this kev/ directory (constellation/) is on
# sys.path. Mirrors what backend/main.py already does at runtime, so tests
# behave the same regardless of cwd or how pytest is invoked.
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_CONSTELLATION_ROOT = os.path.dirname(_THIS_DIR)
if _CONSTELLATION_ROOT not in sys.path:
    sys.path.insert(0, _CONSTELLATION_ROOT)
