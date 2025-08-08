# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth integration for the Base44 Test Management App.

## Prerequisites

- A GitHub account
- Access to GitHub Developer Settings

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:

   **Application name**: `Base44 Test Management`
   
   **Homepage URL**: `http://localhost:3000`
   
   **Application description**: `Test management and CI/CD integration platform`
   
   **Authorization callback URL**: `http://localhost:4000/api/teams/callback/github`

4. Click "Register application"

## Step 2: Get Your OAuth Credentials

After creating the OAuth app, you'll see:
- **Client ID**: A long string (e.g., `abc123def456`)
- **Client Secret**: Click "Generate a new client secret" to get this

## Step 3: Update Environment Variables

### Option A: Docker Compose (Recommended)

Update the `docker-compose.yml` file in the backend service environment section:

```yaml
environment:
  NODE_ENV: development
  DATABASE_URL: postgresql://base44_user:base44_password@postgres:5432/base44_test_management
  JWT_SECRET: your-super-secret-jwt-key-change-in-production
  PORT: 4000
  # GitHub OAuth Configuration
  GITHUB_CLIENT_ID: your_actual_client_id_here
  GITHUB_CLIENT_SECRET: your_actual_client_secret_here
  GITHUB_CALLBACK_URL: http://localhost:4000/api/github/callback
  TEAM_GITHUB_CALLBACK_URL: http://localhost:4000/api/teams/callback/github
```

### Option B: Environment File

Create a `.env` file in the `backend` directory:

```bash
# Database
DATABASE_URL=postgresql://base44_user:base44_password@localhost:5432/base44_test_management

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
NODE_ENV=development
PORT=4000

# GitHub OAuth
GITHUB_CLIENT_ID=your_actual_client_id_here
GITHUB_CLIENT_SECRET=your_actual_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:4000/api/github/callback
TEAM_GITHUB_CALLBACK_URL=http://localhost:4000/api/teams/callback/github
```

## Step 4: Restart the Application

After updating the environment variables, restart the backend container:

```bash
docker-compose restart backend
```

## Step 5: Test the Integration

1. Start the application: `docker-compose up`
2. Navigate to `http://localhost:3000`
3. Login to your account
4. Go to **Settings** → **Integrations**
5. Click **Connect GitHub**
6. You should be redirected to GitHub's authorization page
7. Authorize the application
8. You should be redirected back to the integrations page with GitHub connected

## Troubleshooting

### Common Issues

1. **401 Unauthorized Error**
   - ✅ **Fixed**: The authentication issue has been resolved. The backend now accepts tokens from query parameters.

2. **Invalid redirect URI**
   - Make sure the callback URL in your GitHub OAuth app matches exactly: `http://localhost:4000/api/teams/callback/github`

3. **Client ID/Secret not working**
   - Double-check that you've updated the environment variables correctly
   - Restart the backend container after making changes

4. **GitHub API rate limiting**
   - The app uses GitHub's API to fetch repositories and workflows
   - Rate limits apply based on your GitHub account type

### Debug Mode

To see detailed logs, check the backend container logs:

```bash
docker-compose logs backend --tail=50
```

## Security Notes

- Never commit your GitHub OAuth credentials to version control
- Use environment variables for sensitive configuration
- The client secret should be kept secure and not exposed in client-side code
- Consider using GitHub Apps instead of OAuth Apps for more granular permissions

## Production Deployment

For production deployment, update the callback URLs to use your production domain:

```yaml
GITHUB_CALLBACK_URL: https://yourdomain.com/api/github/callback
TEAM_GITHUB_CALLBACK_URL: https://yourdomain.com/api/teams/callback/github
```

And update the GitHub OAuth app settings accordingly.
