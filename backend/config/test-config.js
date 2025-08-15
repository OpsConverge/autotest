const { getCurrentEnvironment, getEnvironment } = require('./environments');

// Test configuration for different environments
const testConfigs = {
  development: {
    targetUrl: 'http://localhost:5173',
    apiUrl: 'http://localhost:4000/api',
    testUsers: {
      admin: { email: 'admin@example.com', password: 'admin123' },
      user: { email: 'user@example.com', password: 'user123' }
    },
    testData: {
      teamName: 'Test Team',
      projectName: 'Test Project'
    },
    timeouts: {
      pageLoad: 10000,
      elementWait: 5000,
      apiCall: 10000
    }
  },
  test: {
    targetUrl: process.env.TEST_TARGET_URL || 'https://test.yourdomain.com',
    apiUrl: process.env.TEST_API_URL || 'https://test.yourdomain.com/api',
    testUsers: {
      admin: { 
        email: process.env.TEST_USER_EMAIL || 'admin@example.com', 
        password: process.env.TEST_USER_PASSWORD || 'admin123' 
      },
      user: { 
        email: process.env.TEST_USER_EMAIL || 'user@test.yourdomain.com', 
        password: process.env.TEST_USER_PASSWORD || 'user123' 
      }
    },
    testData: {
      teamName: 'Test Environment Team',
      projectName: 'Test Environment Project'
    },
    timeouts: {
      pageLoad: 15000,
      elementWait: 10000,
      apiCall: 15000
    }
  },
  staging: {
    targetUrl: process.env.STAGING_TARGET_URL || 'https://staging.yourdomain.com',
    apiUrl: process.env.STAGING_API_URL || 'https://staging.yourdomain.com/api',
    testUsers: {
      admin: { 
        email: process.env.STAGING_ADMIN_EMAIL || 'admin@staging.yourdomain.com', 
        password: process.env.STAGING_ADMIN_PASSWORD || 'admin123' 
      },
      user: { 
        email: process.env.STAGING_USER_EMAIL || 'user@staging.yourdomain.com', 
        password: process.env.STAGING_USER_PASSWORD || 'user123' 
      }
    },
    testData: {
      teamName: 'Staging Team',
      projectName: 'Staging Project'
    },
    timeouts: {
      pageLoad: 20000,
      elementWait: 15000,
      apiCall: 20000
    }
  },
  production: {
    targetUrl: process.env.PROD_TARGET_URL || 'https://yourdomain.com',
    apiUrl: process.env.PROD_API_URL || 'https://yourdomain.com/api',
    testUsers: {
      admin: { 
        email: process.env.PROD_ADMIN_EMAIL || 'admin@yourdomain.com', 
        password: process.env.PROD_ADMIN_PASSWORD || 'admin123' 
      },
      user: { 
        email: process.env.PROD_USER_EMAIL || 'user@yourdomain.com', 
        password: process.env.PROD_USER_PASSWORD || 'user123' 
      }
    },
    testData: {
      teamName: 'Production Team',
      projectName: 'Production Project'
    },
    timeouts: {
      pageLoad: 30000,
      elementWait: 20000,
      apiCall: 30000
    }
  }
};

// Get test configuration for current environment
const getTestConfig = () => {
  const currentEnv = getCurrentEnvironment();
  const envName = process.env.NODE_ENV || 'development';
  return testConfigs[envName] || testConfigs.development;
};

// Get test configuration for specific environment
const getTestConfigForEnv = (envName) => {
  return testConfigs[envName] || testConfigs.development;
};

// Get all test configurations
const getAllTestConfigs = () => {
  return testConfigs;
};

module.exports = {
  getTestConfig,
  getTestConfigForEnv,
  getAllTestConfigs,
  testConfigs
};
