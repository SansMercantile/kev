FROM python:3.11-slim

WORKDIR /app

# shared_resources/ is a sibling dependency (constellation/shared_resources).
# KEV only actually imports 3 top-level modules from it (the rest of that
# tree is unrelated - trading engine, heavy ML deps for other Constellation
# systems) so only those are copied in, keeping the image lean.
COPY kev/backend/requirements.txt ./kev/backend/requirements.txt

RUN pip install --no-cache-dir -r kev/backend/requirements.txt \
 && pip install --no-cache-dir boto3

COPY shared_resources/__init__.py ./shared_resources/__init__.py
COPY shared_resources/quantum_optimizer.py ./shared_resources/quantum_optimizer.py
COPY shared_resources/neuromorphic_processor.py ./shared_resources/neuromorphic_processor.py
COPY shared_resources/cloud_accelerator.py ./shared_resources/cloud_accelerator.py
COPY kev/backend/ ./kev/backend/
COPY kev/multi_agents/ ./kev/multi_agents/
COPY kev/virtual_school/ ./kev/virtual_school/

ENV AWS_REGION=us-east-1 \
    PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "kev.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
