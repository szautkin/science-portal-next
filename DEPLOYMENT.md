# Production Deployment Guide

This guide covers deploying the Science Portal Next.js application to Kubernetes using Helm charts.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Building the Docker Image](#building-the-docker-image)
3. [Managing Secrets](#managing-secrets)
4. [Deploying with Helm](#deploying-with-helm)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Rollback](#rollback)

## Prerequisites

### Required Tools

- Docker (v20.10+)
- Kubernetes cluster (v1.24+)
- kubectl (v1.24+)
- Helm (v3.10+)
- Access to container registry (Docker Hub, ECR, GCR, etc.)

### Cluster Requirements

- Ingress controller (nginx-ingress recommended)
- cert-manager (for TLS certificates)
- Metrics server (for HPA)
- Container registry access

## Building the Docker Image

### 1. Build Production Image

```bash
# Set your registry and version
export REGISTRY="your-registry.com"
export IMAGE_NAME="science-portal"
export VERSION="v0.1.0"

# Build the image
docker build \
  --platform linux/amd64 \
  -t ${REGISTRY}/${IMAGE_NAME}:${VERSION} \
  -t ${REGISTRY}/${IMAGE_NAME}:latest \
  --build-arg NEXT_PUBLIC_LOGIN_API=https://ws-cadc.canfar.net/ac \
  --build-arg NEXT_PUBLIC_SKAHA_API=https://ws-uv.canfar.net/skaha \
  --build-arg NEXT_PUBLIC_API_TIMEOUT=30000 \
  --build-arg NEXT_PUBLIC_USE_CANFAR=false \
  --build-arg NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false \
  -f Dockerfile \
  .

# Test the image locally
docker run -p 3000:3000 \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  ${REGISTRY}/${IMAGE_NAME}:${VERSION}

# Visit http://localhost:3000/api/health to verify
```

### 2. Push to Registry

```bash
# Authenticate to your registry
docker login ${REGISTRY}

# Push the image
docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}
docker push ${REGISTRY}/${IMAGE_NAME}:latest
```

### 3. Verify Image Security

```bash
# Scan for vulnerabilities (if using Docker Desktop)
docker scan ${REGISTRY}/${IMAGE_NAME}:${VERSION}

# Or use trivy
trivy image ${REGISTRY}/${IMAGE_NAME}:${VERSION}
```

## Managing Secrets

### 1. Generate Secrets

```bash
# Generate secure random strings
export AUTH_SECRET=$(openssl rand -base64 32)
echo "Generated AUTH_SECRET: ${AUTH_SECRET}"

# Your OIDC client secret (from OIDC provider)
export OIDC_CLIENT_SECRET="your-oidc-client-secret"
```

### 2. Create Kubernetes Secrets

```bash
# Set your namespace
export NAMESPACE="science-portal"

# Create namespace if it doesn't exist
kubectl create namespace ${NAMESPACE}

# Create the secrets
kubectl create secret generic science-portal-secrets \
  --namespace=${NAMESPACE} \
  --from-literal=auth-secret="${AUTH_SECRET}" \
  --from-literal=oidc-client-secret="${OIDC_CLIENT_SECRET}" \
  --dry-run=client -o yaml | kubectl apply -f -

# Verify (values should be hidden)
kubectl get secret science-portal-secrets -n ${NAMESPACE}
```

### 3. Secure Secret Storage (Recommended)

For production, consider using:
- **Sealed Secrets**: Encrypt secrets in Git
- **External Secrets Operator**: Sync from AWS Secrets Manager, Vault, etc.
- **SOPS**: Encrypt secrets with age or PGP

Example with External Secrets:

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace

# Create SecretStore (example for AWS Secrets Manager)
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: ${NAMESPACE}
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: science-portal-secrets
  namespace: ${NAMESPACE}
spec:
  secretStoreRef:
    name: aws-secrets
  target:
    name: science-portal-secrets
  data:
    - secretKey: auth-secret
      remoteRef:
        key: science-portal/auth-secret
    - secretKey: oidc-client-secret
      remoteRef:
        key: science-portal/oidc-client-secret
EOF
```

## Deploying with Helm

### 1. Customize Values

Create a `values-production.yaml`:

```yaml
# values-production.yaml
replicaCount: 3

image:
  repository: your-registry.com/science-portal
  tag: "v0.1.0"
  pullPolicy: IfNotPresent

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: science-portal.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: science-portal-tls
      hosts:
        - science-portal.yourdomain.com

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 200m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

# Update URLs for your domain
env:
  - name: NEXTAUTH_URL
    value: "https://science-portal.yourdomain.com"

oidc:
  uri: "https://ska-iam.stfc.ac.uk/"
  clientId: "your-client-id"
  callbackUri: "https://science-portal.yourdomain.com/science-portal"
  redirectUri: "https://science-portal.yourdomain.com/api/auth/callback/oidc"
  scope: "openid profile offline_access"

secrets:
  existingSecret: "science-portal-secrets"
```

### 2. Install/Upgrade with Helm

```bash
# Validate the chart
helm lint helm/science-portal -f values-production.yaml

# Dry run to see what will be deployed
helm upgrade --install science-portal ./helm/science-portal \
  --namespace ${NAMESPACE} \
  --create-namespace \
  --values values-production.yaml \
  --dry-run --debug

# Deploy to production
helm upgrade --install science-portal ./helm/science-portal \
  --namespace ${NAMESPACE} \
  --create-namespace \
  --values values-production.yaml \
  --wait \
  --timeout 5m

# Check deployment status
kubectl get all -n ${NAMESPACE}
```

### 3. Blue-Green or Canary Deployment (Advanced)

For zero-downtime deployments:

```bash
# Deploy new version alongside old
helm upgrade --install science-portal-canary ./helm/science-portal \
  --namespace ${NAMESPACE} \
  --values values-production.yaml \
  --set image.tag=v0.2.0 \
  --set replicaCount=1 \
  --set fullnameOverride=science-portal-canary

# Test the canary
kubectl port-forward -n ${NAMESPACE} deployment/science-portal-canary 8080:3000

# If successful, promote to production
helm upgrade science-portal ./helm/science-portal \
  --namespace ${NAMESPACE} \
  --values values-production.yaml \
  --set image.tag=v0.2.0 \
  --wait

# Clean up canary
helm delete science-portal-canary -n ${NAMESPACE}
```

## Post-Deployment Verification

### 1. Check Pod Status

```bash
# Verify all pods are running
kubectl get pods -n ${NAMESPACE}

# Check pod logs
kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/name=science-portal --tail=100

# Check events
kubectl get events -n ${NAMESPACE} --sort-by=.lastTimestamp
```

### 2. Verify Health Checks

```bash
# Port-forward to test locally
kubectl port-forward -n ${NAMESPACE} svc/science-portal 8080:80

# Test health endpoints
curl http://localhost:8080/api/health
curl http://localhost:8080/api/health/ready
curl http://localhost:8080/api/metrics
```

### 3. Test Ingress

```bash
# Get ingress details
kubectl get ingress -n ${NAMESPACE}

# Test HTTPS
curl -I https://science-portal.yourdomain.com

# Verify TLS certificate
openssl s_client -connect science-portal.yourdomain.com:443 -servername science-portal.yourdomain.com
```

### 4. Verify Autoscaling

```bash
# Check HPA status
kubectl get hpa -n ${NAMESPACE}

# Generate load to test scaling
kubectl run -n ${NAMESPACE} -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh
# Inside the pod:
while true; do wget -q -O- http://science-portal; done
```

## Monitoring

### 1. Setup Prometheus Monitoring

```yaml
# prometheus-servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: science-portal
  namespace: ${NAMESPACE}
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: science-portal
  endpoints:
    - port: http
      path: /api/metrics
      interval: 30s
```

Apply:
```bash
kubectl apply -f prometheus-servicemonitor.yaml
```

### 2. Setup Logging

Configure log aggregation (e.g., EFK stack, Loki):

```bash
# Logs are output as JSON to stdout/stderr
kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/name=science-portal -f | jq
```

### 3. Setup Alerts

Create AlertManager rules:

```yaml
groups:
  - name: science-portal
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"

      - alert: PodCrashLooping
        expr: kube_pod_container_status_restarts_total{namespace="science-portal"} > 5
        labels:
          severity: critical
```

## Troubleshooting

### Common Issues

#### Pods Not Starting

```bash
# Check pod status
kubectl describe pod -n ${NAMESPACE} <pod-name>

# Check logs
kubectl logs -n ${NAMESPACE} <pod-name> --previous

# Common causes:
# - Missing secrets
# - Image pull errors
# - Resource limits too low
# - Failed health checks
```

#### 502/503 Errors

```bash
# Check if pods are ready
kubectl get pods -n ${NAMESPACE}

# Check readiness probe
kubectl describe pod -n ${NAMESPACE} <pod-name> | grep -A 10 Readiness

# Test health endpoint directly
kubectl exec -n ${NAMESPACE} <pod-name> -- curl http://localhost:3000/api/health
```

#### Certificate Issues

```bash
# Check cert-manager
kubectl get certificate -n ${NAMESPACE}
kubectl describe certificate -n ${NAMESPACE} science-portal-tls

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager
```

## Rollback

### Helm Rollback

```bash
# List releases
helm history science-portal -n ${NAMESPACE}

# Rollback to previous version
helm rollback science-portal 0 -n ${NAMESPACE}

# Rollback to specific revision
helm rollback science-portal <revision> -n ${NAMESPACE}
```

### Kubernetes Rollback

```bash
# Check deployment history
kubectl rollout history deployment/science-portal -n ${NAMESPACE}

# Rollback
kubectl rollout undo deployment/science-portal -n ${NAMESPACE}

# Rollback to specific revision
kubectl rollout undo deployment/science-portal --to-revision=2 -n ${NAMESPACE}
```

## Maintenance

### Updating Dependencies

```bash
# Update base image monthly
docker pull node:22-alpine

# Rebuild with latest dependencies
npm update
npm audit fix

# Rebuild and redeploy
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment science-portal -n ${NAMESPACE} --replicas=5

# Or update Helm values
helm upgrade science-portal ./helm/science-portal \
  --namespace ${NAMESPACE} \
  --reuse-values \
  --set replicaCount=5
```

### Backup Strategy

- Secrets: Backup to secure external store
- Configuration: Store Helm values in Git (without secrets)
- Application data: If applicable, backup databases/storage

## Production Checklist

Before going live:

- [ ] Docker image built and pushed to registry
- [ ] All secrets created in Kubernetes
- [ ] Helm values customized for production
- [ ] DNS records configured
- [ ] TLS certificates provisioned
- [ ] Resource limits configured appropriately
- [ ] HPA configured and tested
- [ ] Monitoring and alerting set up
- [ ] Logging aggregation configured
- [ ] Backup strategy in place
- [ ] Rollback procedure tested
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Documentation updated

## Support

For issues or questions:
- Check logs: `kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/name=science-portal`
- Check events: `kubectl get events -n ${NAMESPACE}`
- Review [SECURITY.md](./SECURITY.md) for security issues
- Contact: devops@example.com
