#!/usr/bin/env node

/**
 * Mock Test Scripts
 * Simulates test execution with controlled flakiness for testing flakiness detection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MockTestRunner {
  constructor(framework, testType) {
    this.framework = framework;
    this.testType = testType;
    this.enableFlakiness = process.env.ENABLE_FLAKINESS === 'true';
    this.flakinessRate = this.getFlakinessRate();
  }

  getFlakinessRate() {
    const rates = {
      'jest': 0.3,
      'junit': 0.25,
      'pytest': 0.2,
      'supertest': 0.35,
      'springboot': 0.3,
      'postman': 0.4,
      'restassured': 0.35,
      'karate': 0.3,
      'playwright': 0.45,
      'cypress': 0.4,
      'selenium': 0.5
    };
    return rates[this.framework] || 0.3;
  }

  async runMockTests() {
    console.log(`🧪 Running mock ${this.framework} ${this.testType} tests...`);
    
    const testCount = this.getTestCount();
    const results = {
      framework: this.framework,
      testType: this.testType,
      timestamp: new Date().toISOString(),
      totalTests: testCount,
      passed: 0,
      failed: 0,
      flaky: 0,
      executionTime: 0,
      tests: []
    };

    const startTime = Date.now();

    for (let i = 1; i <= testCount; i++) {
      const testResult = await this.runMockTest(i);
      results.tests.push(testResult);
      
      if (testResult.status === 'passed') {
        results.passed++;
      } else if (testResult.status === 'failed') {
        results.failed++;
        if (testResult.flaky) {
          results.flaky++;
        }
      }
    }

    results.executionTime = Date.now() - startTime;
    results.flakinessRate = (results.flaky / testCount) * 100;

    this.saveResults(results);
    this.printSummary(results);
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  }

  getTestCount() {
    const counts = {
      'jest': 10,
      'junit': 8,
      'pytest': 12,
      'supertest': 15,
      'springboot': 12,
      'postman': 18,
      'restassured': 15,
      'karate': 12,
      'playwright': 20,
      'cypress': 18,
      'selenium': 22
    };
    return counts[this.framework] || 10;
  }

  async runMockTest(testNumber) {
    const testName = this.generateTestName(testNumber);
    const isFlaky = this.enableFlakiness && Math.random() < this.flakinessRate;
    const shouldPass = isFlaky ? Math.random() > 0.6 : Math.random() > 0.1;
    
    // Simulate test execution time
    const executionTime = Math.random() * 2000 + 100; // 100-2100ms
    await this.sleep(executionTime);

    const result = {
      name: testName,
      status: shouldPass ? 'passed' : 'failed',
      executionTime: Math.round(executionTime),
      flaky: isFlaky,
      error: shouldPass ? null : this.generateErrorMessage(),
      timestamp: new Date().toISOString()
    };

    console.log(`  ${result.status === 'passed' ? '✅' : '❌'} ${testName} (${result.executionTime}ms)${isFlaky ? ' [FLAKY]' : ''}`);
    
    return result;
  }

  generateTestName(testNumber) {
    const testNames = [
      'testUserAuthentication',
      'testDataValidation',
      'testAPIResponse',
      'testDatabaseConnection',
      'testUIComponent',
      'testNetworkRequest',
      'testFileUpload',
      'testEmailSending',
      'testPaymentProcessing',
      'testSearchFunctionality',
      'testUserRegistration',
      'testPasswordReset',
      'testProfileUpdate',
      'testTeamCreation',
      'testProjectAssignment',
      'testReportGeneration',
      'testDataExport',
      'testNotificationSystem',
      'testPermissionCheck',
      'testIntegrationFlow'
    ];

    const baseName = testNames[(testNumber - 1) % testNames.length];
    return `${this.framework}_${baseName}_${testNumber}`;
  }

  generateErrorMessage() {
    const errors = [
      'Network timeout after 5000ms',
      'Database connection failed',
      'Element not found: .test-button',
      'API returned 500 Internal Server Error',
      'Assertion failed: expected "success" but got "error"',
      'Test timed out after 30 seconds',
      'Resource not available',
      'Authentication failed',
      'Validation error: Invalid email format',
      'Service unavailable'
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  saveResults(results) {
    const outputDir = './coverage';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${this.framework}-${this.testType}-results.json`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to ${filepath}`);
  }

  printSummary(results) {
    console.log('\n📊 Test Summary:');
    console.log(`Framework: ${results.framework}`);
    console.log(`Test Type: ${results.testType}`);
    console.log(`Total Tests: ${results.totalTests}`);
    console.log(`Passed: ${results.passed} ✅`);
    console.log(`Failed: ${results.failed} ❌`);
    console.log(`Flaky: ${results.flaky} 🔄`);
    console.log(`Flakiness Rate: ${results.flakinessRate.toFixed(1)}%`);
    console.log(`Execution Time: ${results.executionTime}ms`);
  }
}

// Command line interface
const framework = process.argv[2];
const testType = process.argv[3] || 'unit';

if (!framework) {
  console.error('Usage: node scripts/mock-tests.js <framework> [testType]');
  console.error('Frameworks: jest, junit, pytest, supertest, springboot, postman, restassured, karate, playwright, cypress, selenium');
  console.error('Test Types: unit, integration, api, e2e');
  process.exit(1);
}

const runner = new MockTestRunner(framework, testType);
runner.runMockTests().catch(error => {
  console.error('❌ Mock test execution failed:', error.message);
  process.exit(1);
});
