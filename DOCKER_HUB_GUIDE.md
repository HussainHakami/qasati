# Docker Hub Auto-Deploy Setup Guide

## Quick Setup (3 Steps)

### Step 1: Create Docker Hub Account

1. Visit [hub.docker.com](https://hub.docker.com)
2. Click **Sign Up** (it's free)
3. Verify your email address
4. Note your **username**

### Step 2: Create Access Token

1. Login to Docker Hub
2. Go to **Account Settings** → **Security**
3. Click **New Access Token**
4. Set:
   - Name: `github-actions`
   - Permissions: **Read, Write, Delete**
5. Click **Generate** and **COPY the token** (shown only once!)

### Step 3: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

| Secret Name | Value |
|-------------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | The access token you copied |

## How It Works

Once set up, every time you push code to the `main` or `master` branch:

1. GitHub Actions automatically builds your Docker image
2. Pushes it to Docker Hub with tags:
   - `yourname/qasati:main` (latest from main branch)
   - `yourname/qasati:sha-abc1234` (specific commit)
   - `yourname/qasati:v1.0.0` (if you push a version tag)

## Deploy Anywhere

After the image is on Docker Hub, deploy on any server:

```bash
# Pull and run
docker pull yourname/qasati:main
docker run -d -p 3000:3000 --env-file .env yourname/qasati:main
```

Or use docker-compose:
```yaml
services:
  qasati:
    image: yourname/qasati:main
    ports:
      - "3000:3000"
    env_file: .env
    restart: unless-stopped
```

## Using the Helper Script

Run the setup wizard:
```bash
./docker-hub-setup.sh
```

Or use the Docker manager:
```bash
./docker-start.sh prod     # Run locally (production)
./docker-start.sh dev      # Run locally (development)
./docker-start.sh push     # Push to Docker Hub
./docker-start.sh pull     # Pull from Docker Hub
./docker-start.sh stop     # Stop containers
./docker-start.sh logs     # View logs
./docker-start.sh status   # Check status
```

## File Structure

```
.
├── .github/
│   └── workflows/
│       └── docker-publish.yml    # GitHub Actions workflow
├── docker-start.sh               # Docker manager script
├── docker-hub-setup.sh           # Interactive setup wizard
├── docker-compose.yml            # Production compose
├── docker-compose.dev.yml        # Development compose
├── Dockerfile                    # Production Dockerfile
├── Dockerfile.dev                # Development Dockerfile
├── DOCKER_SETUP.md               # Detailed setup guide
└── DOCKER_HUB_GUIDE.md           # This file
```

## Troubleshooting

**GitHub Actions not triggering?**
- Make sure you pushed to `main` or `master` branch
- Check Actions tab in your GitHub repository

**Docker Hub login failing?**
- Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are correct
- Token must have "Read, Write, Delete" permissions

**Image not found?**
- Repository must be created on Docker Hub first
- Or use `docker push` manually the first time
