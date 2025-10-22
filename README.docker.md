# Docker Deployment Guide

This project supports two authentication modes with separate Docker Compose configurations for development and production.

## Available Configurations

| File | Mode | Environment | Features |
|------|------|-------------|----------|
| `docker-compose.canfar.yml` | CANFAR | Production | Nginx + CANFAR auth + CANFAR APIs |
| `docker-compose.oidc.yml` | OIDC/SRC | Production | Nginx + OIDC auth + SRC APIs |
| `docker-compose.dev.canfar.yml` | CANFAR | Development | Direct access + CANFAR auth + devtools |
| `docker-compose.dev.oidc.yml` | OIDC/SRC | Development | Direct access + OIDC auth + devtools |

**Note:** Example files (*.example.yml) are provided for GitHub. Copy and rename them to remove `.example` and configure with your credentials.

## Initial Setup

If you're setting up for the first time:

```bash
# Copy the example file you need
cp docker-compose.canfar.example.yml docker-compose.canfar.yml
# OR
cp docker-compose.oidc.example.yml docker-compose.oidc.yml

# Edit the file and add your credentials
# For OIDC mode, set these environment variables:
export NEXT_OIDC_CLIENT_ID="your-actual-client-id"
export NEXT_OIDC_CLIENT_SECRET="your-actual-client-secret"
export AUTH_SECRET="$(openssl rand -base64 32)"
```

## Quick Start

### CANFAR Mode (Production)

```bash
# Build and run
docker-compose -f docker-compose.canfar.yml build --no-cache
docker-compose -f docker-compose.canfar.yml up -d

# Access at http://localhost
# Login with CANFAR username/password
```

**Features:**
- ✓ CANFAR logo and branding
- ✓ Username/password authentication
- ✓ CANFAR navigation links
- ✓ Footer with CANFAR resources
- ✓ Uses CANFAR backend APIs (ws-uv.canfar.net)

### OIDC Mode (Production)

```bash
# Build and run (uses default SKA IAM credentials)
docker-compose -f docker-compose.oidc.yml build --no-cache
docker-compose -f docker-compose.oidc.yml up -d

# Access at http://localhost
# Login with OIDC (SKA IAM)

# Optional: Override OIDC credentials
export NEXT_OIDC_CLIENT_ID="your-client-id"
export NEXT_OIDC_CLIENT_SECRET="your-client-secret"
export AUTH_SECRET="$(openssl rand -base64 32)"
docker-compose -f docker-compose.oidc.yml up -d
```

**Features:**
- ✓ SRCNet logo and branding
- ✓ OIDC authentication (SKA IAM)
- ✓ No navigation links
- ✓ No footer
- ✓ Uses SRC backend APIs (src.canfar.net)

### Development Mode

#### CANFAR Development

```bash
docker-compose -f docker-compose.dev.canfar.yml build --no-cache
docker-compose -f docker-compose.dev.canfar.yml up -d

# Access at http://localhost:3000
```

#### OIDC Development

```bash
# Build and run (uses default SKA IAM credentials)
docker-compose -f docker-compose.dev.oidc.yml build --no-cache
docker-compose -f docker-compose.dev.oidc.yml up -d

# Access at http://localhost:3000

# Optional: Override OIDC credentials
export NEXT_OIDC_CLIENT_ID="your-client-id"
export NEXT_OIDC_CLIENT_SECRET="your-client-secret"
export AUTH_SECRET="$(openssl rand -base64 32)"
docker-compose -f docker-compose.dev.oidc.yml up -d
```

## Environment Variables

### OIDC Mode

Default SKA IAM credentials are pre-configured. Override if needed:

```bash
NEXT_OIDC_CLIENT_ID        # OIDC client ID (default: SKA IAM dev credentials)
NEXT_OIDC_CLIENT_SECRET    # OIDC client secret (default: SKA IAM dev credentials)
AUTH_SECRET                # NextAuth secret (default provided, change for production)
```

### Optional

```bash
NEXT_OIDC_URI             # OIDC provider URL (default: https://ska-iam.stfc.ac.uk/)
NEXT_OIDC_CALLBACK_URI    # Callback URL after auth
NEXT_OIDC_REDIRECT_URI    # OIDC redirect URL
```

## Common Commands

```bash
# Stop containers
docker-compose -f docker-compose.<mode>.yml down

# View logs
docker-compose -f docker-compose.<mode>.yml logs -f

# Rebuild after code changes
docker-compose -f docker-compose.<mode>.yml down
docker-compose -f docker-compose.<mode>.yml build --no-cache
docker-compose -f docker-compose.<mode>.yml up -d

# Remove volumes (clean start)
docker-compose -f docker-compose.<mode>.yml down -v
```

## Troubleshooting

### Wrong logo/mode showing

Make sure you're using the correct compose file and rebuild with `--no-cache`:

```bash
docker-compose -f docker-compose.<correct-mode>.yml down
docker-compose -f docker-compose.<correct-mode>.yml build --no-cache
docker-compose -f docker-compose.<correct-mode>.yml up -d
```

### OIDC login not working

1. Verify environment variables are set:
   ```bash
   echo $NEXT_OIDC_CLIENT_ID
   echo $AUTH_SECRET
   ```

2. Check container environment:
   ```bash
   docker exec science-portal-nextjs-oidc env | grep OIDC
   ```

### Can't access the application

- **Production mode**: Access at `http://localhost` (port 80)
- **Development mode**: Access at `http://localhost:3000`

## Port Mapping

| Mode | Container | Host Port | Container Port |
|------|-----------|-----------|----------------|
| Production | nginx | 80 | 80 |
| Production | nextjs | (internal) | 3000 |
| Development | nextjs | 3000 | 3000 |

## Legacy Files

The following files are kept for reference but should not be used:

- `docker-compose.yml` - Use `docker-compose.canfar.yml` instead
- `docker-compose.dev.yml` - Use `docker-compose.dev.oidc.yml` or `docker-compose.dev.canfar.yml` instead
