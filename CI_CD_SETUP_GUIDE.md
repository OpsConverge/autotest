# CI/CD Pipeline Setup Guide

This guide will help you set up the CI/CD pipeline to run unit, integration, API, and E2E tests against your EC2 test environment.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **EC2 Test Environment**: Your test environment should be running on EC2 (already set up)
3. **GitHub Actions**: Enabled on your repository

## Step 1: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add the following secrets:

### Required Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `TEST_ENVIRONMENT_URL` | Full URL of your test environment | `http://52.15.90.92:8081` |
| `TEST_ENVIRONMENT_IP` | IP address of your EC2 test instance | `52.15.90.92` |
| `TEST_USER_EMAIL` | Test user email for E2E tests | `test@example.com` |
| `TEST_USER_PASSWORD` | Test user password for E2E tests | `testpass123` |
| `EC2_SSH_KEY` | Private SSH key for EC2 access | Your EC2 private key content |

### Optional Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | `https://hooks.slack.com/...` |
| `CODECOV_TOKEN` | Codecov token for coverage reports | `your-codecov-token` |

## Step 2: Verify Test Environment

Before running the pipeline, ensure your test environment is properly configured:

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@52.15.90.92

# Check if services are running
cd /opt/autotest
docker-compose -f docker-compose.test.yml ps

# Test the application
curl http://localhost:8081/health
curl http://localhost:8081/api/health
```

## Step 3: Test the Pipeline

### Manual Trigger

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "CI/CD Pipeline - Test Management App"
4. Click "Run workflow"
5. Choose the branch (main or develop)
6. Click "Run workflow"

### Automatic Trigger

The pipeline will automatically run on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

## Step 4: Pipeline Jobs Overview

The pipeline consists of 7 jobs that run in sequence:

### 1. Code Quality & Linting
- Runs ESLint
- Ensures code quality standards

### 2. Unit Tests
- Runs frontend unit tests
- Generates coverage reports
- Uploads coverage to Codecov

### 3. Integration Tests
- Tests component interactions
- Tests data flow between components

### 4. API Tests
- Tests API client functionality
- Tests API endpoint interactions

### 5. Deploy to Test Environment
- Deploys latest code to EC2
- Runs database migrations
- Only runs on main/develop branches

### 6. E2E Tests
- Tests against the deployed test environment
- Tests real user workflows
- Only runs on main/develop branches

### 7. Test Results Summary
- Generates summary of all test results
- Sends notifications (if configured)

## Step 5: Local Testing

Before pushing to GitHub, test locally:

```bash
# Install dependencies
npm ci

# Run all tests locally
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:api
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## Step 6: Environment-Specific Testing

### Test Against Local Environment
```bash
# Set environment variables
export TEST_TARGET_URL=http://localhost:5173
export TEST_API_URL=http://localhost:4000/api
export TEST_USER_EMAIL=test@example.com
export TEST_USER_PASSWORD=testpass123

# Run E2E tests
npm run test:e2e
```

### Test Against EC2 Environment
```bash
# Set environment variables
export TEST_TARGET_URL=http://52.15.90.92:8081
export TEST_API_URL=http://52.15.90.92:8081/api
export TEST_USER_EMAIL=test@example.com
export TEST_USER_PASSWORD=testpass123

# Run E2E tests
npm run test:e2e
```

## Step 7: Troubleshooting

### Common Issues

1. **EC2 SSH Connection Failed**
   - Verify the SSH key is correct
   - Check EC2 security group allows SSH (port 22)
   - Ensure the EC2 instance is running

2. **Test Environment Not Accessible**
   - Check if Docker containers are running
   - Verify ports are open in security group
   - Check application logs: `docker-compose -f docker-compose.test.yml logs`

3. **Tests Failing**
   - Check test environment variables
   - Verify test user credentials
   - Check application health endpoints

4. **Deployment Issues**
   - Check Docker build logs
   - Verify database migrations
   - Check container health

### Debug Commands

```bash
# Check EC2 instance status
ssh -i your-key.pem ubuntu@52.15.90.92 "cd /opt/autotest && docker-compose -f docker-compose.test.yml ps"

# Check application logs
ssh -i your-key.pem ubuntu@52.15.90.92 "cd /opt/autotest && docker-compose -f docker-compose.test.yml logs"

# Test application endpoints
curl http://52.15.90.92:8081/health
curl http://52.15.90.92:8081/api/health

# Check database connectivity
ssh -i your-key.pem ubuntu@52.15.90.92 "cd /opt/autotest && docker-compose -f docker-compose.test.yml exec backend npx prisma db push"
```

## Step 8: Monitoring and Notifications

### GitHub Actions Notifications
- Pipeline results are automatically shown in GitHub
- Failed jobs will be highlighted
- Test summaries are generated for each run

### Slack Notifications (Optional)
If you configured Slack webhook:
- Success/failure notifications
- Test result summaries
- Deployment status updates

### Coverage Reports
- Coverage reports are uploaded to Codecov
- View coverage trends over time
- Identify areas needing more tests

## Step 9: Best Practices

1. **Always test locally first**
2. **Keep test data isolated**
3. **Use meaningful test descriptions**
4. **Maintain test coverage above 80%**
5. **Review failed tests promptly**
6. **Keep test environment stable**

## Step 10: Next Steps

Once the pipeline is working:

1. **Add more test cases** to increase coverage
2. **Set up staging environment** for pre-production testing
3. **Configure production deployment** pipeline
4. **Add performance testing** to the pipeline
5. **Set up monitoring and alerting**

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review GitHub Actions logs for detailed error messages
3. Verify all secrets are correctly configured
4. Ensure your test environment is healthy

The pipeline is designed to catch issues early and ensure your application is always in a deployable state! 🚀
