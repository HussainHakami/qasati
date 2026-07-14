#!/bin/bash
# Docker Hub Setup Script for Qasati
# Usage: ./docker-hub-setup.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_banner() {
    echo -e "${CYAN}"
    echo "=========================================="
    echo "  Docker Hub Auto-Deploy Setup"
    echo "=========================================="
    echo -e "${NC}"
}

print_step() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Step $1: $2${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

print_info() {
    echo -e "${BLUE}ℹ  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓  $1${NC}"
}

print_error() {
    echo -e "${RED}✗  $1${NC}"
}

# ==================== STEP 1 ====================
step1_docker_account() {
    print_step "1" "Docker Hub Account"
    
    echo "You need a Docker Hub account to continue."
    echo ""
    
    read -p "Do you already have a Docker Hub account? (y/n): " has_account
    
    if [[ $has_account =~ ^[Nn]$ ]]; then
        print_info "Opening Docker Hub signup page..."
        sleep 2
        
        # Try to open browser
        if command -v xdg-open &> /dev/null; then
            xdg-open "https://hub.docker.com/signup" 2>/dev/null || true
        elif command -v open &> /dev/null; then
            open "https://hub.docker.com/signup" 2>/dev/null || true
        fi
        
        echo ""
        echo "Please sign up at: https://hub.docker.com/signup"
        echo "Then come back and press Enter to continue..."
        read
    fi
    
    echo ""
    read -p "Enter your Docker Hub username: " docker_username
    
    if [ -z "$docker_username" ]; then
        print_error "Username cannot be empty"
        exit 1
    fi
    
    export DOCKER_USERNAME=$docker_username
    print_success "Docker Hub username set: $docker_username"
}

# ==================== STEP 2 ====================
step2_access_token() {
    print_step "2" "Docker Hub Access Token"
    
    print_warning "You need to create an Access Token on Docker Hub"
    print_info "Opening Docker Hub Security settings..."
    sleep 2
    
    # Try to open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://hub.docker.com/settings/security" 2>/dev/null || true
    elif command -v open &> /dev/null; then
        open "https://hub.docker.com/settings/security" 2>/dev/null || true
    fi
    
    echo ""
    echo "Follow these steps on Docker Hub:"
    echo "  1. Click 'New Access Token'"
    echo "  2. Name: github-actions"
    echo "  3. Permissions: Read, Write, Delete"
    echo "  4. Click 'Generate'"
    echo "  5. COPY THE TOKEN (shown only once)"
    echo ""
    read -s -p "Paste your Docker Hub Access Token here: " docker_token
    echo ""
    
    if [ -z "$docker_token" ]; then
        print_error "Token cannot be empty"
        exit 1
    fi
    
    export DOCKER_TOKEN=$docker_token
    print_success "Access token received"
}

# ==================== STEP 3 ====================
step3_create_repo() {
    print_step "3" "Create Docker Hub Repository"
    
    print_info "Creating repository 'qasati' on Docker Hub..."
    
    # Try to create repo using Docker Hub API
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: JWT ${DOCKER_TOKEN}" \
        -d "{\"name\":\"qasati\",\"is_private\":false}" \
        "https://hub.docker.com/v2/repositories/" 2>/dev/null || echo "000")
    
    if [ "$response" == "201" ] || [ "$response" == "409" ]; then
        print_success "Repository 'qasati' is ready"
    else
        print_warning "Could not create repository automatically"
        print_info "Please create it manually at:"
        echo "  https://hub.docker.com/repository/create"
        echo "  Name: qasati"
        read -p "Press Enter when done..."
    fi
}

# ==================== STEP 4 ====================
step4_github_secrets() {
    print_step "4" "Configure GitHub Secrets"
    
    print_warning "You need to add secrets to your GitHub repository"
    
    # Check if this is a git repo
    if [ ! -d ".git" ]; then
        print_error "This is not a git repository"
        print_info "Initializing git repository..."
        git init
        git add .
        git commit -m "Initial commit"
    fi
    
    # Get GitHub repo URL
    github_url=$(git remote get-url origin 2>/dev/null || echo "")
    
    if [ -z "$github_url" ]; then
        print_warning "No GitHub remote configured"
        echo ""
        read -p "Enter your GitHub repository URL (e.g., https://github.com/username/repo): " github_url
        
        if [ ! -z "$github_url" ]; then
            git remote add origin "$github_url"
        fi
    fi
    
    print_info "Your GitHub repository: $github_url"
    echo ""
    echo "Add these secrets to your GitHub repository:"
    echo ""
    echo "  1. Go to: $github_url/settings/secrets/actions"
    echo "  2. Click 'New repository secret'"
    echo ""
    echo -e "  ${CYAN}Secret 1:${NC}"
    echo "     Name: DOCKERHUB_USERNAME"
    echo "     Value: $DOCKER_USERNAME"
    echo ""
    echo -e "  ${CYAN}Secret 2:${NC}"
    echo "     Name: DOCKERHUB_TOKEN"
    echo "     Value: [your access token]"
    echo ""
    
    # Try to open the secrets page
    if [ ! -z "$github_url" ]; then
        secrets_url="${github_url%.git}/settings/secrets/actions"
        print_info "Opening GitHub secrets page..."
        sleep 1
        
        if command -v xdg-open &> /dev/null; then
            xdg-open "$secrets_url" 2>/dev/null || true
        elif command -v open &> /dev/null; then
            open "$secrets_url" 2>/dev/null || true
        fi
    fi
    
    read -p "Press Enter after adding both secrets..."
}

# ==================== STEP 5 ====================
step5_update_files() {
    print_step "5" "Update Configuration Files"
    
    # Update docker-publish.yml with the username
    if [ -f ".github/workflows/docker-publish.yml" ]; then
        sed -i.bak "s|YOUR_USERNAME|$DOCKER_USERNAME|g" .github/workflows/docker-publish.yml
        rm -f .github/workflows/docker-publish.yml.bak
        print_success "Updated GitHub Actions workflow"
    fi
    
    # Update docker-compose.yml
    if [ -f "docker-compose.yml" ]; then
        # Add image reference
        sed -i.bak "s|container_name: qasati-app|container_name: qasati-app\n    image: $DOCKER_USERNAME/qasati:main|g" docker-compose.yml
        rm -f docker-compose.yml.bak
        print_success "Updated docker-compose.yml"
    fi
    
    # Update DOCKER_SETUP.md
    if [ -f "DOCKER_SETUP.md" ]; then
        sed -i.bak "s|YOUR_USERNAME|$DOCKER_USERNAME|g" DOCKER_SETUP.md
        rm -f DOCKER_SETUP.md.bak
    fi
}

# ==================== STEP 6 ====================
step6_test_deploy() {
    print_step "6" "Test Deployment"
    
    echo "Choose deployment method:"
    echo "  1) Push to GitHub (auto-deploy via GitHub Actions)"
    echo "  2) Manual Docker Hub push"
    echo ""
    read -p "Select option (1 or 2): " deploy_option
    
    if [ "$deploy_option" == "1" ]; then
        print_info "Pushing to GitHub..."
        
        git add .
        git commit -m "Add Docker Hub auto-deploy configuration" || true
        git push origin main || git push origin master || true
        
        print_success "Code pushed to GitHub"
        print_info "GitHub Actions will build and push automatically"
        print_info "Check progress at: $github_url/actions"
        
    elif [ "$deploy_option" == "2" ]; then
        print_info "Building and pushing manually..."
        
        echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USERNAME" --password-stdin
        docker build -t "$DOCKER_USERNAME/qasati:latest" .
        docker push "$DOCKER_USERNAME/qasati:latest"
        
        print_success "Image pushed to Docker Hub"
    fi
}

# ==================== SUMMARY ====================
print_summary() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${CYAN}Docker Hub:${NC}"
    echo "  Username: $DOCKER_USERNAME"
    echo "  Repository: $DOCKER_USERNAME/qasati"
    echo "  URL: https://hub.docker.com/r/$DOCKER_USERNAME/qasati"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "  1. Check GitHub Actions: $github_url/actions"
    echo "  2. After successful build, pull with:"
    echo "     docker pull $DOCKER_USERNAME/qasati:main"
    echo ""
    echo -e "${CYAN}To deploy on any server:${NC}"
    echo "  docker pull $DOCKER_USERNAME/qasati:main"
    echo "  docker run -d -p 3000:3000 --env-file .env $DOCKER_USERNAME/qasati:main"
    echo ""
}

# ==================== MAIN ====================
main() {
    print_banner
    
    print_info "This script will help you set up Docker Hub auto-deploy"
    echo ""
    read -p "Press Enter to start or Ctrl+C to cancel..."
    
    step1_docker_account
    step2_access_token
    step3_create_repo
    step4_github_secrets
    step5_update_files
    step6_test_deploy
    print_summary
}

# Run main function
main
