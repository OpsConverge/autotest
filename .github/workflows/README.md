# CI/CD Pipeline Documentation

This directory contains GitHub Actions workflows for automated testing, building, and deployment of the Base44 Test Management App to AWS.

## 🚀 Workflows Overview

### 1. **CI/CD Pipeline** (`ci.yml`)
Complete pipeline for testing, building, and deploying to AWS.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- ✅ **Test** - Runs unit tests, integration tests, and coverage
- 🏗️ **Build** - Builds the application for production
- 🔒 **Security** - Runs vulnerability scans
- 🚀 **Deploy Staging** - Deploys to staging environment (develop branch)
- 🚀 **Deploy Production** - Deploys to production environment (main branch)
- 📊 **Performance** - Runs Lighthouse performance tests

### 2. **Test Suite** (`test-only.yml`)
Lightweight workflow for running tests only.

**Triggers:**
- Push to any branch
- Pull requests
- Manual trigger

**Jobs:**
- ✅ **Test** - Runs tests and reports coverage

## 🛠️ Setup Instructions

### 1. GitHub Repository Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

#### AWS Credentials
```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

#### S3 Buckets
```
STAGING_S3_BUCKET=your-staging-bucket-name
PRODUCTION_S3_BUCKET=your-production-bucket-name
```

#### CloudFront Distributions
```
STAGING_CLOUDFRONT_ID=your_staging_cloudfront_id
PRODUCTION_CLOUDFRONT_ID=your_production_cloudfront_id
```

#### Domain
```
DOMAIN=yourdomain.com
```

#### Optional: Performance Testing
```
LHCI_GITHUB_APP_TOKEN=your_lighthouse_ci_token
```

### 2. AWS Infrastructure Setup

#### S3 Buckets
Create two S3 buckets for hosting:

```bash
# Staging bucket
aws s3 mb s3://your-staging-bucket-name
aws s3 website s3://your-staging-bucket-name --index-document index.html --error-document index.html

# Production bucket
aws s3 mb s3://your-production-bucket-name
aws s3 website s3://your-production-bucket-name --index-document index.html --error-document index.html
```

#### CloudFront Distributions
Create CloudFront distributions for each bucket:

```bash
# Create staging distribution
aws cloudfront create-distribution \
  --distribution-config file://staging-distribution-config.json

# Create production distribution
aws cloudfront create-distribution \
  --distribution-config file://production-distribution-config.json
```

#### IAM User for GitHub Actions
Create an IAM user with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-staging-bucket-name",
        "arn:aws:s3:::your-staging-bucket-name/*",
        "arn:aws:s3:::your-production-bucket-name",
        "arn:aws:s3:::your-production-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": [
        "arn:aws:cloudfront::*:distribution/*"
      ]
    }
  ]
}
```

### 3. Environment Protection Rules

Set up environment protection rules in GitHub:

1. Go to `Settings > Environments`
2. Create `staging` and `production` environments
3. Add protection rules:
   - **Required reviewers** for production deployments
   - **Wait timer** for production deployments
   - **Deployment branches** restrictions

## 🔄 Workflow Execution

### Automatic Triggers

1. **Feature Development:**
   - Push to `feature/*` branches → Runs test suite only
   - Create PR → Runs test suite and reports results

2. **Staging Deployment:**
   - Push to `develop` branch → Full pipeline to staging

3. **Production Deployment:**
   - Push to `main` branch → Full pipeline to production

### Manual Triggers

You can manually trigger workflows:

1. Go to `Actions` tab in GitHub
2. Select the workflow
3. Click `Run workflow`
4. Choose branch and options

## 📊 Monitoring and Reporting

### Test Results
- Coverage reports uploaded to Codecov
- Test artifacts available for download
- PR comments with test results summary

### Deployment Status
- GitHub releases created for production deployments
- Deployment notifications in workflow logs
- Environment protection ensures safe deployments

### Performance Monitoring
- Lighthouse CI reports for performance metrics
- Performance artifacts available for analysis
- Performance regression detection

## 🐛 Troubleshooting

### Common Issues

1. **Tests Failing:**
   ```bash
   # Run tests locally first
   npm run test:run
   npm run test:coverage
   ```

2. **Build Failures:**
   ```bash
   # Check build locally
   npm run build
   ```

3. **AWS Permission Errors:**
   - Verify IAM user has correct permissions
   - Check AWS credentials in GitHub secrets
   - Ensure S3 buckets and CloudFront distributions exist

4. **Deployment Failures:**
   - Check S3 bucket names in secrets
   - Verify CloudFront distribution IDs
   - Ensure environment protection rules are satisfied

### Debug Workflows

1. **Enable Debug Logging:**
   Add this secret to your repository:
   ```
   ACTIONS_STEP_DEBUG=true
   ```

2. **Re-run Failed Jobs:**
   - Go to the failed workflow run
   - Click "Re-run jobs" or "Re-run all jobs"

3. **Download Artifacts:**
   - Test results and coverage reports are available as artifacts
   - Download and analyze locally if needed

## 🔧 Customization

### Environment-Specific Configurations

You can customize the workflows for different environments:

1. **Add Environment Variables:**
   ```yaml
   env:
     NODE_ENV: production
     API_URL: https://api.yourdomain.com
   ```

2. **Conditional Steps:**
   ```yaml
   - name: Run E2E Tests
     if: github.ref == 'refs/heads/main'
     run: npm run test:e2e
   ```

3. **Parallel Jobs:**
   ```yaml
   strategy:
     matrix:
       node-version: [16.x, 18.x, 20.x]
   ```

### Adding New Environments

To add a new environment (e.g., `preview`):

1. Create new S3 bucket and CloudFront distribution
2. Add secrets for the new environment
3. Create new environment in GitHub
4. Add deployment job to workflow
5. Configure protection rules

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS S3 Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Distributions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-overview.html)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

For questions about the CI/CD pipeline, please contact the development team or refer to the main project documentation.
