#!/bin/bash

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Create application directory
mkdir -p /opt/autotest
cd /opt/autotest

# Create environment file
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://autotest_user:${db_password}@localhost:5432/autotest_${environment}

# JWT Secret
JWT_SECRET=${jwt_secret}

# Environment Configuration
NODE_ENV=${environment}

# Domain Configuration
DOMAIN_NAME=${domain_name}

# Test Environment URLs
TEST_BASE_URL=https://test.yourdomain.com
TEST_API_URL=https://test.yourdomain.com/api
TEST_TARGET_URL=https://test.yourdomain.com

# Production Environment URLs
PROD_BASE_URL=https://yourdomain.com
PROD_API_URL=https://yourdomain.com/api
PROD_TARGET_URL=https://yourdomain.com

# Test User Credentials
TEST_ADMIN_EMAIL=admin@test.yourdomain.com
TEST_ADMIN_PASSWORD=admin123
TEST_USER_EMAIL=user@test.yourdomain.com
TEST_USER_PASSWORD=user123

# Production User Credentials
PROD_ADMIN_EMAIL=admin@yourdomain.com
PROD_ADMIN_PASSWORD=${prod_admin_password}
PROD_USER_EMAIL=user@yourdomain.com
PROD_USER_PASSWORD=${prod_user_password}

# GitHub Integration
GITHUB_CLIENT_ID=${github_client_id}
GITHUB_CLIENT_SECRET=${github_client_secret}
EOF

# Create docker-compose file based on environment
if [ "${environment}" = "test" ]; then
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: autotest_test
      POSTGRES_USER: autotest_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-testpassword123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://autotest_user:${POSTGRES_PASSWORD:-testpassword123}@postgres:5432/autotest_test
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "4000:4000"
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    environment:
      NODE_ENV: test
      VITE_API_URL: http://localhost:4000/api
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.test.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
EOF
else
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    environment:
      NODE_ENV: production
      VITE_API_URL: https://${DOMAIN_NAME}/api
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
EOF
fi

# Create SSL directory for production
if [ "${environment}" = "prod" ]; then
    mkdir -p ssl
    # Note: SSL certificates should be uploaded separately
fi

# Create startup script
cat > start.sh << 'EOF'
#!/bin/bash
cd /opt/autotest

# Pull latest code (if using git)
# git pull origin main

# Build and start containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
sleep 30

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Create test users if needed
docker-compose exec backend node scripts/seed.js
EOF

chmod +x start.sh

# Create systemd service for auto-start
cat > /etc/systemd/system/autotest.service << EOF
[Unit]
Description=AutoTest Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/autotest
ExecStart=/opt/autotest/start.sh
ExecStop=/usr/local/bin/docker-compose down

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl enable autotest.service

# Install monitoring tools
apt-get install -y htop iotop nethogs

# Create log rotation
cat > /etc/logrotate.d/autotest << EOF
/opt/autotest/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
EOF

# Set up firewall (UFW)
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443
if [ "${environment}" = "test" ]; then
    ufw allow 8081
fi

echo "Setup completed for ${environment} environment"
