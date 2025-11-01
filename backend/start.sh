#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Start the Celery worker in the background
# We use -P gevent for high-concurrency, non-blocking tasks
echo "--- Starting Celery Worker (in background) ---"
celery -A worker.celery_app worker --loglevel=info -P gevent &

# Start the Uvicorn API server in the foreground
# This is what Render will monitor for "health"
echo "--- Starting Uvicorn API (in foreground) ---"
uvicorn main:app --host 0.0.0.0 --port $PORT