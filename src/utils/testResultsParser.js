import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Test Results Parser for Multiple Frameworks
 * Handles parsing and normalizing test results from different testing frameworks
 */
export class TestResultsParser {
  constructor() {
    this.supportedFrameworks = {
      unit: ['vitest', 'ava', 'tap'],
      integration: ['vitest', 'ava', 'tap', 'supertest'],
      api: ['vitest', 'supertest', 'karate', 'restassured'],
      e2e: ['playwright', 'cypress', 'selenium'],
      performance: ['k6', 'jmeter', 'gatling']
    };
  }

  /**
   * Parse test results from a specific framework
   * @param {string} framework - The testing framework
   * @param {string} testType - Type of test (unit, integration, api, e2e, performance)
   * @param {string} resultsPath - Path to the test results file
   * @returns {Object} Normalized test results
   */
  parseResults(framework, testType, resultsPath) {
    try {
      if (!existsSync(resultsPath)) {
        console.warn(`Test results file not found: ${resultsPath}`);
        return this.getEmptyResults(framework, testType);
      }

      const rawResults = readFileSync(resultsPath, 'utf8');
      
      switch (framework) {
        case 'vitest':
          return this.parseVitestResults(rawResults, testType);
        case 'ava':
          return this.parseAvaResults(rawResults, testType);
        case 'tap':
          return this.parseTapResults(rawResults, testType);
        case 'playwright':
          return this.parsePlaywrightResults(rawResults, testType);
        case 'cypress':
          return this.parseCypressResults(rawResults, testType);
        case 'selenium':
          return this.parseSeleniumResults(rawResults, testType);
        case 'k6':
          return this.parseK6Results(rawResults, testType);
        case 'jmeter':
          return this.parseJMeterResults(rawResults, testType);
        case 'gatling':
          return this.parseGatlingResults(rawResults, testType);
        case 'supertest':
          return this.parseSupertestResults(rawResults, testType);
        case 'karate':
          return this.parseKarateResults(rawResults, testType);
        case 'restassured':
          return this.parseRestAssuredResults(rawResults, testType);
        default:
          console.warn(`Unsupported framework: ${framework}`);
          return this.getEmptyResults(framework, testType);
      }
    } catch (error) {
      console.error(`Error parsing ${framework} results:`, error);
      return this.getEmptyResults(framework, testType);
    }
  }

