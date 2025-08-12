const { getTestConfig, getTestConfigForEnv } = require('../config/test-config');

class EnvironmentClient {
  constructor(targetEnvironment = null) {
    this.targetEnvironment = targetEnvironment;
    this.config = targetEnvironment ? 
      getTestConfigForEnv(targetEnvironment) : 
      getTestConfig();
  }

  // Get the current target URL
  getTargetUrl() {
    return this.config.targetUrl;
  }

  // Get the current API URL
  getApiUrl() {
    return this.config.apiUrl;
  }

  // Get test user credentials
  getTestUser(userType = 'admin') {
    return this.config.testUsers[userType] || this.config.testUsers.admin;
  }

  // Get test data
  getTestData() {
    return this.config.testData;
  }

  // Get timeouts
  getTimeouts() {
    return this.config.timeouts;
  }

  // Make API request with environment-specific configuration
  async makeRequest(endpoint, options = {}) {
    const url = `${this.getApiUrl()}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: this.getTimeouts().apiCall
    };

    const requestOptions = {
      ...defaultOptions,
      ...options
    };

    try {
      const response = await fetch(url, requestOptions);
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => null),
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message,
        data: null
      };
    }
  }

  // Login with test user
  async login(userType = 'admin') {
    const user = this.getTestUser(userType);
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });

    if (response.ok && response.data?.token) {
      this.token = response.data.token;
      return response.data;
    }
    
    throw new Error(`Login failed: ${response.error || 'Unknown error'}`);
  }

  // Make authenticated request
  async authenticatedRequest(endpoint, options = {}) {
    if (!this.token) {
      await this.login();
    }

    return this.makeRequest(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`
      }
    });
  }

  // Switch to different environment
  switchEnvironment(environmentName) {
    this.targetEnvironment = environmentName;
    this.config = getTestConfigForEnv(environmentName);
    this.token = null; // Clear token when switching environments
  }

  // Get current environment info
  getEnvironmentInfo() {
    return {
      environment: this.targetEnvironment || process.env.NODE_ENV || 'development',
      targetUrl: this.getTargetUrl(),
      apiUrl: this.getApiUrl(),
      hasToken: !!this.token
    };
  }
}

// Create singleton instance
const environmentClient = new EnvironmentClient();

module.exports = {
  EnvironmentClient,
  environmentClient
};
