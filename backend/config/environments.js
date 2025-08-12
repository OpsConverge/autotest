// Environment configuration for different deployment stages
const environments = {
  development: {
    name: 'Development',
    baseUrl: 'http://localhost:5173',
    apiUrl: 'http://localhost:4000/api',
    database: 'autotest_dev',
    features: {
      selfTesting: false,
      realTimeUpdates: true,
      debugMode: true
    }
  },
  test: {
    name: 'Test Environment',
    baseUrl: process.env.TEST_BASE_URL || 'https://test.yourdomain.com',
    apiUrl: process.env.TEST_API_URL || 'https://test.yourdomain.com/api',
    database: 'autotest_test',
    features: {
      selfTesting: true,
      realTimeUpdates: true,
      debugMode: false
    }
  },
  staging: {
    name: 'Staging Environment',
    baseUrl: process.env.STAGING_BASE_URL || 'https://staging.yourdomain.com',
    apiUrl: process.env.STAGING_API_URL || 'https://staging.yourdomain.com/api',
    database: 'autotest_staging',
    features: {
      selfTesting: true,
      realTimeUpdates: true,
      debugMode: false
    }
  },
  production: {
    name: 'Production',
    baseUrl: process.env.PROD_BASE_URL || 'https://yourdomain.com',
    apiUrl: process.env.PROD_API_URL || 'https://yourdomain.com/api',
    database: 'autotest_prod',
    features: {
      selfTesting: true,
      realTimeUpdates: true,
      debugMode: false
    }
  }
};

// Get current environment
const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return environments[env] || environments.development;
};

// Get environment by name
const getEnvironment = (envName) => {
  return environments[envName] || environments.development;
};

// Get all environments
const getAllEnvironments = () => {
  return environments;
};

module.exports = {
  getCurrentEnvironment,
  getEnvironment,
  getAllEnvironments,
  environments
};
