#!/bin/bash
# Qasati Docker Manager
# Usage: ./docker-start.sh [prod|dev|pull|stop|logs|build|clean|status|push]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Docker Hub configuration
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-}"

print_banner() {
    echo -e "${CYAN}"
    echo "   ____        _        _ _"
    echo "  / __ \      | |      (_) |"
    echo " | |  | | __ _| |_ __ _ _| |_"
    echo " | |  | |/ _\` | __/ _\` | | __|"
    echo " | |__| | (_| | || (_| | | |_"
    echo "  \___\_\\__,_|\__\__,_|_|\__|"
    echo -e "${NC}"
}

show_help() {
    echo -e "${GREEN}Qasati Docker Manager${NC}"
    echo ""
    echo "Usage: ./docker-start.sh [command]"
    echo ""
    echo "Commands:"
    echo "  prod       Start in production mode (default)"
    echo "  dev        Start in development mode with hot-reload"
    echo "  pull       Pull latest image from Docker Hub and run"
    echo "  stop       Stop all Qasati containers"
    echo "  logs       Show logs from running containers"
    echo "  build      Rebuild Docker images"
    echo "  push       Build and push to Docker Hub"
    echo "  clean      Stop and remove all containers, volumes, and images"
    echo "  status     Show container status"
    echo ""
    echo "Examples:"
    echo "  ./docker-start.sh prod       # Build and run locally"
    echo "  ./docker-start.sh pull       # Pull from Docker Hub and run"
    echo "  ./docker-start.sh push       # Push to Docker Hub"
    echo "  ./docker-start.sh dev        # Run development mode"
    echo "  ./docker-start.sh stop       # Stop everything"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}Error: Docker daemon is not running${NC}"
        echo "Please start Docker Desktop first"
        exit 1
    fi
}

get_compose_cmd() {
    if docker compose version &> /dev/null 2>&1; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

start_prod() {
    echo -e "${GREEN}Starting Qasati in PRODUCTION mode...${NC}"
    COMPOSE=$(get_compose_cmd)
    $COMPOSE -f docker-compose.yml up -d --build
    echo ""
    echo -e "${GREEN}Qasati is running!${NC}"
    echo -e "  App URL: ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo "Commands:"
    echo "  Logs:  ./docker-start.sh logs"
    echo "  Stop:  ./docker-start.sh stop"
}

start_dev() {
    echo -e "${YELLOW}Starting Qasati in DEVELOPMENT mode...${NC}"
    COMPOSE=$(get_compose_cmd)
    $COMPOSE -f docker-compose.dev.yml up -d --build
    echo ""
    echo -e "${GREEN}Qasati dev server is running!${NC}"
    echo -e "  App URL: ${BLUE}http://localhost:3000${NC}"
}

pull_and_run() {
    if [ -z "$DOCKERHUB_USERNAME" ]; then
        echo -e "${YELLOW}Enter your Docker Hub username:${NC}"
        read DOCKERHUB_USERNAME
    fi

    echo -e "${GREEN}Pulling latest image from Docker Hub...${NC}"
    docker pull "$DOCKERHUB_USERNAME/qasati:main"
    
    echo -e "${GREEN}Starting container...${NC}"
    docker run -d \
        --name qasati-app \
        -p 3000:3000 \
        --env-file .env \
        --restart unless-stopped \
        "$DOCKERHUB_USERNAME/qasati:main"
    
    echo ""
    echo -e "${GREEN}Qasati is running from Docker Hub image!${NC}"
    echo -e "  App URL: ${BLUE}http://localhost:3000${NC}"
}

push_to_hub() {
    if [ -z "$DOCKERHUB_USERNAME" ]; then
        echo -e "${YELLOW}Enter your Docker Hub username:${NC}"
        read DOCKERHUB_USERNAME
    fi

    echo -e "${GREEN}Building image...${NC}"
    docker build -t "$DOCKERHUB_USERNAME/qasati:latest" .
    docker tag "$DOCKERHUB_USERNAME/qasati:latest" "$DOCKERHUB_USERNAME/qasati:main"
    
    echo -e "${GREEN}Pushing to Docker Hub...${NC}"
    docker push "$DOCKERHUB_USERNAME/qasati:latest"
    docker push "$DOCKERHUB_USERNAME/qasati:main"
    
    echo -e "${GREEN}Image pushed successfully!${NC}"
    echo -e "  URL: ${BLUE}https://hub.docker.com/r/$DOCKERHUB_USERNAME/qasati${NC}"
}

stop_all() {
    echo -e "${YELLOW}Stopping Qasati containers...${NC}"
    COMPOSE=$(get_compose_cmd)
    $COMPOSE -f docker-compose.yml down 2>/dev/null || true
    $COMPOSE -f docker-compose.dev.yml down 2>/dev/null || true
    docker stop qasati-app 2>/dev/null || true
    docker rm qasati-app 2>/dev/null || true
    echo -e "${GREEN}All Qasati containers stopped${NC}"
}

show_logs() {
    COMPOSE=$(get_compose_cmd)
    echo -e "${BLUE}Showing logs (press Ctrl+C to exit)...${NC}"
    $COMPOSE -f docker-compose.yml logs -f 2>/dev/null || docker logs qasati-app -f 2>/dev/null || true
}

rebuild() {
    echo -e "${YELLOW}Rebuilding Docker images...${NC}"
    COMPOSE=$(get_compose_cmd)
    $COMPOSE -f docker-compose.yml build --no-cache
    echo -e "${GREEN}Rebuild complete${NC}"
}

clean_all() {
    echo -e "${RED}WARNING: This will remove all Qasati containers, volumes, and images${NC}"
    read -p "Are you sure? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        COMPOSE=$(get_compose_cmd)
        $COMPOSE -f docker-compose.yml down -v --rmi all 2>/dev/null || true
        $COMPOSE -f docker-compose.dev.yml down -v --rmi all 2>/dev/null || true
        docker rmi "$DOCKERHUB_USERNAME/qasati" 2>/dev/null || true
        echo -e "${GREEN}Cleanup complete${NC}"
    else
        echo "Cancelled"
    fi
}

show_status() {
    echo -e "${BLUE}Qasati Container Status:${NC}"
    docker ps --filter "name=qasati" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No containers running"
}

# Main
print_banner
check_docker

cmd=${1:-prod}

case $cmd in
    prod|production)
        start_prod
        ;;
    dev|development)
        start_dev
        ;;
    pull)
        pull_and_run
        ;;
    push)
        push_to_hub
        ;;
    stop|down)
        stop_all
        ;;
    logs)
        show_logs
        ;;
    build|rebuild)
        rebuild
        ;;
    clean)
        clean_all
        ;;
    status|ps)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $cmd${NC}"
        show_help
        exit 1
        ;;
esac
