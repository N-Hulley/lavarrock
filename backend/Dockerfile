FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pip dependencies
RUN pip install --upgrade pip

# Copy pyproject.toml
COPY pyproject.toml ./

# Install dependencies directly with pip based on pyproject.toml
RUN pip install \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    python-dotenv==1.0.0 \
    pydantic==2.5.0 \
    pydantic-settings==2.1.0 \
    ollama==0.1.0 \
    boto3==1.28.0 \
    sqlalchemy==2.0.0 \
    alembic==1.12.0 \
    websockets==12.0 \
    aiosqlite==0.19.0

# Copy source code
COPY backend/ ./

# Set Python path
ENV PYTHONPATH=/app:$PYTHONPATH

# Expose port
EXPOSE 8000

# Run app
CMD ["python", "-m", "uvicorn", "lavarrock.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
