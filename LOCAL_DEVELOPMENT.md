# 🚀 Local Development Guide

This guide will help you run the Base44 Test Management App locally for development.

## 📋 Prerequisites

Before you start, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose** (for containerized setup)
- **PostgreSQL** (for manual setup)

## 🎯 Quick Start Options

You have **3 different ways** to run the application locally:

### Option 1: 🐳 Docker Compose (Recommended)

**Easiest setup - everything runs in containers**

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd autotest

# 2. Start all services
docker-compose up -d

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
# Database: localhost:5432
```

**What this does:**
- ✅ Starts PostgreSQL database
- ✅ Starts backend API server
- ✅ Starts frontend React app
- ✅ Sets up networking between services
- ✅ Handles environment variables automatically

**Useful commands:**
```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build -d

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d
```

### Option 2: 🔧 Manual Setup (Full Control)

**More control - run services individually**

#### Step 1: Setup Database

```bash
# Install PostgreSQL locally or use Docker
docker run -d \
  --name base44-postgres \
  -e POSTGRES_DB=base44_test_management \
  -e POSTGRES_USER=base44_user \
  -e POSTGRES_PASSWORD=base44_password \
  -p 5432:5432 \
  postgres:15-alpine
```

#### Step 2: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Setup environment variables
cat > .env << EOF
DATABASE_URL=postgresql://base44_user:base44_password@localhost:5432/base44_test_management
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
PORT=4000
EOF

# Run database migrations
npx prisma generate
npx prisma db push

# Start backend server
npm run dev
# or
node index.js
```

#### Step 3: Setup Frontend

```bash
# Navigate to root directory
cd ..

# Install dependencies
npm install

# Setup environment variables
cat > .env << EOF
REACT_APP_API_URL=http://localhost:4000/api
NODE_ENV=development
EOF

# Start frontend development server
npm run dev
```

### Option 3: 🎯 Hybrid Setup (Best of Both)

**Database in Docker, apps locally**

```bash
# 1. Start only PostgreSQL in Docker
docker run -d \
  --name base44-postgres \
  -e POSTGRES_DB=base44_test_management \
  -e POSTGRES_USER=base44_user \
  -e POSTGRES_PASSWORD=base44_password \
  -p 5432:5432 \
  postgres:15-alpine

# 2. Setup backend (see Option 2, Step 2)
cd backend
npm install
# ... setup .env and start server

# 3. Setup frontend (see Option 2, Step 3)
cd ..
npm install
# ... setup .env and start server
```

## 🔧 Environment Variables

### Backend (.env in backend directory)

```bash
# Database
DATABASE_URL=postgresql://base44_user:base44_password@localhost:5432/base44_test_management

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
NODE_ENV=development
PORT=4000

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:4000/api/github/callback
```

### Frontend (.env in root directory)

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:4000/api

# Environment
NODE_ENV=development
```

## 🗄️ Database Management

### Running Migrations

```bash
# Navigate to backend directory
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations (if you have migration files)
npx prisma migrate deploy
```

### Database Access

```bash
# Connect to PostgreSQL
psql -h localhost -U base44_user -d base44_test_management

# Or using Docker
docker exec -it base44-postgres psql -U base44_user -d base44_test_management
```

### Reset Database

```bash
# Using Docker Compose
docker-compose down -v
docker-compose up -d

# Using manual setup
docker stop base44-postgres
docker rm base44-postgres
# Then recreate the container
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in UI mode
npm run test:ui
```

### Test Database

```bash
# Create test database
createdb base44_test_management_test

# Run tests with test database
DATABASE_URL=postgresql://base44_user:base44_password@localhost:5432/base44_test_management_test npm test
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :4000
lsof -i :5432

# Kill the process
kill -9 <PID>
```

#### 2. Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database connection
psql -h localhost -U base44_user -d base44_test_management -c "SELECT 1;"

# Restart PostgreSQL
docker restart base44-postgres
```

#### 3. Node Modules Issues

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Docker cache
docker system prune -a
```

#### 4. Permission Issues

```bash
# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
# Log out and back in
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# View detailed logs
docker-compose logs -f --tail=100
```

## 📊 Development Workflow

### 1. Start Development Environment

```bash
# Option 1: Docker Compose (recommended)
docker-compose up -d

# Option 2: Manual setup
# Start PostgreSQL, then backend, then frontend
```

### 2. Make Changes

- **Frontend**: Edit files in `src/` - changes auto-reload
- **Backend**: Edit files in `backend/` - server auto-restarts
- **Database**: Use Prisma migrations for schema changes

### 3. Test Changes

```bash
# Run tests
npm test

# Check linting
npm run lint
```

### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: add new feature"

# Push to repository
git push origin main
```

## 🎯 Development Tips

### Hot Reloading

- **Frontend**: Vite provides instant hot reloading
- **Backend**: Node.js auto-restarts on file changes
- **Database**: Use Prisma Studio for database management

### Code Quality

```bash
# Run linting
npm run lint

# Format code (if you have prettier)
npx prettier --write .

# Type checking (if using TypeScript)
npx tsc --noEmit
```

### Performance

- Use `npm run build` to test production build
- Check bundle size with `npm run build -- --analyze`
- Monitor memory usage in development

## 🚀 Next Steps

1. **Explore the codebase**:
   - `src/` - Frontend React components
   - `backend/` - Node.js API server
   - `src/test/` - Test files

2. **Read documentation**:
   - [Test Suite Documentation](src/test/README.md)
   - [API Documentation](backend/README.md)
   - [Deployment Guide](README.md)

3. **Set up your IDE**:
   - Install ESLint and Prettier extensions
   - Configure debugging for Node.js and React
   - Set up database viewer

4. **Join the development**:
   - Create feature branches
   - Write tests for new features
   - Follow the contributing guidelines

---

**Happy coding! 🎉**

For support, check the [main README](README.md) or create an issue in the repository.
