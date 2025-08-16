# Node.js Application Testing Guide

This guide explains how to run the comprehensive test suite against your Node.js/Express backend and React frontend application.

## 🏗️ Application Architecture

Your application consists of:
- **Backend**: Node.js/Express server running on `http://localhost:4000`
- **Frontend**: React application running on `http://localhost:5173`
- **Database**: PostgreSQL (for backend data persistence)

## 🚀 Quick Start

### 1. Start Your Application

```bash
# Terminal 1: Start the backend
cd backend
npm start

# Terminal 2: Start the frontend
npm run dev
```

### 2. Run Tests

```bash
# Use the test runner script
npm run test:app

# Or run specific test types
npm run test:app unit
npm run test:app integration
npm run test:app api
npm run test:app e2e
npm run test:app pytest
npm run test:app all
```

## 📋 Test Types & Frameworks

### ✅ **Unit Tests** (Jest)
**Perfect for your Node.js app!**
- Tests individual functions and components
- No external dependencies
- Fast execution

```bash
npm run test:unit:jest
```

**What it tests:**
- React components
- Utility functions
- Business logic
- Helper functions

### ✅ **Integration Tests** (Supertest)
**Perfect for your Express backend!**
- Tests API endpoints
- Database interactions
- Authentication flows

```bash
npm run test:integration:supertest
```

**What it tests:**
- `/api/auth/register` - User registration
- `/api/auth/login` - User authentication
- `/api/teams` - Team management
- `/api/tests` - Test management
- `/health` - Health check endpoint

### ✅ **API Tests** (Postman/Newman)
**Perfect for your Express API!**
- Collection-based API testing
- CLI execution for CI/CD
- Comprehensive endpoint coverage

```bash
npm run test:api:postman
```

**What it tests:**
- All API endpoints
- Authentication flows
- Error handling
- Response validation

### ✅ **E2E Tests** (Playwright)
**Perfect for your React frontend!**
- Full user workflows
- Browser automation
- Real user scenarios

```bash
npm run test:e2e:playwright
```

**What it tests:**
- User registration/login
- Test creation and management
- Team management
- Report generation
- Navigation flows

### ✅ **Python Integration Tests** (pytest + requests)
**Alternative API testing approach**
- Python-based API testing
- Flexible test scenarios
- Easy to extend

```bash
npm run test:integration:pytest
```

## 🔧 Setup Requirements

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (for pytest tests)
pip install -r requirements.txt

# Install Newman (for Postman tests)
npm install -g newman
```

### 2. Environment Setup

```bash
# Backend environment variables (backend/.env)
DATABASE_URL=postgresql://base44_user:base44_password@localhost:5432/base44_test_management
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
PORT=4000

# Frontend environment variables (.env)
REACT_APP_API_URL=http://localhost:4000/api
NODE_ENV=development
```

### 3. Database Setup

```bash
# Navigate to backend
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed database (optional)
npm run seed
```

## 🧪 Running Tests

### Method 1: Using the Test Runner Script

```bash
# Check available commands
npm run test:app

# Run specific test types
npm run test:app unit
npm run test:app integration
npm run test:app api
npm run test:app e2e
npm run test:app pytest
npm run test:app all
```

### Method 2: Direct Commands

```bash
# Unit tests
npm run test:unit:jest

# Integration tests
npm run test:integration:supertest

# API tests
npm run test:api:postman

# E2E tests
npm run test:e2e:playwright

# Python tests
npm run test:integration:pytest
```

### Method 3: Pipeline Commands

```bash
# Run all tests for a specific type
npm run test:pipeline:unit
npm run test:pipeline:integration
npm run test:pipeline:api
npm run test:pipeline:e2e

# Run all tests
npm run test:pipeline:all
```

## 📊 Test Results & Coverage

### Coverage Reports

```bash
# Generate coverage reports
npm run test:coverage

# View coverage in browser
npm run test:ui
```

### Test Artifacts

Test results are saved as artifacts:
- **Jest**: `./coverage/` directory
- **Supertest**: JSON results in `./coverage/`
- **Postman**: `./newman-results.json`
- **Playwright**: `./playwright-report/`
- **pytest**: `./pytest-results.xml`

## 🔍 Debugging Tests

### 1. Backend Issues

```bash
# Check backend health
curl http://localhost:4000/health

# View backend logs
cd backend && npm start

# Check database connection
npx prisma studio
```

### 2. Frontend Issues

```bash
# Check frontend health
curl http://localhost:5173

# View frontend logs
npm run dev

# Check browser console
# Open http://localhost:5173 in browser
```

### 3. Test-Specific Issues

```bash
# Run tests with verbose output
npm run test:unit:jest -- --verbose

# Run tests in watch mode
npm run test:unit:jest -- --watch

# Run specific test file
npm run test:unit:jest -- src/test/unit-jest/Button.test.jsx
```

## 🚨 Common Issues & Solutions

### Issue: Backend not running
**Solution:**
```bash
cd backend
npm install
npm start
```

### Issue: Database connection failed
**Solution:**
```bash
cd backend
npx prisma generate
npx prisma db push
```

### Issue: Frontend not accessible
**Solution:**
```bash
npm install
npm run dev
```

### Issue: Python tests failing
**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: Newman not found
**Solution:**
```bash
npm install -g newman
```

## 📈 CI/CD Integration

### GitHub Actions

The test pipelines are configured for GitHub Actions:

```yaml
# Example workflow
name: Test Application
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run test:pipeline:all
```

### Local CI Simulation

```bash
# Run all tests locally (simulates CI)
npm run test:pipeline:all
```

## 🎯 Best Practices

### 1. Test Order
1. **Unit tests** first (fastest feedback)
2. **Integration tests** (API endpoints)
3. **E2E tests** last (slowest)

### 2. Test Data Management
- Use test databases for integration tests
- Clean up test data after tests
- Use fixtures for consistent test data

### 3. Environment Management
- Use separate test environment variables
- Mock external services in unit tests
- Use real services in integration tests

### 4. Performance Considerations
- Run unit tests on every commit
- Run integration tests on pull requests
- Run E2E tests before deployment

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Postman/Newman Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [pytest Documentation](https://docs.pytest.org/)

## 🆘 Getting Help

If you encounter issues:

1. **Check application status**: `npm run test:app`
2. **Review logs**: Check terminal output for errors
3. **Verify endpoints**: Test API endpoints manually
4. **Check dependencies**: Ensure all packages are installed
5. **Database issues**: Verify PostgreSQL is running

---

**Happy Testing! 🧪✨**
