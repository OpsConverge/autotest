#!/bin/bash

# Base44 Test Management App - Local Development Quick Start
# This script helps you get the application running locally quickly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="Base44 Test Management App"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_warn "Node.js is not installed. You'll need it for manual setup."
    fi
    
    log_info "Prerequisites check passed"
}

check_docker_running() {
    log_step "Checking if Docker is running..."
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    log_info "Docker is running"
}

start_services() {
    log_step "Starting services with Docker Compose..."
    
    # Check if docker-compose.yml exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "docker-compose.yml not found in current directory"
        exit 1
    fi
    
    # Start services
    log_info "Starting PostgreSQL, Backend, and Frontend..."
    docker-compose up -d
    
    log_info "Services started successfully!"
}

wait_for_services() {
    log_step "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    log_info "Waiting for PostgreSQL..."
    until docker-compose exec -T postgres pg_isready -U base44_user -d base44_test_management; do
        sleep 2
    done
    
    # Wait for Backend
    log_info "Waiting for Backend API..."
    until curl -f http://localhost:4000/health 2>/dev/null || curl -f http://localhost:4000/api/health 2>/dev/null; do
        sleep 2
    done
    
    # Wait for Frontend
    log_info "Waiting for Frontend..."
    until curl -f http://localhost:3000 2>/dev/null; do
        sleep 2
    done
    
    log_info "All services are ready!"
}

show_status() {
    log_step "Checking service status..."
    
    echo ""
    echo "📊 Service Status:"
    echo "=================="
    
    # Check PostgreSQL
    if docker-compose ps postgres | grep -q "Up"; then
        echo "✅ PostgreSQL: Running (localhost:5432)"
    else
        echo "❌ PostgreSQL: Not running"
    fi
    
    # Check Backend
    if curl -f http://localhost:4000/health 2>/dev/null || curl -f http://localhost:4000/api/health 2>/dev/null; then
        echo "✅ Backend API: Running (http://localhost:4000)"
    else
        echo "❌ Backend API: Not running"
    fi
    
    # Check Frontend
    if curl -f http://localhost:3000 2>/dev/null; then
        echo "✅ Frontend: Running (http://localhost:3000)"
    else
        echo "❌ Frontend: Not running"
    fi
}

show_urls() {
    echo ""
    echo "🌐 Application URLs:"
    echo "==================="
    echo "Frontend:     http://localhost:3000"
    echo "Backend API:  http://localhost:4000"
    echo "Database:     localhost:5432"
    echo ""
    echo "📝 Database Credentials:"
    echo "======================="
    echo "Database:     base44_test_management"
    echo "Username:     base44_user"
    echo "Password:     base44_password"
    echo ""
}

show_commands() {
    echo "🔧 Useful Commands:"
    echo "=================="
    echo "View logs:           docker-compose logs -f"
    echo "View backend logs:   docker-compose logs -f backend"
    echo "View frontend logs:  docker-compose logs -f frontend"
    echo "Stop services:       docker-compose down"
    echo "Restart services:    docker-compose restart"
    echo "Reset database:      docker-compose down -v && docker-compose up -d"
    echo ""
}

check_existing_services() {
    log_step "Checking for existing services..."
    
    if docker-compose ps | grep -q "Up"; then
        log_warn "Services are already running!"
        show_status
        show_urls
        show_commands
        exit 0
    fi
}

main() {
    echo ""
    echo "🚀 $PROJECT_NAME - Local Development Quick Start"
    echo "================================================"
    echo ""
    
    check_prerequisites
    check_docker_running
    check_existing_services
    start_services
    wait_for_services
    show_status
    show_urls
    show_commands
    
    log_info "🎉 Application is ready! Open http://localhost:3000 in your browser."
    echo ""
}

# Run main function
main "$@"