  /**
   * Parse Vitest results
   */
  parseVitestResults(rawResults, testType) {
    try {
      const results = JSON.parse(rawResults);
      return {
        framework: 'vitest',
        testType,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.numTotalTests || 0,
          passed: results.numPassedTests || 0,
          failed: results.numFailedTests || 0,
          skipped: results.numPendingTests || 0,
          duration: results.testResults?.[0]?.endTime - results.testResults?.[0]?.startTime || 0
        },
        details: results.testResults?.[0]?.assertionResults?.map(test => ({
          name: test.fullName,
          status: test.status,
          duration: test.duration,
          failureMessages: test.failureMessages || []
        })) || [],
        coverage: results.coverage || null
      };
    } catch (error) {
      console.error('Error parsing Vitest results:', error);
      return this.getEmptyResults('vitest', testType);
    }
  }

  /**
   * Parse AVA results
   */
  parseAvaResults(rawResults, testType) {
    try {
      const results = JSON.parse(rawResults);
      return {
        framework: 'ava',
        testType,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.stats?.testCount || 0,
          passed: results.stats?.passCount || 0,
          failed: results.stats?.failCount || 0,
          skipped: results.stats?.skipCount || 0,
          duration: results.stats?.duration || 0
        },
        details: results.tests?.map(test => ({
          name: test.title,
          status: test.passed ? 'passed' : 'failed',
          duration: test.duration,
          failureMessages: test.error ? [test.error.message] : []
        })) || [],
        coverage: results.coverage || null
      };
    } catch (error) {
      console.error('Error parsing AVA results:', error);
      return this.getEmptyResults('ava', testType);
    }
  }

  /**
   * Parse TAP results
   */
  parseTapResults(rawResults, testType) {
    try {
      const lines = rawResults.split('\n');
      const summary = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
      const details = [];

      lines.forEach(line => {
        if (line.startsWith('ok ')) {
          summary.passed++;
          summary.total++;
        } else if (line.startsWith('not ok ')) {
          summary.failed++;
          summary.total++;
        } else if (line.includes('tests ')) {
          const match = line.match(/(\d+) tests/);
          if (match) summary.total = parseInt(match[1]);
        } else if (line.includes('pass ')) {
          const match = line.match(/(\d+) pass/);
          if (match) summary.passed = parseInt(match[1]);
        } else if (line.includes('fail ')) {
          const match = line.match(/(\d+) fail/);
          if (match) summary.failed = parseInt(match[1]);
        }
      });

      return {
        framework: 'tap',
        testType,
        timestamp: new Date().toISOString(),
        summary,
        details,
        coverage: null
      };
    } catch (error) {
      console.error('Error parsing TAP results:', error);
      return this.getEmptyResults('tap', testType);
    }
  }

  /**
   * Parse Playwright results
   */
  parsePlaywrightResults(rawResults, testType) {
    try {
      const results = JSON.parse(rawResults);
      return {
        framework: 'playwright',
        testType,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.stats?.total || 0,
          passed: results.stats?.passed || 0,
          failed: results.stats?.failed || 0,
          skipped: results.stats?.skipped || 0,
          duration: results.stats?.duration || 0
        },
        details: results.suites?.[0]?.specs?.map(spec => ({
          name: spec.title,
          status: spec.tests?.[0]?.results?.[0]?.status || 'unknown',
          duration: spec.tests?.[0]?.results?.[0]?.duration || 0,
          failureMessages: spec.tests?.[0]?.results?.[0]?.error?.message ? 
            [spec.tests[0].results[0].error.message] : []
        })) || [],
        coverage: null
      };
    } catch (error) {
      console.error('Error parsing Playwright results:', error);
      return this.getEmptyResults('playwright', testType);
    }
  }

  /**
   * Parse Cypress results
   */
  parseCypressResults(rawResults, testType) {
    try {
      const results = JSON.parse(rawResults);
      return {
        framework: 'cypress',
        testType,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.totalTests || 0,
          passed: results.passes || 0,
          failed: results.failures || 0,
          skipped: results.skipped || 0,
          duration: results.duration || 0
        },
        details: results.runs?.[0]?.tests?.map(test => ({
          name: test.title?.join(' ') || 'Unknown Test',
          status: test.state,
          duration: test.duration || 0,
          failureMessages: test.displayError ? [test.displayError] : []
        })) || [],
        coverage: null
      };
    } catch (error) {
      console.error('Error parsing Cypress results:', error);
      return this.getEmptyResults('cypress', testType);
    }
  }

  /**
   * Parse Selenium results
   */
  parseSeleniumResults(rawResults, testType) {
    try {
      const results = JSON.parse(rawResults);
      return {
        framework: 'selenium',
        testType,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.total || 0,
          passed: results.passed || 0,
          failed: results.failed || 0,
          skipped: results.skipped || 0,
          duration: results.duration || 0
        },
        details: results.tests?.map(test => ({
          name: test.name,
          status: test.status,
          duration: test.duration || 0,
          failureMessages: test.error ? [test.error] : []
        })) || [],
        coverage: null
      };
    } catch (error) {
      console.error('Error parsing Selenium results:', error);
      return this.getEmptyResults('selenium', testType);
    }
  }

  /**
   * Parse k6 performance results
   */
  parseK6Results(rawResults, testType) {
    try {
      const results = JSON.parse(rawResults);
      return {
        framework: 'k6',
        testType,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.metrics?.iterations?.count || 0,
          passed: results.metrics?.checks?.passes || 0,
          failed: results.metrics?.checks?.fails || 0,
          skipped: 0,
          duration: results.metrics?.test_duration?.value || 0
        },
        details: [{
          name: 'Performance Test',
          status: results.metrics?.checks?.fails > 0 ? 'failed' : 'passed',
          duration: results.metrics?.test_duration?.value || 0,
          failureMessages: []
        }],
        performance: {
          avgResponseTime: results.metrics?.http_req_duration?.avg || 0,
          maxResponseTime: results.metrics?.http_req_duration?.max || 0,
          requestsPerSecond: results.metrics?.http_reqs?.rate || 0,
          totalRequests: results.metrics?.http_reqs?.count || 0,
          errorRate: results.metrics?.http_req_failed?.rate || 0
        }
      };
    } catch (error) {
      console.error('Error parsing k6 results:', error);
      return this.getEmptyResults('k6', testType);
    }
  }

  /**
   * Parse JMeter results
   */
  parseJMeterResults(rawResults, testType) {
    try {
      // JMeter results are typically in CSV format
      const lines = rawResults.split('\n');
      const summary = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
      
      lines.forEach(line => {
        if (line.includes('true')) {
          summary.passed++;
        } else if (line.includes('false')) {
          summary.failed++;
        }
        summary.total++;
      });

      return {
        framework: 'jmeter',
        testType,
        timestamp: new Date().toISOString(),
        summary,
        details: [{
          name: 'JMeter Load Test',
          status: summary.failed > 0 ? 'failed' : 'passed',
          duration: summary.duration,
          failureMessages: []
        }],
        performance: {
          avgResponseTime: 0, // Would need to parse from JMeter CSV
          maxResponseTime: 0,
          requestsPerSecond: 0,
          totalRequests: summary.total,
          errorRate: summary.failed / summary.total * 100
        }
      };
    } catch (error) {
      console.error('Error parsing JMeter results:', error);
      return this.getEmptyResults('jmeter', testType);
    }
  }

  /**
   * Parse Gatling results
   */
  parseGatlingResults(rawResults, testType) {
    try {
      const results = JSON.parse(rawResults);
      return {
        framework: 'gatling',
        testType,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.numberOfRequests?.total || 0,
          passed: results.numberOfRequests?.ok || 0,
          failed: results.numberOfRequests?.ko || 0,
          skipped: 0,
          duration: results.duration || 0
        },
        details: [{
          name: 'Gatling Load Test',
          status: results.numberOfRequests?.ko > 0 ? 'failed' : 'passed',
          duration: results.duration || 0,
          failureMessages: []
        }],
        performance: {
          avgResponseTime: results.meanResponseTime || 0,
          maxResponseTime: results.maxResponseTime || 0,
          requestsPerSecond: results.requestPerSec || 0,
          totalRequests: results.numberOfRequests?.total || 0,
          errorRate: results.numberOfRequests?.ko / results.numberOfRequests?.total * 100 || 0
        }
      };
    } catch (error) {
      console.error('Error parsing Gatling results:', error);
      return this.getEmptyResults('gatling', testType);
    }
  }

  /**
   * Parse Supertest results
   */
  parseSupertestResults(rawResults, testType) {
    try {
      const results = JSON.parse(rawResults);
      return {
        framework: 'supertest',
        testType,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.total || 0,
          passed: results.passed || 0,
          failed: results.failed || 0,
          skipped: results.skipped || 0,
          duration: results.duration || 0
        },
        details: results.tests?.map(test => ({
          name: test.name,
          status: test.status,
          duration: test.duration || 0,
          failureMessages: test.error ? [test.error] : []
        })) || [],
        coverage: null
      };
    } catch (error) {
      console.error('Error parsing Supertest results:', error);
      return this.getEmptyResults('supertest', testType);
    }
  }

  /**
   * Parse Karate-style results
   */
  parseKarateResults(rawResults, testType) {
    try {
      const results = JSON.parse(rawResults);
      return {
        framework: 'karate',
        testType,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.total || 0,
          passed: results.passed || 0,
          failed: results.failed || 0,
          skipped: results.skipped || 0,
          duration: results.duration || 0
        },
        details: results.scenarios?.map(scenario => ({
          name: scenario.name,
          status: scenario.status,
          duration: scenario.duration || 0,
          failureMessages: scenario.error ? [scenario.error] : []
        })) || [],
        coverage: null
      };
    } catch (error) {
      console.error('Error parsing Karate results:', error);
      return this.getEmptyResults('karate', testType);
    }
  }

  /**
   * Parse REST Assured-style results
   */
  parseRestAssuredResults(rawResults, testType) {
    try {
      const results = JSON.parse(rawResults);
      return {
        framework: 'restassured',
        testType,
        timestamp: new Date().toISOString(),
        summary: {
          total: results.total || 0,
          passed: results.passed || 0,
          failed: results.failed || 0,
          skipped: results.skipped || 0,
          duration: results.duration || 0
        },
        details: results.tests?.map(test => ({
          name: test.name,
          status: test.status,
          duration: test.duration || 0,
          failureMessages: test.error ? [test.error] : []
        })) || [],
        coverage: null
      };
    } catch (error) {
      console.error('Error parsing REST Assured results:', error);
      return this.getEmptyResults('restassured', testType);
    }
  }

  /**
   * Get empty results structure for a framework
   */
  getEmptyResults(framework, testType) {
    return {
      framework,
      testType,
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      details: [],
      coverage: null,
      performance: testType === 'performance' ? {
        avgResponseTime: 0,
        maxResponseTime: 0,
        requestsPerSecond: 0,
        totalRequests: 0,
        errorRate: 0
      } : null
    };
  }

  /**
   * Generate a unified test report from multiple framework results
   * @param {Array} results - Array of parsed test results
   * @returns {Object} Unified test report
   */
  generateUnifiedReport(results) {
    const unified = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      frameworks: {},
      performance: null,
      coverage: null
    };

    results.forEach(result => {
      // Aggregate summary
      unified.summary.total += result.summary.total;
      unified.summary.passed += result.summary.passed;
      unified.summary.failed += result.summary.failed;
      unified.summary.skipped += result.summary.skipped;
      unified.summary.duration += result.summary.duration;

      // Store framework-specific results
      unified.frameworks[result.framework] = {
        testType: result.testType,
        ...result
      };

      // Aggregate performance metrics
      if (result.performance) {
        if (!unified.performance) {
          unified.performance = {
            avgResponseTime: 0,
            maxResponseTime: 0,
            requestsPerSecond: 0,
            totalRequests: 0,
            errorRate: 0
          };
        }
        unified.performance.avgResponseTime = Math.max(unified.performance.avgResponseTime, result.performance.avgResponseTime);
        unified.performance.maxResponseTime = Math.max(unified.performance.maxResponseTime, result.performance.maxResponseTime);
        unified.performance.requestsPerSecond += result.performance.requestsPerSecond;
        unified.performance.totalRequests += result.performance.totalRequests;
        unified.performance.errorRate = Math.max(unified.performance.errorRate, result.performance.errorRate);
      }

      // Aggregate coverage
      if (result.coverage) {
        if (!unified.coverage) {
          unified.coverage = { statements: 0, branches: 0, functions: 0, lines: 0 };
        }
        // Simple average for now
        unified.coverage.statements = (unified.coverage.statements + result.coverage.statements) / 2;
        unified.coverage.branches = (unified.coverage.branches + result.coverage.branches) / 2;
        unified.coverage.functions = (unified.coverage.functions + result.coverage.functions) / 2;
        unified.coverage.lines = (unified.coverage.lines + result.coverage.lines) / 2;
      }
    });

    return unified;
  }

  /**
   * Format results for display in the UI
   * @param {Object} results - Parsed test results
   * @returns {Object} Formatted results for UI display
   */
  formatForDisplay(results) {
    const successRate = results.summary.total > 0 ? 
      (results.summary.passed / results.summary.total * 100).toFixed(1) : 0;

    return {
      ...results,
      display: {
        successRate: `${successRate}%`,
        status: results.summary.failed === 0 ? 'success' : 'failure',
        duration: this.formatDuration(results.summary.duration),
        summary: `${results.summary.passed}/${results.summary.total} tests passed`,
        framework: results.framework,
        testType: results.testType
      }
    };
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

export default TestResultsParser;
