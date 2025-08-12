# Environment Management for Self-Testing

This system allows your SaaS platform to run tests against different environments (development, test, staging, production) without hardcoding URLs.

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file and configure your URLs:

```bash
cp env.example .env
```

Edit `.env` with your actual environment URLs:

```bash
# Test Environment
TEST_BASE_URL=https://test.yourdomain.com
TEST_API_URL=https://test.yourdomain.com/api
TEST_TARGET_URL=https://test.yourdomain.com

# Staging Environment
STAGING_BASE_URL=https://staging.yourdomain.com
STAGING_API_URL=https://staging.yourdomain.com/api
STAGING_TARGET_URL=https://staging.yourdomain.com

# Production Environment
PROD_BASE_URL=https://yourdomain.com
PROD_API_URL=https://yourdomain.com/api
PROD_TARGET_URL=https://yourdomain.com
```

### 2. Running Tests

#### Test against development environment (localhost):
```bash
npm run test:dev
```

#### Test against test environment:
```bash
npm run test:test
```

#### Test against staging environment:
```bash
npm run test:staging
```

#### Test against production environment:
```bash
npm run test:prod
```

#### Test against all environments:
```bash
npm run test:all
```

### 3. Programmatic Usage

```javascript
const { environmentClient } = require('./utils/environmentClient');

// Switch to test environment
environmentClient.switchEnvironment('test');

// Make API calls
const response = await environmentClient.makeRequest('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'admin@test.yourdomain.com',
    password: 'admin123'
  })
});

// Get current environment info
console.log(environmentClient.getEnvironmentInfo());
```

## 🏗 Architecture

### Environment Configuration (`config/environments.js`)
- Defines different environments (dev, test, staging, prod)
- Each environment has its own URLs and settings
- Environment variables override defaults

### Test Configuration (`config/test-config.js`)
- Environment-specific test settings
- Test user credentials
- Timeout configurations
- Test data

### Environment Client (`utils/environmentClient.js`)
- Dynamic environment switching
- Environment-aware API requests
- Automatic authentication
- Request/response handling

### Test Runner (`scripts/run-tests.js`)
- Executes test suites against different environments
- Collects and reports test results
- Supports command-line arguments

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TEST_BASE_URL` | Test environment frontend URL | `https://test.yourdomain.com` |
| `TEST_API_URL` | Test environment API URL | `https://test.yourdomain.com/api` |
| `STAGING_BASE_URL` | Staging environment frontend URL | `https://staging.yourdomain.com` |
| `PROD_BASE_URL` | Production environment frontend URL | `https://yourdomain.com` |

### Test User Credentials

Each environment can have its own test users:

```bash
# Test Environment Users
TEST_ADMIN_EMAIL=admin@test.yourdomain.com
TEST_ADMIN_PASSWORD=admin123
TEST_USER_EMAIL=user@test.yourdomain.com
TEST_USER_PASSWORD=user123
```

## 📊 Test Results

The test runner provides detailed output:

```
🎯 Testing against: test
📍 Target URL: https://test.yourdomain.com

🚀 Starting test suite for environment: test

🧪 Running test: User Registration
✅ User Registration - PASSED (1250ms)

🧪 Running test: User Login
✅ User Login - PASSED (890ms)

🧪 Running test: Dashboard Access
✅ Dashboard Access - PASSED (567ms)

📊 Test Summary for test:
   Total tests: 3
   Passed: 3
   Failed: 0
   Success rate: 100.0%
```

## 🔄 Adding New Tests

1. Add test function to `scripts/run-tests.js`:

```javascript
const testFunctions = {
  // ... existing tests ...
  
  async testNewFeature(client) {
    const response = await client.authenticatedRequest('/new-endpoint');
    
    if (!response.ok) {
      throw new Error(`New feature test failed: ${response.status}`);
    }
    
    return response.data;
  }
};
```

2. Add to test suite:

```javascript
const testSuite = [
  // ... existing tests ...
  { name: 'New Feature', function: testFunctions.testNewFeature }
];
```

## 🚨 Troubleshooting

### Common Issues

1. **Environment not found**: Check that environment name is correct (development, test, staging, production)

2. **Connection refused**: Verify URLs are correct and services are running

3. **Authentication failed**: Check test user credentials in environment variables

4. **Timeout errors**: Increase timeout values in test configuration

### Debug Mode

Enable debug logging by setting environment variables:

```bash
DEBUG=true
NODE_ENV=development
```

## 🔐 Security Considerations

- Never commit real credentials to version control
- Use environment variables for sensitive data
- Consider using secrets management for production
- Rotate test user passwords regularly
- Use HTTPS for all production environments

## 📈 Monitoring

The system can be integrated with monitoring tools:

- Test results can be sent to your SaaS platform's dashboard
- Failed tests can trigger alerts
- Performance metrics can be collected
- Historical data can be analyzed for trends
