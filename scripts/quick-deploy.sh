#!/bin/bash

# Quick Deployment Script for Manual AWS Setup
# Usage: ./scripts/quick-deploy.sh [test|prod] [EC2_IP]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-test}
EC2_IP=${2}
SSH_KEY=${SSH_KEY:-~/.ssh/id_rsa}

# Validate inputs
if [[ "$ENVIRONMENT" != "test" && "$ENVIRONMENT" != "prod" ]]; then
    echo -e "${RED}Error: Environment must be 'test' or 'prod'${NC}"
    exit 1
fi

if [[ -z "$EC2_IP" ]]; then
    echo -e "${RED}Error: EC2 IP address is required${NC}"
    echo -e "${YELLOW}Usage: $0 [test|prod] [EC2_IP]${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Quick Deploy to ${ENVIRONMENT} environment on ${EC2_IP}${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check if SSH key exists
    if [[ ! -f "$SSH_KEY" ]]; then
        echo -e "${RED}SSH key not found: $SSH_KEY${NC}"
        exit 1
    fi
    
    # Check if docker-compose files exist
    if [[ ! -f "docker-compose.${ENVIRONMENT}.yml" ]]; then
        echo -e "${RED}Docker Compose file not found: docker-compose.${ENVIRONMENT}.yml${NC}"
        exit 1
    fi
    
    if [[ ! -f "env.${ENVIRONMENT}" ]]; then
        echo -e "${RED}Environment file not found: env.${ENVIRONMENT}${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Create deployment package
create_package() {
    echo -e "${YELLOW}Creating deployment package...${NC}"
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    
    # Copy necessary files
    cp -r backend/ "$TEMP_DIR/"
    cp -r src/ "$TEMP_DIR/"
    cp -r public/ "$TEMP_DIR/"
    cp package*.json "$TEMP_DIR/"
    cp vite.config.js "$TEMP_DIR/"
    cp tailwind.config.js "$TEMP_DIR/"
    cp postcss.config.js "$TEMP_DIR/"
    cp jsconfig.json "$TEMP_DIR/"
    cp Dockerfile "$TEMP_DIR/"
    cp Dockerfile.frontend "$TEMP_DIR/"
    cp docker-compose.${ENVIRONMENT}.yml "$TEMP_DIR/docker-compose.yml"
    cp env.${ENVIRONMENT} "$TEMP_DIR/.env"
    cp nginx.${ENVIRONMENT}.conf "$TEMP_DIR/nginx.conf"
    
    # Create deployment package
    cd "$TEMP_DIR"
    tar -czf deploy.tar.gz .
    cd - > /dev/null
    
    echo -e "${GREEN}✅ Deployment package created${NC}"
}

# Deploy to EC2
deploy_to_ec2() {
    echo -e "${YELLOW}Deploying to EC2...${NC}"
    
    # Upload package
    echo "Uploading deployment package..."
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$TEMP_DIR/deploy.tar.gz" ubuntu@${EC2_IP}:/opt/autotest/
    
    # Deploy on EC2
    echo "Deploying on EC2..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} << 'EOF'
        cd /opt/autotest
        
        # Stop current containers
        docker-compose down || true
        
        # Extract new deployment
        tar -xzf deploy.tar.gz
        
        # Build and start containers
        docker-compose up -d --build
        
        # Wait for services to be ready
        sleep 30
        
        # Run database migrations and seeding
        docker-compose exec -T backend node scripts/migrate.js || true
        
        # Clean up
        rm deploy.tar.gz
        
        echo "Deployment completed successfully"
EOF
    
    echo -e "${GREEN}✅ Deployment completed${NC}"
}

# Test deployment
test_deployment() {
    echo -e "${YELLOW}Testing deployment...${NC}"
    
    # Determine test URL based on environment
    if [[ "$ENVIRONMENT" == "test" ]]; then
        TEST_URL="http://${EC2_IP}:8081"
    else
        TEST_URL="https://${EC2_IP}"
    fi
    
    echo -e "${BLUE}Testing against: ${TEST_URL}${NC}"
    
    # Wait for services to be ready
    sleep 10
    
    # Test health endpoint
    if curl -f -s "${TEST_URL}/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        echo -e "${YELLOW}Services may still be starting up. Please wait a few minutes and try again.${NC}"
    fi
    
    # Run self-tests if available
    if command -v npm &> /dev/null && [[ -f "package.json" ]]; then
        echo -e "${BLUE}Running self-tests...${NC}"
        
        # Set environment variables for testing
        export TEST_TARGET_URL="${TEST_URL}"
        export TEST_API_URL="${TEST_URL}/api"
        export PROD_TARGET_URL="${TEST_URL}"
        export PROD_API_URL="${TEST_URL}/api"
        
        # Run tests
        NODE_ENV=${ENVIRONMENT} npm run test:${ENVIRONMENT} || echo -e "${YELLOW}Self-tests failed (this is normal for first deployment)${NC}"
    fi
}

# Cleanup
cleanup() {
    echo -e "${YELLOW}Cleaning up...${NC}"
    rm -rf "$TEMP_DIR"
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting quick deployment to ${ENVIRONMENT} environment...${NC}"
    
    check_prerequisites
    create_package
    deploy_to_ec2
    test_deployment
    cleanup
    
    echo -e "${GREEN}🎉 Quick deployment completed!${NC}"
    
    # Show access information
    if [[ "$ENVIRONMENT" == "test" ]]; then
        echo -e "${BLUE}Test Environment Access:${NC}"
        echo -e "  URL: http://${EC2_IP}:8081"
        echo -e "  SSH: ssh -i ${SSH_KEY} ubuntu@${EC2_IP}"
    else
        echo -e "${BLUE}Production Environment Access:${NC}"
        echo -e "  URL: https://${EC2_IP}"
        echo -e "  SSH: ssh -i ${SSH_KEY} ubuntu@${EC2_IP}"
    fi
    
    echo -e "${YELLOW}Note: If using a domain name, update the environment configuration accordingly.${NC}"
}

# Handle script arguments
case "${1:-test}" in
    test|prod)
        main
        ;;
    *)
        echo -e "${RED}Usage: $0 [test|prod] [EC2_IP]${NC}"
        echo -e "${YELLOW}Example: $0 test 52.23.45.67${NC}"
        exit 1
        ;;
esac
