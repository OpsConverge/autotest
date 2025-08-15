#!/usr/bin/env node

const { environmentClient } = require('../utils/environmentClient');
const { getTestConfigForEnv } = require('../config/test-config');

// Test runner for different environments
class TestRunner {
  constructor() {
    this.results = [];
    this.currentEnvironment = null;
  }

  // Set target environment
  setEnvironment(environmentName) {
    this.currentEnvironment = environmentName;
    environmentClient.switchEnvironment(environmentName);
    console.log(`🎯 Testing against: ${environmentName}`);
    console.log(`📍 Target URL: ${environmentClient.getTargetUrl()}`);
  }

  // Run a single test
  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    
    const startTime = Date.now();
    try {
      const result = await testFunction(environmentClient);
      const duration = Date.now() - startTime;
      
      const testResult = {
        name: testName,
        status: 'passed',
        duration,
        timestamp: new Date().toISOString(),
        environment: this.currentEnvironment
      };
      
      this.results.push(testResult);
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      return testResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const testResult = {
        name: testName,
        status: 'failed',
        duration,
        error: error.message,
        timestamp: new Date().toISOString(),
        environment: this.currentEnvironment
      };
      
      this.results.push(testResult);
      console.log(`❌ ${testName} - FAILED (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      return testResult;
    }
  }

  // Run test suite
  async runTestSuite(tests) {
    console.log(`\n🚀 Starting test suite for environment: ${this.currentEnvironment}`);
    
    for (const test of tests) {
      await this.runTest(test.name, test.function);
    }
    
    this.printSummary();
  }

  // Print test summary
  printSummary() {
    console.log(`\n📊 Test Summary for ${this.currentEnvironment}:`);
    console.log(`   Total tests: ${this.results.length}`);
    console.log(`   Passed: ${this.results.filter(r => r.status === 'passed').length}`);
    console.log(`   Failed: ${this.results.filter(r => r.status === 'failed').length}`);
    console.log(`   Success rate: ${((this.results.filter(r => r.status === 'passed').length / this.results.length) * 100).toFixed(1)}%`);
  }

  // Get all results
  getResults() {
    return this.results;
  }

  // Clear results
  clearResults() {
    this.results = [];
  }
}

// Example test functions
const testFunctions = {
  // Test user registration
  async testUserRegistration(client) {
    const testEmail = `test-${Date.now()}@example.com`;
    const response = await client.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'testpass123'
      })
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    if (!response.data?.team) {
      throw new Error('Registration response missing team data');
    }

    return response.data;
  },

  // Test user login
  async testUserLogin(client) {
    try {
      // First try to login with the configured test user
      const response = await client.login('admin');
      
      if (!response.token) {
        throw new Error('Login failed - no token received');
      }

      return response;
    } catch (error) {
      console.log('Login failed, attempting to register test user...');
      
      // If login fails, try to register a new test user
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'testpass123';
      
      const registerResponse = await client.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      if (!registerResponse.ok) {
        throw new Error(`Registration failed: ${registerResponse.status} - ${JSON.stringify(registerResponse.data)}`);
      }

      // Now try to login with the newly registered user
      const loginResponse = await client.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      if (!loginResponse.ok || !loginResponse.data?.token) {
        throw new Error('Login failed after registration');
      }

      // Store the token for subsequent requests
      client.token = loginResponse.data.token;
      return loginResponse.data;
    }
  },

  // Test dashboard access
  async testDashboardAccess(client) {
    const response = await client.authenticatedRequest('/teams');
    
    if (!response.ok) {
      throw new Error(`Dashboard access failed: ${response.status}`);
    }

    if (!response.data?.teams) {
      throw new Error('Dashboard response missing teams data');
    }

    return response.data;
  },

  // Test settings page
  async testSettingsPage(client) {
    // First get the user's teams to find the correct team ID
    const teamsResponse = await client.authenticatedRequest('/teams');
    
    if (!teamsResponse.ok) {
      throw new Error(`Failed to get teams: ${teamsResponse.status}`);
    }

    if (!teamsResponse.data?.teams || teamsResponse.data.teams.length === 0) {
      throw new Error('No teams found for user');
    }

    // Use the first team's ID
    const teamId = teamsResponse.data.teams[0].id;
    
    const response = await client.authenticatedRequest(`/teams/${teamId}/settings`);
    
    if (!response.ok) {
      throw new Error(`Settings access failed: ${response.status}`);
    }

    return response.data;
  },

  // Test integrations page
  async testIntegrationsPage(client) {
    // First get the user's teams to find the correct team ID
    const teamsResponse = await client.authenticatedRequest('/teams');
    
    if (!teamsResponse.ok) {
      throw new Error(`Failed to get teams: ${teamsResponse.status}`);
    }

    if (!teamsResponse.data?.teams || teamsResponse.data.teams.length === 0) {
      throw new Error('No teams found for user');
    }

    // Use the first team's ID
    const teamId = teamsResponse.data.teams[0].id;
    
    // Test GitHub integration status endpoint with the correct team ID
    const response = await client.authenticatedRequest(`/teams/${teamId}/github/status`);
    
    if (!response.ok) {
      throw new Error(`Integrations access failed: ${response.status}`);
    }

    return response.data;
  }
};

// Main execution
async function main() {
  const runner = new TestRunner();
  
  // Get environment from command line arguments
  const targetEnv = process.argv[2] || 'development';
  
  // Validate environment
  const validEnvironments = ['development', 'test', 'staging', 'production'];
  if (!validEnvironments.includes(targetEnv)) {
    console.error(`❌ Invalid environment: ${targetEnv}`);
    console.error(`   Valid environments: ${validEnvironments.join(', ')}`);
    process.exit(1);
  }

  // Set environment
  runner.setEnvironment(targetEnv);

  // Define test suite
  const testSuite = [
    { name: 'User Registration', function: testFunctions.testUserRegistration },
    { name: 'User Login', function: testFunctions.testUserLogin },
    { name: 'Dashboard Access', function: testFunctions.testDashboardAccess },
    { name: 'Settings Page', function: testFunctions.testSettingsPage },
    { name: 'Integrations Page', function: testFunctions.testIntegrationsPage }
  ];

  // Run tests
  await runner.runTestSuite(testSuite);

  // Exit with appropriate code
  const failedTests = runner.results.filter(r => r.status === 'failed').length;
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  TestRunner,
  testFunctions
};
