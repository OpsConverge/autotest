# CI/CD Pipeline Framework Guide

This guide explains the new CI/CD pipeline architecture that runs all 4 test types with different frameworks across 3 pipelines.

## 🏗️ Pipeline Architecture

### **Pipeline 1: Node.js Focus**
- **Unit Tests**: Jest (JS/TS)
- **Integration Tests**: Supertest (Node.js)
- **API Tests**: Postman/Newman
- **E2E Tests**: Playwright

### **Pipeline 2: Java Focus**
- **Unit Tests**: JUnit 5 (Java)
- **Integration Tests**: Spring Boot Test (Java)
- **API Tests**: REST Assured (Java)
- **E2E Tests**: Cypress

### **Pipeline 3: Python Focus**
- **Unit Tests**: pytest (Python)
- **Integration Tests**: pytest + requests (Python)
- **API Tests**: Karate
- **E2E Tests**: Selenium WebDriver

## 🚀 Pipeline Features

### **Flakiness Testing**
Each pipeline includes controlled flakiness simulation:
- **Enable/Disable**: Toggle flakiness testing via `test_flakiness` input
- **Framework-Specific Rates**: Different flakiness rates per framework
- **Analysis**: Automatic flakiness pattern detection and reporting

### **Test Framework Coverage**
| Test Type | Pipeline 1 | Pipeline 2 | Pipeline 3 |
|-----------|------------|------------|------------|
| **Unit** | Jest | JUnit 5 | pytest |
| **Integration** | Supertest | Spring Boot Test | pytest + requests |
| **API** | Postman/Newman | REST Assured | Karate |
| **E2E** | Playwright | Cypress | Selenium WebDriver |

## 📋 Pipeline Inputs

### **Common Inputs**
- `run_unit_tests`: Enable/disable unit tests
- `run_integration_tests`: Enable/disable integration tests
- `run_api_tests`: Enable/disable API tests
- `run_e2e_tests`: Enable/disable E2E tests
- `test_flakiness`: Enable flakiness simulation
- `backend_url`: Backend URL for tests (default: http://localhost:4000)

## 🧪 Mock Test Scripts

### **Purpose**
- Simulate real test execution with controlled flakiness
- Generate realistic test results for flakiness analysis
- Test the application's ability to ingest and analyze test results

### **Usage**
```bash
# Run mock tests with flakiness
ENABLE_FLAKINESS=true npm run test:unit:jest:mock

# Run mock tests without flakiness
npm run test:unit:jest:mock
```

### **Available Mock Scripts**
```bash
# Unit Tests
npm run test:unit:jest:mock
npm run test:unit:junit:mock
npm run test:unit:pytest:mock

# Integration Tests
npm run test:integration:supertest:mock
npm run test:integration:springboot:mock
npm run test:integration:pytest:mock

# API Tests
npm run test:api:postman:mock
npm run test:api:restassured:mock
npm run test:api:karate:mock

# E2E Tests
npm run test:e2e:playwright:mock
npm run test:e2e:cypress:mock
npm run test:e2e:selenium:mock
```

## 📊 Flakiness Analysis

### **Analysis Script**
The `scripts/analyze-flakiness.js` script:
- Analyzes test results from all frameworks
- Identifies flaky test patterns
- Generates recommendations
- Creates detailed reports

### **Flakiness Rates by Framework**
| Framework | Flakiness Rate | Test Count |
|-----------|----------------|------------|
| Jest | 30% | 10 |
| JUnit 5 | 25% | 8 |
| pytest | 20% | 12 |
| Supertest | 35% | 15 |
| Spring Boot Test | 30% | 12 |
| Postman/Newman | 40% | 18 |
| REST Assured | 35% | 15 |
| Karate | 30% | 12 |
| Playwright | 45% | 20 |
| Cypress | 40% | 18 |
| Selenium WebDriver | 50% | 22 |

## 🔧 Pipeline Execution

### **Manual Trigger**
Each pipeline can be triggered manually via GitHub Actions with custom inputs:

1. Go to Actions tab in GitHub
2. Select the desired pipeline
3. Click "Run workflow"
4. Configure inputs as needed
5. Click "Run workflow"

### **Automated Execution**
Pipelines can be triggered programmatically or via webhooks.

## 📁 Artifact Structure

### **Test Results**
Each pipeline generates artifacts for:
- Individual framework results
- Combined analysis reports
- Flakiness analysis reports

### **Artifact Paths**
```
test-results/
├── jest-unit-results/
├── junit-unit-results/
├── pytest-unit-results/
├── supertest-integration-results/
├── springboot-integration-results/
├── postman-api-results/
├── restassured-api-results/
├── karate-api-results/
├── playwright-e2e-results/
├── cypress-e2e-results/
├── selenium-e2e-results/
└── flakiness-analysis-{pipeline}.json
```

## 🎯 Use Cases

### **1. Framework Comparison**
Run the same test types across different frameworks to compare:
- Execution speed
- Flakiness rates
- Coverage capabilities
- Maintenance overhead

### **2. Flakiness Detection**
Use controlled flakiness to test:
- Application's ability to detect flaky tests
- Reporting and alerting systems
- Retry mechanisms
- Test result analysis

### **3. Multi-Language Testing**
Test applications with components in different languages:
- Node.js backend with Java utilities
- Python data processing with JavaScript frontend
- Mixed technology stacks

### **4. CI/CD Pipeline Testing**
Validate pipeline infrastructure:
- Parallel execution capabilities
- Resource management
- Artifact handling
- Error recovery

## 🔍 Monitoring and Reporting

### **Real-time Monitoring**
- GitHub Actions provides real-time execution status
- Detailed logs for each test framework
- Progress indicators for long-running tests

### **Post-Execution Reports**
- Comprehensive test summaries
- Flakiness analysis reports
- Framework comparison metrics
- Recommendations for improvement

## 🛠️ Customization

### **Adding New Frameworks**
1. Create mock test script in `scripts/mock-tests.js`
2. Add framework configuration
3. Update pipeline YAML files
4. Add package.json scripts

### **Modifying Flakiness Rates**
Edit the `getFlakinessRate()` method in `scripts/mock-tests.js` to adjust:
- Framework-specific flakiness rates
- Test counts per framework
- Error message patterns

### **Custom Test Types**
Extend the pipeline structure to support:
- Performance tests
- Security tests
- Accessibility tests
- Load tests

## 📈 Best Practices

### **Pipeline Management**
- Use descriptive pipeline names
- Implement proper error handling
- Set appropriate timeouts
- Configure resource limits

### **Test Result Analysis**
- Regular flakiness monitoring
- Trend analysis over time
- Framework performance comparison
- Continuous improvement based on metrics

### **Resource Optimization**
- Parallel execution where possible
- Efficient artifact management
- Proper cleanup procedures
- Resource monitoring and alerts

## 🚨 Troubleshooting

### **Common Issues**
1. **Backend Connection Failures**: Check backend URL and health endpoint
2. **Framework Installation Issues**: Verify dependencies and versions
3. **Artifact Upload Failures**: Check disk space and permissions
4. **Flakiness Analysis Errors**: Verify test result format compatibility

### **Debug Steps**
1. Check GitHub Actions logs
2. Verify environment setup
3. Test individual framework scripts locally
4. Review artifact contents
5. Validate input parameters

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Test Framework Documentation](https://jestjs.io/, https://junit.org/, https://docs.pytest.org/)
- [CI/CD Best Practices](https://martinfowler.com/articles/continuousIntegration.html)
- [Flaky Test Management](https://martinfowler.com/articles/microservice-testing/)
