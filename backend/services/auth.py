"""
Auth0 JWT verification for KEV's protected endpoints.

Stateless by design (fits the rest of this backend): every request
verifies its own bearer token against Auth0's public JWKS, cached
in-process. No session state is kept here - safe on any number of
Fargate tasks.
"""

import logging
import time
from typing import Dict, Optional

import requests
from fastapi import HTTPException, Request
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

AUTH0_DOMAIN = "dev-b78ozdt6veybztac.us.auth0.com"
AUTH0_AUDIENCE = "https://api.kev.sansmercantile.com"
AUTH0_ISSUER = f"https://{AUTH0_DOMAIN}/"
JWKS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"

_jwks_cache: Optional[Dict] = None
_jwks_cached_at: float = 0
_JWKS_TTL_SECONDS = 3600


def _get_jwks() -> Dict:
    global _jwks_cache, _jwks_cached_at
    now = time.time()
    if _jwks_cache is None or (now - _jwks_cached_at) > _JWKS_TTL_SECONDS:
        response = requests.get(JWKS_URL, timeout=5)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cached_at = now
    return _jwks_cache


def _get_signing_key(token: str) -> Dict:
    unverified_header = jwt.get_unverified_header(token)
    jwks = _get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == unverified_header.get("kid"):
            return key
    raise HTTPException(status_code=401, detail="Unable to find matching signing key")


def verify_token(token: str) -> Dict:
    """Verify an Auth0-issued RS256 JWT. Raises HTTPException(401) on any
    failure (expired, wrong audience/issuer, bad signature, malformed)."""
    try:
        signing_key = _get_signing_key(token)
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=AUTH0_ISSUER,
        )
        return payload
    except JWTError as exc:
        logger.info(f"JWT verification failed: {exc}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_auth(request: Request) -> Dict:
    """FastAPI dependency - use as `Depends(require_auth)` on any route
    that should require a signed-in KEV user."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth_header[len("Bearer "):]
    return verify_token(token)
