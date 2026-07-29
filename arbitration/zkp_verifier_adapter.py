# Kev ZKP Verifier Adapter
import requests
import logging

class ZKPVerifierAdapter:
    def __init__(self, verifier_url="http://priv-zkp:8081/verify"):
        self.verifier_url = verifier_url
        self.logger = logging.getLogger("ZKPVerifierAdapter")

    def verify_proof(self, proof_data: dict) -> bool:
        try:
            resp = requests.post(self.verifier_url, json=proof_data, timeout=5)
            resp.raise_for_status()
            result = resp.json()
            return result.get("valid", False)
        except Exception as e:
            self.logger.error(f"ZKP verification failed: {e}")
            return False
