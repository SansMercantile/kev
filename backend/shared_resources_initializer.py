import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

try:
    from shared_resources.quantum_optimizer import quantum_optimizer
except Exception as e:
    logger.warning(f"Quantum optimizer module unavailable: {e}")
    quantum_optimizer = None

try:
    from shared_resources.neuromorphic_processor import neuromorphic_processor
except Exception as e:
    logger.warning(f"Neuromorphic processor module unavailable: {e}")
    neuromorphic_processor = None

try:
    from shared_resources.cloud_accelerator import cloud_accelerator
except Exception as e:
    logger.warning(f"Cloud accelerator module unavailable: {e}")
    cloud_accelerator = None

_initialized_resources = {}


def initialize_shared_resources() -> Dict[str, Any]:
    """Initialize Constellation shared resources used by KEV."""
    logger.info("Initializing shared resources for KEV...")
    status = {}

    try:
        if quantum_optimizer is not None:
            status["quantum_optimizer"] = quantum_optimizer.optimize(
                "kev_startup", {"system": "kev"}, iterations=10
            )
        else:
            status["quantum_optimizer"] = {"status": "mock", "message": "fallback optimizer used"}
    except Exception as exc:
        status["quantum_optimizer"] = {"status": "error", "error": str(exc)}

    try:
        if neuromorphic_processor is not None:
            status["neuromorphic_processor"] = neuromorphic_processor.simulate(
                "startup", {"init": True}, precision="high"
            )
        else:
            status["neuromorphic_processor"] = {"status": "mock", "message": "fallback neuromorphic used"}
    except Exception as exc:
        status["neuromorphic_processor"] = {"status": "error", "error": str(exc)}

    try:
        if cloud_accelerator is not None:
            status["cloud_accelerator"] = cloud_accelerator.allocate("learning_grid", 4)
        else:
            status["cloud_accelerator"] = {"status": "mock", "message": "fallback cloud accelerator used"}
    except Exception as exc:
        status["cloud_accelerator"] = {"status": "error", "error": str(exc)}

    _initialized_resources.update(status)
    logger.info("Shared resources initialization complete.")
    return status


def get_shared_resources_status() -> Dict[str, Any]:
    """Return the last known shared resources initialization status."""
    return _initialized_resources.copy()
