# Docker Hub Setup Guide

## Step 1: Create Docker Hub Account

1. Go to [hub.docker.com](https://hub.docker.com)
2. Click **Sign Up** (free)
3. Verify your email
4. Remember your **username**

## Step 2: Create Access Token

1. Login to Docker Hub
2. Click your profile → **Account Settings**
3. Go to **Security**
4. Click **New Access Token**
5. Name: `github-actions`
6. Permissions: **Read, Write, Delete**
7. Click **Generate**
8. **COPY THE TOKEN IMMEDIATELY** (shown only once)

## Step 3: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

| Secret Name | Value |
|-------------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | The token you copied |

## Step 4: Create Repository on Docker Hub

1. Go to Docker Hub → **Repositories**
2. Click **Create repository**
3. Name: `qasati`
4. Visibility: **Public** (free) or **Private**
5. Click **Create**

## Step 5: Push Code to GitHub

```bash
git add .
git commit -m "Add Docker Hub auto-deploy"
git push origin main
```

The GitHub Action will automatically:
- Build your Docker image
- Push it to Docker Hub
- Tag it with branch name and commit SHA

## Step 6: Pull and Run from Docker Hub

On any server with Docker:

```bash
# Pull the image
docker pull YOUR_USERNAME/qasati:main

# Run it
docker run -d -p 3000:3000 \
  --env-file .env \
  YOUR_USERNAME/qasati:main
```

Or use docker-compose:

```bash
docker-compose pull
docker-compose up -d
```

## Image Tags

| Tag Format | Example | When |
|-----------|---------|------|
| Branch | `main` | Every push to main |
| Version | `v1.2.3` | When you push a tag |
| Short SHA | `abc1234` | Every commit |

## Manual Build & Push (if needed)

```bash
# Build
docker build -t YOUR_USERNAME/qasati:latest .

# Login
docker login

# Push
docker push YOUR_USERNAME/qasati:latest
```

## Check Your Image on Docker Hub

Visit: `https://hub.docker.com/r/YOUR_USERNAME/qasati`
