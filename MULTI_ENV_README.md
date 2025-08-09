# Multi-Environment Setup for AutoTest Platform

This setup allows you to run both production and test environments simultaneously on the same EC2 instance using Docker containers.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    EC2 Instance                            │
├─────────────────────────────────────────────────────────────┤
│  Production Environment          │  Test Environment       │
│  ┌─────────────────────────────┐ │  ┌─────────────────────┐ │
│  │ Frontend: localhost:3000   │ │  │ Frontend: 3001      │ │
│  │ Backend:  localhost:4000   │ │  │ Backend:  4001      │ │
│  │ Database: localhost:5432   │ │  │ Database: 5433      │ │
│  └─────────────────────────────┘ │  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Start Production Environment Only
```bash
./start-prod.sh
```
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Database: localhost:5432

### 2. Start Test Environment Only
```bash
./start-test.sh
```
- Frontend: http://localhost:3001
- Backend: http://localhost:4001
- Database: localhost:5433

### 3. Start Both Environments
```bash
./start-both.sh
```

## 🧪 Running Tests Against Test Environment

### Automated Test Suite
```bash
./run-tests.sh
```

This script will:
- ✅ Verify test environment is running
- 🔌 Test API endpoints
- 🌐 Test frontend accessibility
- 🔗 Test user registration/login flows
- ⚡ Test performance metrics
- 📈 Run load tests

### Manual Testing
You can manually test the test environment at:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:4001
- **Health Check**: http://localhost:4001/health

## 🔧 Environment Configuration

### Environment Variables
Create a `.env` file based on `.env.example`:

```bash
# Production
POSTGRES_PROD_PASSWORD=your_secure_production_password
JWT_SECRET=your_secure_jwt_secret_for_production
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
FRONTEND_URL=http://your-domain.com

# Test
POSTGRES_TEST_PASSWORD=your_secure_test_password
JWT_SECRET_TEST=your_secure_jwt_secret_for_testing
FRONTEND_TEST_URL=http://localhost:3001
```

### GitHub OAuth
You can use:
- **Same credentials** for both environments (recommended for testing)
- **Different credentials** for production vs test

## 📊 Port Mapping

| Service | Production | Test | Container Internal |
|---------|------------|------|-------------------|
| Frontend | 3000 | 3001 | 3000 |
| Backend | 4000 | 4001 | 4000/4001 |
| Database | 5432 | 5433 | 5432 |

## 🐳 Docker Commands

### View Running Containers
```bash
docker ps
```

### View Logs
```bash
# Production logs
docker-compose --profile prod logs -f

# Test logs
docker-compose --profile test logs -f

# Both environments
docker-compose --profile prod --profile test logs -f
```

### Stop Environments
```bash
# Stop production
docker-compose --profile prod down

# Stop test
docker-compose --profile test down

# Stop both
docker-compose --profile prod --profile test down
```

### Rebuild and Restart
```bash
# Rebuild production
docker-compose --profile prod build
docker-compose --profile prod up -d

# Rebuild test
docker-compose --profile test build
docker-compose --profile test up -d
```

## 🧹 Cleanup

### Remove All Data
```bash
# Stop all containers
docker-compose --profile prod --profile test down

# Remove volumes (WARNING: This will delete all data)
docker volume rm autotest_postgres_prod_data autotest_postgres_test_data

# Remove images
docker-compose --profile prod --profile test down --rmi all
```

## 🔍 Troubleshooting

### Port Conflicts
If you get port conflicts:
```bash
# Check what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000
netstat -tulpn | grep :5432

# Kill processes using those ports
sudo kill -9 <PID>
```

### Database Connection Issues
```bash
# Check database containers
docker ps | grep postgres

# Check database logs
docker logs autotest-postgres-prod
docker logs autotest-postgres-test

# Connect to database directly
docker exec -it autotest-postgres-prod psql -U autotest_prod_user -d autotest_production
docker exec -it autotest-postgres-test psql -U autotest_test_user -d autotest_testing
```

### Frontend/Backend Issues
```bash
# Check container status
docker ps

# Check logs
docker logs autotest-frontend-prod
docker logs autotest-backend-prod
docker logs autotest-frontend-test
docker logs autotest-backend-test

# Restart specific service
docker-compose --profile prod restart frontend-prod
docker-compose --profile test restart backend-test
```

## 🚀 Deployment to EC2

### 1. Install Docker on EC2
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
# SSH back in
```

### 2. Clone and Deploy
```bash
# Clone your repository
git clone <your-repo-url>
cd autotest

# Create .env file
cp .env.example .env
# Edit .env with your production values

# Start production environment
./start-prod.sh
```

### 3. Configure Security Groups
- **Port 3000**: Frontend (HTTP)
- **Port 4000**: Backend API (HTTP)
- **Port 5432**: Database (PostgreSQL)

## 📈 Monitoring and Maintenance

### Health Checks
- Production: http://your-domain:4000/health
- Test: http://your-domain:4001/health

### Log Rotation
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/docker-autotest

# Add configuration
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
```

### Backup Strategy
```bash
# Backup production database
docker exec autotest-postgres-prod pg_dump -U autotest_prod_user autotest_production > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# Backup test database
docker exec autotest-postgres-test pg_dump -U autotest_test_user autotest_testing > backup_test_$(date +%Y%m%d_%H%M%S).sql
```

## 🎯 Best Practices

1. **Always use different databases** for production and test
2. **Use strong passwords** for production databases
3. **Monitor resource usage** on EC2
4. **Set up automated backups** for production data
5. **Use environment-specific GitHub OAuth apps** if possible
6. **Test thoroughly** in test environment before deploying to production
7. **Monitor logs** regularly for both environments

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Docker logs for specific services
3. Verify environment variables are set correctly
4. Ensure ports are not conflicting with other services
5. Check EC2 security group configurations
