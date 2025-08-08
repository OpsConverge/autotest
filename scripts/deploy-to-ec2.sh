#!/bin/bash

# Base44 Test Management App - EC2 Deployment Script
# This script deploys the application to an EC2 instance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EC2_HOST="${EC2_HOST:-}"
EC2_USER="${EC2_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-~/.ssh/base44-deployer-key.pem}"
APP_DIR="/opt/base44-app"

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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if [ -z "$EC2_HOST" ]; then
        log_error "EC2_HOST environment variable is not set"
        exit 1
    fi
    
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH key not found at $SSH_KEY"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

test_ssh_connection() {
    log_info "Testing SSH connection to $EC2_HOST..."
    
    if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o BatchMode=yes "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'"; then
        log_error "Failed to connect to EC2 instance"
        exit 1
    fi
    
    log_info "SSH connection successful"
}

deploy_application() {
    log_info "Deploying application to EC2..."
    
    # Create deployment script
    cat > /tmp/deploy.sh << 'EOF'
#!/bin/bash
set -e

cd /opt/base44-app

# Pull latest images
log_info "Pulling latest Docker images..."
docker-compose pull

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose down

# Start containers
log_info "Starting containers..."
docker-compose up -d

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 30

# Run database migrations
log_info "Running database migrations..."
docker-compose exec -T backend npx prisma migrate deploy || true

# Health check
log_info "Performing health check..."
if curl -f http://localhost/health; then
    echo "✅ Application deployed successfully!"
else
    echo "❌ Health check failed"
    exit 1
fi
EOF

    # Copy and execute deployment script
    scp -i "$SSH_KEY" /tmp/deploy.sh "$EC2_USER@$EC2_HOST:/tmp/"
    ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" "chmod +x /tmp/deploy.sh && /tmp/deploy.sh"
    
    # Cleanup
    rm -f /tmp/deploy.sh
    ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" "rm -f /tmp/deploy.sh"
}

check_application_status() {
    log_info "Checking application status..."
    
    # Check if containers are running
    ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" "cd $APP_DIR && docker-compose ps"
    
    # Check application health
    if ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" "curl -f http://localhost/health"; then
        log_info "✅ Application is healthy"
    else
        log_error "❌ Application health check failed"
        exit 1
    fi
}

show_logs() {
    log_info "Recent application logs:"
    ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" "cd $APP_DIR && docker-compose logs --tail=50"
}

main() {
    log_info "Starting EC2 deployment..."
    
    check_prerequisites
    test_ssh_connection
    deploy_application
    check_application_status
    show_logs
    
    log_info "🎉 Deployment completed successfully!"
    log_info "Application URL: http://$EC2_HOST"
}

# Run main function
main "$@"
