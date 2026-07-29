"""
Kev sandbox: test/demo config and mocks for all cloud, LLM, and API dependencies.
Mirrors Priv/Mpeti sandbox/test patterns. Safe for CI, local, and demo use.
"""
import os

class SandboxConfig:
    GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "kev-sandbox-project")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "kev-sandbox-key")
    # Add more as needed for Kev

class LLMClient:
    def __init__(self, *args, **kwargs):
        pass
    def explain(self, input_text: str) -> str:
        return f"[Kev Sandbox LLMClient] {input_text}"
