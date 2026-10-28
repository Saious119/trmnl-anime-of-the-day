#!/bin/bash

# Deploy trmnl-anime-of-the-day to the k3s cluster.
# Creates the namespace first, then applies the manifests.
# Run ./build.sh first so the image exists in the registry.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[INFO] Creating namespace..."
kubectl apply -f "$SCRIPT_DIR/k8s/namespace.yaml"

echo "[INFO] Applying manifests..."
kubectl apply -f "$SCRIPT_DIR/k8s/deployment.yaml"
kubectl apply -f "$SCRIPT_DIR/k8s/service.yaml"
kubectl apply -f "$SCRIPT_DIR/k8s/ingress.yaml"

echo "[INFO] Rolling out (forces a re-pull of :latest)..."
kubectl rollout restart deployment/trmnl-anime-of-the-day -n trmnl
kubectl rollout status deployment/trmnl-anime-of-the-day -n trmnl

echo ""
echo "[INFO] Done. Useful commands:"
echo "  kubectl get pods -n trmnl"
echo "  kubectl logs -n trmnl -l app=trmnl-anime-of-the-day -f"
