# Docker Deployment Guide

This guide explains how to build and run the Science Portal using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- `.env.local` file with your configuration (copy from `.env.example`)
- Node.js 22 (used in Docker images)

## Quick Start

### Option 1: Development (Next.js only, port 3000)

```bash
# Build and run
docker-compose -f docker-compose.dev.yml up --build

# Access at: http://localhost:3000/science-portal
```

### Option 2: Production (with Nginx, port 80)

```bash
# Build and run
docker-compose up --build

# Access at: http://localhost/science-portal
```

## Detailed Instructions

### 1. Configure Environment Variables

Before building, ensure you have a `.env.local` file with all required variables:

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your configuration
nano .env.local
```

**Important variables for Docker:**
- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXT_OIDC_CLIENT_ID` - Your OIDC client ID
- `NEXT_OIDC_CLIENT_SECRET` - Your OIDC client secret

### 2. Build the Docker Images

#### Build Next.js only:
```bash
docker build -t science-portal:latest .
```

#### Build with Nginx:
```bash
docker build -f Dockerfile.nginx -t science-portal-nginx:latest .
```

### 3. Run with Docker Compose

#### Development mode (no Nginx):
```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

#### Production mode (with Nginx):
```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 4. Run with Docker (without Compose)

#### Run Next.js container:
```bash
docker run -d \
  --name science-portal \
  -p 3000:3000 \
  --env-file .env.local \
  science-portal:latest
```

#### Run with Nginx:
```bash
# Run Next.js
docker run -d \
  --name science-portal-nextjs \
  --network science-portal-net \
  --env-file .env.local \
  science-portal:latest

# Run Nginx
docker run -d \
  --name science-portal-nginx \
  --network science-portal-net \
  -p 80:80 \
  science-portal-nginx:latest
```

## Environment Variables in Docker

### Docker Compose

Environment variables can be set in three ways (in order of precedence):

1. **Command line:**
   ```bash
   NEXT_OIDC_CLIENT_ID=your-id docker-compose up
   ```

2. **`.env` file in project root:**
   ```bash
   # .env
   NEXT_OIDC_CLIENT_ID=your-id
   ```

3. **`env_file` in docker-compose.yml:**
   ```yaml
   services:
     nextjs:
       env_file:
         - .env.local
   ```

### Production Deployment

For production, it's recommended to:

1. Use secrets management (e.g., Docker Swarm secrets, Kubernetes secrets)
2. Set environment variables via orchestration platform
3. Never commit `.env.local` to version control

Example with Docker Secrets:

```bash
# Create secrets
echo "your-secret-key" | docker secret create auth_secret -
echo "your-client-id" | docker secret create oidc_client_id -
echo "your-client-secret" | docker secret create oidc_client_secret -
```

## Configuration Options

### CANFAR Mode (Traditional Auth)

```bash
# Set in .env.local or docker-compose.yml
NEXT_USE_CANFAR=true
NEXT_PUBLIC_USE_CANFAR=true
```

Uses:
- `SKAHA_API=https://ws-uv.canfar.net/skaha`
- `SERVICE_STORAGE_API=https://ws-uv.canfar.net/arc/nodes/home/`

### OIDC Mode (SKA IAM)

```bash
# Set in .env.local or docker-compose.yml
NEXT_USE_CANFAR=false
NEXT_PUBLIC_USE_CANFAR=false
```

Uses:
- `SRC_SKAHA_API=https://src.canfar.net/skaha`
- `SRC_CAVERN_API=https://src.canfar.net/cavern`

## Nginx Configuration

The Nginx configuration (`nginx.conf`) provides:

- **Reverse proxy** to Next.js application
- **Static file caching** for performance
- **Security headers** (X-Frame-Options, etc.)
- **Gzip compression** for text content
- **WebSocket support** for hot reload (dev mode)

To customize Nginx:

1. Edit `nginx.conf`
2. Rebuild the Nginx container:
   ```bash
   docker-compose up --build nginx
   ```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs science-portal-nextjs

# Check if port is already in use
lsof -i :3000  # or :80 for nginx
```

### Environment variables not working

```bash
# Verify variables are set in container
docker exec science-portal-nextjs env | grep NEXT_

# Check if .env.local is being read
docker-compose -f docker-compose.dev.yml config
```

### NextAuth UntrustedHost error

Make sure these are set:
```bash
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost  # or your domain
```

### Can't connect to external APIs

```bash
# Test network connectivity from container
docker exec science-portal-nextjs wget -O- https://src.canfar.net/skaha
```

## Performance Optimization

### Multi-stage builds

The Dockerfile uses multi-stage builds to minimize image size:

- **deps stage**: Installs production dependencies
- **builder stage**: Builds the Next.js app
- **runner stage**: Final minimal image with only built artifacts

### Image size comparison

```bash
# Check image sizes
docker images | grep science-portal

# Typical sizes:
# science-portal:latest         ~200MB (Next.js standalone)
# science-portal-nginx:latest   ~50MB  (Nginx alpine)
```

## Health Checks

Add health checks to docker-compose.yml:

```yaml
services:
  nextjs:
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Monitoring

```bash
# Resource usage
docker stats

# Logs in real-time
docker-compose logs -f --tail=100

# Container inspection
docker inspect science-portal-nextjs
```

## Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (warning: deletes data)
docker-compose down -v

# Remove images
docker rmi science-portal:latest science-portal-nginx:latest

# Clean up everything (use with caution)
docker system prune -a
```

## Production Checklist

Before deploying to production:

- [ ] Generate secure `AUTH_SECRET` (min 32 chars)
- [ ] Set `AUTH_TRUST_HOST=false`
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Update OIDC redirect URLs to production domain
- [ ] Enable HTTPS (use reverse proxy or load balancer)
- [ ] Set up proper logging and monitoring
- [ ] Configure resource limits in docker-compose.yml
- [ ] Set up automated backups
- [ ] Test authentication flow end-to-end
- [ ] Review Nginx security headers
- [ ] Set up health checks
