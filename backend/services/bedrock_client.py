"""
Stateless Amazon Bedrock client for KEV agents.

Design goal: every call is fully self-contained (system prompt + message
history passed in by the caller each time). No conversation state is kept
in this process, so any number of Fargate tasks behind a load balancer can
serve the same request interchangeably.
"""

import json
import logging
from typing import List, Dict, Optional

import boto3
from botocore.exceptions import ClientError

from kev.backend.core.config import settings

logger = logging.getLogger(__name__)

_bedrock_runtime = None


def _client():
    """Lazily create the boto3 client (cheap to keep warm within one
    container, but never holds per-user state)."""
    global _bedrock_runtime
    if _bedrock_runtime is None:
        _bedrock_runtime = boto3.client("bedrock-runtime", region_name=settings.AWS_REGION)
    return _bedrock_runtime
    return _bedrock_runtime


def invoke_agent(
    system_prompt: str,
    messages: List[Dict[str, str]],
    model_id: Optional[str] = None,
    max_tokens: int = 1024,
    temperature: float = 0.4,
) -> str:
    """Invoke a Bedrock Anthropic model statelessly.

    Args:
        system_prompt: built by the caller from agent metadata
            (subject, specialization, role, education_level).
        messages: [{"role": "user"|"assistant", "content": "..."}, ...]
            The caller (frontend/session store) owns history - this
            function never persists it.
        model_id: defaults to settings.BEDROCK_DEFAULT_MODEL_ID.
        max_tokens / temperature: tunable per call.

    Returns:
        The assistant's text reply.
    """
    model = model_id or settings.BEDROCK_DEFAULT_MODEL_ID

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system_prompt,
        "messages": messages,
    }

    try:
        response = _client().invoke_model(
            modelId=model,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
        )
    except ClientError as exc:
        logger.error("Bedrock invoke_model failed for model=%s: %s", model, exc)
        raise

    payload = json.loads(response["body"].read())
    content_blocks = payload.get("content", [])
    text = "".join(block.get("text", "") for block in content_blocks if block.get("type") == "text")
    return text
