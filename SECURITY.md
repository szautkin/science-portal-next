# Security Guidelines for Science Portal

## Overview

This document outlines security best practices for deploying and maintaining the Science Portal application.

## Secrets Management

### ⚠️ NEVER Commit Secrets to Version Control

**The following files should NEVER be committed:**
- `.env.local`
- `.env.production`
- `.env` (with real secrets)
- Any file containing `AUTH_SECRET`, `OIDC_CLIENT_SECRET`, or API keys
- Private keys (`.key`, `.pem` files)
- Certificates with private keys

### Environment Variables

#### Client-Side vs Server-Side

**IMPORTANT**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser!

- ✅ **Server-only** (secure): `AUTH_SECRET`, `OIDC_CLIENT_SECRET`, `LOGIN_API`
- ⚠️ **Public** (visible in browser): `NEXT_PUBLIC_SKAHA_API`, `NEXT_PUBLIC_OIDC_URI`

**Never put secrets in `NEXT_PUBLIC_` variables!**

### Kubernetes Secrets Management

#### Creating Secrets

```bash
# Generate a secure auth secret
AUTH_SECRET=$(openssl rand -base64 32)

# Create the secret in Kubernetes
kubectl create secret generic science-portal-secrets \
  --namespace=your-namespace \
  --from-literal=auth-secret="$AUTH_SECRET" \
  --from-literal=oidc-client-secret="your-oidc-secret"
```

#### Verifying Secrets

```bash
# List secrets (values are hidden)
kubectl get secrets -n your-namespace

# Describe secret (shows keys but not values)
kubectl describe secret science-portal-secrets -n your-namespace

# View secret values (use with caution!)
kubectl get secret science-portal-secrets -n your-namespace -o jsonpath='{.data.auth-secret}' | base64 -d
```

#### Rotating Secrets

1. Create new secret value
2. Update Kubernetes secret: `kubectl edit secret science-portal-secrets`
3. Restart pods to pick up new secret: `kubectl rollout restart deployment/science-portal`

## Docker Security

### Image Security

- ✅ Using multi-stage builds to minimize image size
- ✅ Running as non-root user (UID 1001)
- ✅ Using official Node.js Alpine images (smaller attack surface)
- ✅ No unnecessary build tools in production image

### Container Security

```dockerfile
# Security features in our Dockerfile:
USER nextjs  # Non-root user
HEALTHCHECK  # Container health monitoring
dumb-init    # Proper signal handling
```

## Kubernetes Security

### Pod Security

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  runAsGroup: 1001
  fsGroup: 1001
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: false  # Next.js needs /tmp
```

### Network Security

- ✅ Network policies restrict pod-to-pod communication
- ✅ Ingress controller with TLS termination
- ✅ Service mesh compatible (optional)

### RBAC (Role-Based Access Control)

Ensure service accounts have minimal permissions:

```bash
# Review service account permissions
kubectl auth can-i --list --as=system:serviceaccount:your-namespace:science-portal
```

## HTTPS/TLS

### Production Requirements

- ✅ Always use HTTPS in production
- ✅ Use cert-manager for automatic certificate management
- ✅ Enable HSTS (HTTP Strict Transport Security)

### Certificate Management

Using cert-manager (recommended):

```yaml
annotations:
  cert-manager.io/cluster-issuer: "letsencrypt-prod"
```

## Security Headers

Configured in nginx.conf:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Configured in Next.js (next.config.ts):

```typescript
poweredByHeader: false  // Don't expose Next.js version
```

## Authentication Security

### OIDC Configuration

- ✅ Use PKCE (Proof Key for Code Exchange) if supported
- ✅ Validate redirect URIs
- ✅ Use `httpOnly` cookies for session tokens
- ✅ Implement CSRF protection

### Session Management

- ✅ Secure session cookies (httpOnly, secure, sameSite)
- ✅ Reasonable session timeout
- ✅ Session invalidation on logout

## Monitoring & Auditing

### Security Monitoring

1. **Monitor failed authentication attempts**
   - Set up alerts for unusual patterns
   - Log all auth failures

2. **Container scanning**
   ```bash
   # Scan Docker images for vulnerabilities
   docker scan science-portal-nextjs:latest
   ```

3. **Dependency scanning**
   ```bash
   # Check for known vulnerabilities
   npm audit
   npm audit fix
   ```

### Audit Logging

Log important security events:
- Authentication success/failure
- Authorization failures
- Configuration changes
- Secret access

## Incident Response

### If Secrets Are Compromised

1. **Immediately rotate all secrets**
2. **Revoke compromised credentials**
3. **Review access logs**
4. **Notify security team**
5. **Update incident response documentation**

### If .env.local Was Committed

```bash
# Remove from git history (use with caution!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team!)
git push origin --force --all
```

Then **immediately rotate all exposed secrets!**

## Security Checklist

### Before Deployment

- [ ] All secrets stored in Kubernetes Secrets (not in code)
- [ ] `.env.local` and `.env.production` in `.gitignore`
- [ ] `AUTH_SECRET` generated with `openssl rand -base64 32`
- [ ] HTTPS/TLS configured with valid certificates
- [ ] Security headers enabled
- [ ] Container running as non-root user
- [ ] Network policies applied
- [ ] Resource limits configured
- [ ] RBAC policies in place
- [ ] Monitoring and alerting configured

### Regular Maintenance

- [ ] Update dependencies monthly (`npm audit`, `npm update`)
- [ ] Rotate secrets quarterly
- [ ] Review access logs
- [ ] Scan container images for vulnerabilities
- [ ] Review and update security policies
- [ ] Test incident response procedures

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [Docker Security](https://docs.docker.com/engine/security/)

## Reporting Security Issues

If you discover a security vulnerability, please email: security@example.com

**Do not create public GitHub issues for security vulnerabilities.**
