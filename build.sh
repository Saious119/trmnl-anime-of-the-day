#!/bin/bash

# Build and push the trmnl-anime-of-the-day image to the local k3s registry.
# Mirrors the pattern used by Discord-Bots/build-all.sh.
# The image name MUST match what /etc/rancher/k3s/registries.yaml trusts (localhost:5000).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REGISTRY="${REGISTRY:-localhost:5000}"
IMAGE_NAME="trmnl-anime-of-the-day"
IMAGE="${REGISTRY}/${IMAGE_NAME}:latest"

echo "[INFO] Building ${IMAGE}..."
# Build context is the repo root because the Dockerfile copies from server/.
docker build -t "${IMAGE}" "$SCRIPT_DIR"

echo "[INFO] Pushing ${IMAGE}..."
docker push "${IMAGE}"

echo "[INFO] Done. Now run ./deploy.sh (or restart the deployment to pull the new image)."
