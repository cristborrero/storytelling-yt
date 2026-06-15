# ── Stage 1: Build dependencies ──────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3-dev git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Preinstall cython/numpy/wheel to build pkuseg
RUN pip install --no-cache-dir numpy wheel cython

# Generate wheels for all dependencies
RUN pip wheel --no-cache-dir --wheel-dir=/app/wheels --no-build-isolation -r requirements.txt

# ── Stage 2: Final runtime image ─────────────────────
FROM python:3.11-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

# Copy built wheels from builder
COPY --from=builder /app/wheels /app/wheels
RUN pip install --no-cache-dir /app/wheels/* && rm -rf /app/wheels

COPY app ./app

RUN mkdir -p /app/db /app/storage/voices /app/storage/outputs

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
