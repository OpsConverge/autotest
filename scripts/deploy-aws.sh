#!/bin/bash

# AWS Deployment Script for AutoTest SaaS Platform
# Usage: ./scripts/deploy-aws.sh [test|prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-test}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="autotest"

# Validate environment
if [[ "$ENVIRONMENT" != "test" && "$ENVIRONMENT" != "prod" ]]; then
    echo -e "${RED}Error: Environment must be 'test' or 'prod'${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Deploying AutoTest to ${ENVIRONMENT} environment${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}Terraform is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}AWS credentials not configured. Please run 'aws configure' first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Build Docker images
build_images() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    
    # Build backend image
    echo "Building backend image..."
    docker build -f Dockerfile -t ${PROJECT_NAME}-backend:latest .
    
    # Build frontend image
    echo "Building frontend image..."
    docker build -f Dockerfile.frontend -t ${PROJECT_NAME}-frontend:latest .
    
    echo -e "${GREEN}✅ Docker images built successfully${NC}"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    echo -e "${YELLOW}Deploying infrastructure with Terraform...${NC}"
    
    cd terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    echo "Planning Terraform deployment..."
    terraform plan -var-file="terraform.${ENVIRONMENT}.tfvars" -out=tfplan
    
    # Apply deployment
    echo "Applying Terraform deployment..."
    terraform apply tfplan
    
    # Get outputs
    TEST_IP=$(terraform output -raw test_instance_ip 2>/dev/null || echo "")
    PROD_IP=$(terraform output -raw prod_instance_ip 2>/dev/null || echo "")
    
    cd ..
    
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
    
    if [[ "$ENVIRONMENT" == "test" && -n "$TEST_IP" ]]; then
        echo -e "${BLUE}Test environment IP: ${TEST_IP}${NC}"
    elif [[ "$ENVIRONMENT" == "prod" && -n "$PROD_IP" ]]; then
        echo -e "${BLUE}Production environment IP: ${PROD_IP}${NC}"
    fi
}

# Deploy application to EC2
deploy_application() {
    echo -e "${YELLOW}Deploying application to EC2...${NC}"
    
    # Get instance IP based on environment
    cd terraform
    if [[ "$ENVIRONMENT" == "test" ]]; then
        INSTANCE_IP=$(terraform output -raw test_instance_ip)
    else
        INSTANCE_IP=$(terraform output -raw prod_instance_ip)
    fi
    cd ..
    
    if [[ -z "$INSTANCE_IP" ]]; then
        echo -e "${RED}Could not get instance IP from Terraform output${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Deploying to instance: ${INSTANCE_IP}${NC}"
    
    # Create deployment package
    echo "Creating deployment package..."
    tar -czf deploy.tar.gz \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='.env' \
        --exclude='terraform' \
        --exclude='deploy.tar.gz' \
        .
    
    # Upload to EC2
    echo "Uploading to EC2..."
    scp -i ~/.ssh/autotest-key.pem -o StrictHostKeyChecking=no deploy.tar.gz ubuntu@${INSTANCE_IP}:/opt/autotest/
    
    # Deploy on EC2
    echo "Deploying on EC2..."
    ssh -i ~/.ssh/autotest-key.pem -o StrictHostKeyChecking=no ubuntu@${INSTANCE_IP} << 'EOF'
        cd /opt/autotest
        
        # Stop current containers
        docker-compose down || true
        
        # Extract new deployment
        tar -xzf deploy.tar.gz
        
        # Update environment file
        if [ -f ".env.${ENVIRONMENT}" ]; then
            cp .env.${ENVIRONMENT} .env
        fi
        
        # Build and start containers
        docker-compose build --no-cache
        docker-compose up -d
        
        # Wait for services to be ready
        sleep 30
        
        # Run database migrations
        docker-compose exec -T backend npx prisma migrate deploy || true
        
        # Create test users if needed
        docker-compose exec -T backend node scripts/seed.js || true
        
        # Clean up
        rm deploy.tar.gz
        
        echo "Deployment completed successfully"
EOF
    
    # Clean up local deployment package
    rm deploy.tar.gz
    
    echo -e "${GREEN}✅ Application deployed successfully${NC}"
}

# Run tests against deployed environment
run_tests() {
    echo -e "${YELLOW}Running tests against ${ENVIRONMENT} environment...${NC}"
    
    # Get instance IP
    cd terraform
    if [[ "$ENVIRONMENT" == "test" ]]; then
        INSTANCE_IP=$(terraform output -raw test_instance_ip)
        TEST_URL="http://${INSTANCE_IP}:8081"
    else
        INSTANCE_IP=$(terraform output -raw prod_instance_ip)
        TEST_URL="https://${INSTANCE_IP}"
    fi
    cd ..
    
    echo -e "${BLUE}Testing against: ${TEST_URL}${NC}"
    
    # Run tests using our test runner
    NODE_ENV=${ENVIRONMENT} npm run test:${ENVIRONMENT}
    
    echo -e "${GREEN}✅ Tests completed${NC}"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment to ${ENVIRONMENT} environment...${NC}"
    
    check_prerequisites
    build_images
    deploy_infrastructure
    deploy_application
    run_tests
    
    echo -e "${GREEN}🎉 Deployment to ${ENVIRONMENT} completed successfully!${NC}"
    
    # Show access information
    cd terraform
    if [[ "$ENVIRONMENT" == "test" ]]; then
        TEST_IP=$(terraform output -raw test_instance_ip 2>/dev/null || echo "")
        if [[ -n "$TEST_IP" ]]; then
            echo -e "${BLUE}Test Environment Access:${NC}"
            echo -e "  URL: http://${TEST_IP}:8081"
            echo -e "  SSH: ssh -i ~/.ssh/autotest-key.pem ubuntu@${TEST_IP}"
        fi
    else
        PROD_IP=$(terraform output -raw prod_instance_ip 2>/dev/null || echo "")
        if [[ -n "$PROD_IP" ]]; then
            echo -e "${BLUE}Production Environment Access:${NC}"
            echo -e "  URL: https://${PROD_IP}"
            echo -e "  SSH: ssh -i ~/.ssh/autotest-key.pem ubuntu@${PROD_IP}"
        fi
    fi
    cd ..
}

# Handle script arguments
case "${1:-test}" in
    test|prod)
        main
        ;;
    *)
        echo -e "${RED}Usage: $0 [test|prod]${NC}"
        echo -e "${YELLOW}Defaulting to 'test' environment${NC}"
        main
        ;;
esac
