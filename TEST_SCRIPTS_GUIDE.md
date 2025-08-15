# Test Scripts Guide

## Overview

This project includes comprehensive test scripts for all the pipelines we created. Each test type has multiple framework implementations, and there are scripts to run individual frameworks, specific test types, or all tests together.

## Test Script Categories

### 🧪 **Unit Test Scripts**

#### Individual Framework Scripts
```bash
# Vitest (default)
npm run test:unit

# Jest
npm run test:unit:jest

# AVA
npm run test:unit:ava

# TAP
npm run test:unit:tap
```

#### Coverage Scripts
```bash
# Vitest coverage
npm run test:coverage

# Jest coverage
npm run test:coverage:jest

# AVA coverage
npm run test:coverage:ava

# TAP coverage
npm run test:coverage:tap
```

### 🔗 **Integration Test Scripts**

#### Individual Framework Scripts
```bash
# Vitest integration
npm run test:integration

# Jest integration
npm run test:integration:jest

# AVA integration
npm run test:integration:ava

# TAP integration
npm run test:integration:tap

# Supertest integration
npm run test:integration:supertest
```

### 🌐 **API Test Scripts**

#### Individual Framework Scripts
```bash
# Vitest API tests
npm run test:api

# Supertest API tests
npm run test:api:supertest

# Karate-style API tests
npm run test:api:karate

# REST Assured-style API tests
npm run test:api:restassured
```

### 🖥️ **E2E Test Scripts**

#### Individual Framework Scripts
```bash
# Playwright E2E tests
npm run test:e2e:playwright

# Cypress E2E tests
npm run test:e2e:cypress

# Selenium E2E tests
npm run test:e2e:selenium

# All E2E tests
npm run test:e2e
```

### ⚡ **Performance Test Scripts**

#### Individual Framework Scripts
```bash
# k6 performance tests
npm run test:performance:k6

# JMeter performance tests
npm run test:performance:jmeter

# Gatling performance tests
npm run test:performance:gatling

# All performance tests
npm run test:performance:all
```

## Pipeline Test Scripts

### 🎯 **Pipeline-Specific Scripts**

These scripts run all frameworks for each test type, matching our pipeline structure:

```bash
# Unit Test Pipeline (Vitest + Jest + AVA)
npm run test:pipeline:unit

# Integration Test Pipeline (Vitest + Supertest + TAP)
npm run test:pipeline:integration

# API Test Pipeline (Supertest + Karate + REST Assured)
npm run test:pipeline:api

# E2E Test Pipeline (Playwright + Cypress + Selenium)
npm run test:pipeline:e2e

# Performance Test Pipeline (k6 + JMeter + Gatling)
npm run test:pipeline:performance
```

### 🚀 **Master Pipeline Script**

```bash
# Run all test types with all frameworks
npm run test:pipeline:all
```

## General Test Scripts

### 🔄 **Development Scripts**
```bash
# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run all tests (unit + integration + api + pages)
npm run test:all

# Run tests for CI
npm run test:ci
```

### 🏗️ **Backend Test Scripts**
```bash
# Backend tests
npm run test:backend

# Backend unit tests
npm run test:backend:unit

# Backend integration tests
npm run test:backend:integration

# Backend API tests
npm run test:backend:api

# All backend tests
npm run test:backend:all
```

## Test File Structure

```
src/test/
├── components/           # Vitest component tests
├── hooks/               # Vitest hook tests
├── utils/               # Vitest utility tests
├── pages/               # Vitest page tests
├── integration/         # Vitest integration tests
├── api/                 # Vitest API tests
├── e2e/                 # Vitest E2E tests
├── unit-jest/           # Jest unit tests
├── unit-ava/            # AVA unit tests
├── unit-tap/            # TAP unit tests
├── integration-jest/    # Jest integration tests
├── integration-ava/     # AVA integration tests
├── integration-tap/     # TAP integration tests
├── integration-supertest/ # Supertest integration tests
├── api-supertest/       # Supertest API tests
├── api-karate/          # Karate-style API tests
├── api-restassured/     # REST Assured-style API tests
├── e2e-selenium/        # Selenium E2E tests
└── setup/               # Test setup files

tests/
└── performance/
    ├── k6-load-test.js      # k6 performance tests
    ├── jmeter-load-test.jmx # JMeter performance tests
    └── gatling-load-test.scala # Gatling performance tests
```

## Usage Examples

### Running Specific Test Types

```bash
# Run only unit tests with all frameworks
npm run test:pipeline:unit

# Run only integration tests with all frameworks
npm run test:pipeline:integration

# Run only API tests with all frameworks
npm run test:pipeline:api

# Run only E2E tests with all frameworks
npm run test:pipeline:e2e

# Run only performance tests with all frameworks
npm run test:pipeline:performance
```

