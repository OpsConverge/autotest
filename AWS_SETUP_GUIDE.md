# 🚀 Manual AWS Setup Guide

This guide will help you set up your AutoTest SaaS platform on AWS EC2 instances with containerized databases.

## 📋 Prerequisites

- AWS Account
- AWS CLI configured
- SSH key pair
- Domain name (optional, for production)

## 🏗 Step 1: Create EC2 Instances

### Test Environment
1. **Launch EC2 Instance**
   - **AMI**: Ubuntu 22.04 LTS
   - **Instance Type**: t3.medium (2 vCPU, 4 GB RAM)
   - **Storage**: 20 GB GP3
   - **Security Group**: Create new with these rules:
     ```
     SSH (22): 0.0.0.0/0
     HTTP (80): 0.0.0.0/0
     HTTPS (443): 0.0.0.0/0
     Custom (8081): 0.0.0.0/0  # For test environment
     ```
   - **Key Pair**: Select your SSH key

### Production Environment
1. **Launch EC2 Instance**
   - **AMI**: Ubuntu 22.04 LTS
   - **Instance Type**: t3.large (2 vCPU, 8 GB RAM)
   - **Storage**: 40 GB GP3
   - **Security Group**: Create new with these rules:
     ```
     SSH (22): YOUR_IP/32  # Restrict to your IP
     HTTP (80): 0.0.0.0/0
     HTTPS (443): 0.0.0.0/0
     ```
   - **Key Pair**: Select your SSH key

## 🔧 Step 2: Configure EC2 Instances

### Connect to Test Instance
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_TEST_IP
```

### Install Docker and Docker Compose
```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Logout and login again for group changes to take effect
exit
```

### Connect again and create application directory
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_TEST_IP

# Create application directory
mkdir -p /opt/autotest
cd /opt/autotest
```

## 📦 Step 3: Deploy Application

### Option A: Deploy from Local Machine

1. **Create deployment package locally**
```bash
# In your local project directory
tar -czf deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='terraform' \
    --exclude='deploy.tar.gz' \
    .
```

2. **Upload to EC2**
```bash
scp -i ~/.ssh/your-key.pem deploy.tar.gz ubuntu@YOUR_TEST_IP:/opt/autotest/
```

3. **Deploy on EC2**
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_TEST_IP

cd /opt/autotest

# Extract deployment
tar -xzf deploy.tar.gz

# Copy environment file
cp env.test .env

# Build and start containers
docker-compose -f docker-compose.test.yml up -d --build

# Wait for services to be ready
sleep 30

# Run database migrations
docker-compose -f docker-compose.test.yml exec backend npx prisma migrate deploy

# Create test users
docker-compose -f docker-compose.test.yml exec backend node scripts/seed.js
```

### Option B: Deploy from Git

1. **Clone repository on EC2**
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_TEST_IP

cd /opt/autotest
git clone https://github.com/yourusername/autotest.git .

# Copy environment file
cp env.test .env

# Build and start containers
docker-compose -f docker-compose.test.yml up -d --build
```

## 🔒 Step 4: SSL Certificate (Production Only)

For production environment, you'll need SSL certificates:

### Option A: Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install -y certbot

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to application directory
sudo mkdir -p /opt/autotest/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/autotest/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/autotest/ssl/key.pem
sudo chown -R ubuntu:ubuntu /opt/autotest/ssl
```

### Option B: Self-Signed (Testing)
```bash
# Generate self-signed certificate
mkdir -p /opt/autotest/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /opt/autotest/ssl/key.pem \
    -out /opt/autotest/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## 🚀 Step 5: Start Services

### Test Environment
```bash
cd /opt/autotest
docker-compose -f docker-compose.test.yml up -d
```

### Production Environment
```bash
cd /opt/autotest
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Step 6: Verify Deployment

### Check Services
```bash
# Check container status
docker-compose -f docker-compose.test.yml ps

# Check logs
docker-compose -f docker-compose.test.yml logs -f

# Test health endpoint
curl http://localhost:8081/health
```

### Access Application
- **Test Environment**: `http://YOUR_TEST_IP:8081`
- **Production Environment**: `https://YOUR_PROD_IP` or `https://yourdomain.com`

## 🔄 Step 7: Update Environment Configuration

