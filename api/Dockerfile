# Use Python 3.10 as the base image
FROM --platform=linux/amd64 python:3.10-slim

# Set working directory in the container
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    FLASK_APP=app.py \
    FLASK_ENV=production

ENV DD_API_KEY="YOUR_DATADOG_API_KEY"
ENV ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
ENV DD_SITE="datadoghq.com"
ENV DD_SERVICE="storytelling-primer-api"
ENV DD_ENV="dev"
ENV DD_VERSION="1.0.0"
ENV DD_LLMOBS_ENABLED=1
ENV DD_LLMOBS_AGENTLESS_ENABLED=1
ENV DD_LLMOBS_ML_APP="storytelling-primer-api"
ENV API_PORT=5000

# Copy requirements file first for better caching
COPY api/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY api .

# Expose port that Flask will run on
EXPOSE ${API_PORT}

# Command to run the application
# Use PORT environment variable provided by Cloud Run, default to 5000 for local development
# Note: 'sh -c' is required here to allow environment variable expansion for PORT.
# This can make debugging harder, but is necessary for dynamic port assignment.
CMD sh -c "ddtrace-run gunicorn --bind 0.0.0.0:\${API_PORT:-5000} app:app --log-file - --access-logfile -"