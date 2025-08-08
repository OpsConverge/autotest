# Base44 Test Management App

A comprehensive test management application built with React, Node.js, and PostgreSQL, designed for Docker deployment on AWS EC2.

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Prisma
- **Database**: PostgreSQL (local installation on EC2)
- **Deployment**: Docker containers on AWS EC2

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- PostgreSQL (for local development)

### Local Development

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd autotest
   ```

2. **Start with Docker Compose:**
   ```bash
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop services
   docker-compose down
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Database: localhost:5432

### Manual Setup (Alternative)

1. **Backend setup:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

2. **Frontend setup:**
```bash
npm install
npm run dev
```

## 🐳 Docker Deployment

### Local Docker Development

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
```

### Production Deployment

1. **Build production images:**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```

2. **Environment variables:**
   ```bash
   # Create .env file
   POSTGRES_PASSWORD=your_secure_password
   JWT_SECRET=your_jwt_secret
   REACT_APP_API_URL=https://your-domain.com/api
   ```

## ☁️ AWS EC2 Deployment

### Cost-Effective EC2 Setup

Perfect for MVP - simple, cost-effective, and easy to manage:

- **EC2 t3.medium**: ~$30/month
- **PostgreSQL**: Local installation (no additional cost)
- **Total**: ~$30/month (vs $100+ for ECS + RDS)

### Quick EC2 Deployment

1. **Setup Terraform:**
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

2. **Deploy infrastructure:**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

3. **Deploy application:**
   ```bash
   # Using GitHub Actions (automatic)
   git push origin main
   
   # Or manual deployment
   ./scripts/deploy-to-ec2.sh
   ```

### EC2 Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Internet      │    │   EC2 Instance  │
│                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │
│  │   Nginx   │◄─┼────┼─►│  Frontend │  │
│  │   (80/443)│  │    │  │  (React)  │  │
│  └───────────┘  │    │  └───────────┘  │
│                 │    │  ┌───────────┐  │
│                 │    │  │  Backend  │  │
│                 │    │  │  (Node.js)│  │
│                 │    │  └───────────┘  │
│                 │    │  ┌───────────┐  │
│                 │    │  │ PostgreSQL│  │
│                 │    │  │  (Local)  │  │
│                 │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘
```

## 🗄️ Database Management

### Migrations

The app uses SQL migrations for database schema management:

```bash
# Run migrations manually
cd backend
psql $DATABASE_URL -f migrations/001_init.sql
psql $DATABASE_URL -f migrations/002_add_workflow_run_id.sql
psql $DATABASE_URL -f migrations/003_add_releases.sql
```

### Database Schema

- **Users**: Authentication and user management
- **Teams**: Multi-tenant team support
- **Test Results**: Test execution results and history
- **Build History**: CI/CD build tracking
- **GitHub Integrations**: Repository connections
- **Scheduled Tests**: Automated test scheduling

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Test Structure

```
src/test/
├── components/     # Component unit tests
├── pages/         # Page component tests
├── hooks/         # Custom hook tests
├── api/           # API function tests
├── integration/   # Integration tests
└── e2e/           # End-to-end tests
```

## 🚀 AWS Deployment

### CI/CD Pipeline

The app includes GitHub Actions workflows for automated deployment:

1. **Test Suite** (`test-only.yml`) - Runs on all branches
2. **EC2 Deploy** (`ec2-deploy.yml`) - Full pipeline to EC2
3. **Docker Deploy** (`docker-deploy.yml`) - Alternative ECS deployment

### AWS Infrastructure

- **EC2 Instance** - Container orchestration (cost-effective)
- **ECR** - Docker image registry
- **PostgreSQL** - Local installation on EC2
- **Application Load Balancer** - Traffic distribution

### Required AWS Secrets

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
EC2_HOST=your_ec2_public_ip
EC2_SSH_KEY=your_private_ssh_key
DATABASE_PASSWORD=your_database_password
JWT_SECRET=your_jwt_secret
```

## 📊 Features

- **Dashboard**: Overview of test results and analytics
- **Test Results**: Detailed test execution tracking
- **Build History**: CI/CD pipeline monitoring
- **Analytics**: Performance and trend analysis
- **AI Assistant**: Intelligent test insights
- **Flakiness Detection**: Identify unreliable tests
- **Test Scheduling**: Automated test execution
- **Team Management**: Multi-tenant support
- **GitHub Integration**: Repository connectivity

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Authentication
JWT_SECRET=your_jwt_secret

# API Configuration
PORT=4000
NODE_ENV=production

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com
```

### Docker Configuration

- **Frontend**: Nginx serving React app
- **Backend**: Node.js API server
- **Database**: PostgreSQL (local installation)
- **Proxy**: Nginx reverse proxy for production

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection:**
   ```bash
   # Check database health
   docker-compose exec postgres pg_isready -U base44_user
   ```

2. **Migration Issues:**
   ```bash
   # Reset database
   docker-compose down -v
   docker-compose up -d postgres
   # Run migrations manually
   ```

3. **Build Failures:**
   ```bash
   # Clean Docker cache
   docker system prune -a
   docker-compose build --no-cache
   ```

### Debug Mode

```bash
# Enable debug logging
ACTIONS_STEP_DEBUG=true

# View detailed logs
docker-compose logs -f --tail=100
```

## 💰 Cost Optimization

### EC2 vs ECS Cost Comparison

| Service | EC2 (t3.medium) | ECS Fargate + RDS | Savings |
|---------|-----------------|-------------------|---------|
| Compute | ~$30/month | ~$100/month | 70% |
| Database | ~$0/month | ~$15/month | 100% |
| **Total** | **~$30/month** | **~$115/month** | **74%** |

### Cost Saving Tips

1. **Use EC2 instead of ECS Fargate**
2. **Local PostgreSQL** - No RDS costs
3. **No Redis** - Simplified architecture for MVP
4. **Use Spot Instances** for non-critical workloads
5. **Implement auto-shutdown** for dev environments

## 📚 Documentation

- [Test Suite Documentation](src/test/README.md)
- [CI/CD Pipeline Documentation](.github/workflows/README.md)
- [EC2 Deployment Documentation](terraform/README.md)
- [API Documentation](backend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

For support, please contact the development team or refer to the documentation.