### Update Test Environment URLs
Edit `env.test` on your test instance:
```bash
# Update with your actual IP
TEST_BASE_URL=http://YOUR_TEST_IP:8081
TEST_API_URL=http://YOUR_TEST_IP:8081/api
TEST_TARGET_URL=http://YOUR_TEST_IP:8081
```

### Update Production Environment URLs
Edit `env.prod` on your production instance:
```bash
# Update with your actual domain
PROD_BASE_URL=https://yourdomain.com
PROD_API_URL=https://yourdomain.com/api
PROD_TARGET_URL=https://yourdomain.com
```

## 🧪 Step 8: Run Self-Tests

### Test Against Test Environment
```bash
# On your local machine
cd /path/to/your/project

# Update test configuration with your IP
export TEST_TARGET_URL=http://YOUR_TEST_IP:8081
export TEST_API_URL=http://YOUR_TEST_IP:8081/api

# Run tests
npm run test:test
```

### Test Against Production Environment
```bash
# Update production configuration with your domain
export PROD_TARGET_URL=https://yourdomain.com
export PROD_API_URL=https://yourdomain.com/api

# Run tests
npm run test:prod
```

## 🔧 Step 9: Automation Scripts

### Create Startup Script
```bash
# On EC2 instance
cat > /opt/autotest/start.sh << 'EOF'
#!/bin/bash
cd /opt/autotest

# Pull latest changes (if using git)
# git pull origin main

# Stop containers
docker-compose -f docker-compose.test.yml down

# Build and start containers
docker-compose -f docker-compose.test.yml up -d --build

# Wait for services
sleep 30

# Run migrations
docker-compose -f docker-compose.test.yml exec -T backend npx prisma migrate deploy

echo "Application started successfully"
EOF

chmod +x /opt/autotest/start.sh
```

### Create Systemd Service
```bash
sudo cat > /etc/systemd/system/autotest.service << EOF
[Unit]
Description=AutoTest Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/autotest
ExecStart=/opt/autotest/start.sh
ExecStop=/usr/local/bin/docker-compose -f docker-compose.test.yml down

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable autotest.service
```

## 📊 Step 10: Monitoring

### View Logs
```bash
# All services
docker-compose -f docker-compose.test.yml logs -f

# Specific service
docker-compose -f docker-compose.test.yml logs -f backend
```

### Monitor Resources
```bash
# Install monitoring tools
sudo apt-get install -y htop iotop

# Check resource usage
htop
docker stats
```

### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.test.yml exec postgres pg_dump -U autotest_user autotest_test > backup.sql

# Restore backup
docker-compose -f docker-compose.test.yml exec -T postgres psql -U autotest_user autotest_test < backup.sql
```

## 🔄 Step 11: Updates and Maintenance

### Update Application
```bash
cd /opt/autotest

# Stop services
docker-compose -f docker-compose.test.yml down

# Pull latest code (if using git)
git pull origin main

# Rebuild and start
docker-compose -f docker-compose.test.yml up -d --build

# Run migrations
docker-compose -f docker-compose.test.yml exec -T backend npx prisma migrate deploy
```

### SSL Certificate Renewal (Production)
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/autotest/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/autotest/ssl/key.pem
sudo chown -R ubuntu:ubuntu /opt/autotest/ssl

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo netstat -tulpn | grep :8081
   sudo kill -9 <PID>
   ```

2. **Database connection issues**
   ```bash
   docker-compose -f docker-compose.test.yml logs postgres
   docker-compose -f docker-compose.test.yml exec postgres psql -U autotest_user -d autotest_test
   ```

3. **Container won't start**
   ```bash
   docker-compose -f docker-compose.test.yml logs <service-name>
   docker system prune -a  # Clean up unused images
   ```

4. **Permission issues**
   ```bash
   sudo chown -R ubuntu:ubuntu /opt/autotest
   sudo chmod -R 755 /opt/autotest
   ```

### Health Checks
```bash
# Check all services
curl http://localhost:8081/health

# Check individual services
curl http://localhost:4000/health  # Backend
curl http://localhost:3000/        # Frontend
```

## 🎉 Success!

Your AutoTest SaaS platform is now running on AWS with:
- ✅ Containerized PostgreSQL database
- ✅ Nginx reverse proxy
- ✅ SSL support (production)
- ✅ Health monitoring
- ✅ Automated startup
- ✅ Self-testing capabilities

You can now run tests against your deployed environments and collect real-world data for your SaaS platform!