### Running Individual Frameworks

```bash
# Run only Jest unit tests
npm run test:unit:jest

# Run only AVA integration tests
npm run test:integration:ava

# Run only Supertest API tests
npm run test:api:supertest

# Run only Playwright E2E tests
npm run test:e2e:playwright

# Run only k6 performance tests
npm run test:performance:k6
```

### Running with Coverage

```bash
# Run all tests with coverage
npm run test:coverage

# Run Jest tests with coverage
npm run test:coverage:jest

# Run AVA tests with coverage
npm run test:coverage:ava

# Run TAP tests with coverage
npm run test:coverage:tap
```

### Development Workflow

```bash
# Watch mode for development
npm run test:watch

# Run tests with UI for debugging
npm run test:ui

# Run all tests before commit
npm run test:all

# Run CI tests
npm run test:ci
```

## Environment Variables

### Test Configuration
```bash
# Test URLs
TEST_TARGET_URL=http://localhost:5173
TEST_API_URL=http://localhost:4000

# Performance Test Parameters
TEST_DURATION=5
CONCURRENT_USERS=10

# Framework Selection
UNIT_FRAMEWORKS=vitest,jest,ava
INTEGRATION_FRAMEWORKS=vitest,supertest,tap
API_FRAMEWORKS=supertest,karate,restassured
E2E_FRAMEWORKS=playwright,cypress,selenium
PERFORMANCE_FRAMEWORKS=k6,jmeter,gatling
```

### Performance Test Environment Variables
```bash
# k6 Environment Variables
K6_BROWSER_ENABLED=true
K6_OUT=json=reports/k6-results.json

# JMeter Environment Variables
JMETER_HOME=/path/to/jmeter
JMETER_OPTS=-Xmx2g

# Gatling Environment Variables
GATLING_HOME=/path/to/gatling
GATLING_OPTS=-Xmx2g
```

## CI/CD Integration

### GitHub Actions Integration
The test scripts are designed to work seamlessly with our GitHub Actions pipelines:

```yaml
# Example workflow step
- name: Run Unit Tests
  run: npm run test:pipeline:unit

- name: Run Integration Tests
  run: npm run test:pipeline:integration

- name: Run API Tests
  run: npm run test:pipeline:api

- name: Run E2E Tests
  run: npm run test:pipeline:e2e

- name: Run Performance Tests
  run: npm run test:pipeline:performance
```

### Parallel Execution
For faster CI/CD execution, you can run frameworks in parallel:

```bash
# Run Jest and AVA unit tests in parallel
npm run test:unit:jest & npm run test:unit:ava & wait

# Run all unit test frameworks in parallel
npm run test:unit:jest & npm run test:unit:ava & npm run test:unit:tap & wait
```

## Troubleshooting

### Common Issues

1. **Framework Not Found**
   ```bash
   # Install missing dependencies
   npm install
   
   # Check if framework is installed
   npx jest --version
   npx ava --version
   npx tap --version
   ```

2. **Performance Test Issues**
   ```bash
   # Install k6
   npm install -g k6
   
   # Install JMeter
   # Download from https://jmeter.apache.org/
   
   # Install Gatling
   # Download from https://gatling.io/
   ```

3. **Browser Test Issues**
   ```bash
   # Install Playwright browsers
   npx playwright install
   
   # Install Cypress
   npm install cypress
   
   # Install Selenium WebDriver
   npm install selenium-webdriver
   ```

### Debug Mode
```bash
# Run tests with verbose output
npm run test:run -- --verbose

# Run specific test file
npm run test:run src/test/unit-jest/Button.test.jsx

# Run tests with debug logging
DEBUG=* npm run test:unit:jest
```

## Best Practices

### 1. **Script Organization**
- Use pipeline scripts for CI/CD
- Use individual framework scripts for development
- Use coverage scripts for quality gates

### 2. **Performance Testing**
- Run performance tests in isolated environments
- Use appropriate load parameters for your environment
- Monitor resource usage during performance tests

### 3. **E2E Testing**
- Ensure application is running before E2E tests
- Use appropriate timeouts for slow operations
- Clean up test data after E2E tests

### 4. **API Testing**
- Mock external dependencies when possible
- Use test databases for integration tests
- Validate response schemas

### 5. **Unit Testing**
- Keep tests fast and focused
- Use meaningful test descriptions
- Mock external dependencies

---

This comprehensive test script setup ensures that all our pipelines have corresponding test scripts and can be run both individually and as part of the complete testing strategy.
