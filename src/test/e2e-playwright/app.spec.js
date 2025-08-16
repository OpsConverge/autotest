import { test, expect } from '@playwright/test';

test.describe('Test Management App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('http://localhost:5173');
  });

  test('should display the main page', async ({ page }) => {
    // Check if the page loads correctly
    await expect(page).toHaveTitle(/Test Management/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to different sections', async ({ page }) => {
    // Test navigation to Dashboard
    await page.click('text=Dashboard');
    await expect(page.locator('h2')).toContainText('Dashboard');
    
    // Test navigation to Tests
    await page.click('text=Tests');
    await expect(page.locator('h2')).toContainText('Tests');
    
    // Test navigation to Reports
    await page.click('text=Reports');
    await expect(page.locator('h2')).toContainText('Reports');
  });

  test('should create a new test', async ({ page }) => {
    // Navigate to Tests section
    await page.click('text=Tests');
    
    // Click on "Create New Test" button
    await page.click('button:has-text("Create New Test")');
    
    // Fill in test details
    await page.fill('input[name="testName"]', 'Sample E2E Test');
    await page.fill('textarea[name="description"]', 'This is a sample E2E test created by Playwright');
    
    // Select test type
    await page.selectOption('select[name="testType"]', 'e2e');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify test was created
    await expect(page.locator('text=Sample E2E Test')).toBeVisible();
  });

  test('should run a test', async ({ page }) => {
    // Navigate to Tests section
    await page.click('text=Tests');
    
    // Find and click on a test to run
    await page.click('button:has-text("Run")');
    
    // Wait for test execution to start
    await expect(page.locator('text=Running...')).toBeVisible();
    
    // Wait for test completion
    await expect(page.locator('text=Completed')).toBeVisible({ timeout: 30000 });
  });

  test('should view test results', async ({ page }) => {
    // Navigate to Reports section
    await page.click('text=Reports');
    
    // Check if test results are displayed
    await expect(page.locator('.test-results')).toBeVisible();
    
    // Verify test statistics are shown
    await expect(page.locator('text=Passed')).toBeVisible();
    await expect(page.locator('text=Failed')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();
  });

  test('should filter tests by type', async ({ page }) => {
    // Navigate to Tests section
    await page.click('text=Tests');
    
    // Select unit test filter
    await page.selectOption('select[name="testTypeFilter"]', 'unit');
    
    // Verify only unit tests are shown
    await expect(page.locator('.test-item')).toHaveCount(await page.locator('.test-item[data-type="unit"]').count());
    
    // Select integration test filter
    await page.selectOption('select[name="testTypeFilter"]', 'integration');
    
    // Verify only integration tests are shown
    await expect(page.locator('.test-item')).toHaveCount(await page.locator('.test-item[data-type="integration"]').count());
  });

  test('should search for tests', async ({ page }) => {
    // Navigate to Tests section
    await page.click('text=Tests');
    
    // Search for a specific test
    await page.fill('input[name="search"]', 'login');
    
    // Verify search results
    await expect(page.locator('.test-item')).toContainText('login');
  });

  test('should handle authentication', async ({ page }) => {
    // Test login functionality
    await page.click('text=Login');
    
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Verify successful login
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should export test results', async ({ page }) => {
    // Navigate to Reports section
    await page.click('text=Reports');
    
    // Click export button
    await page.click('button:has-text("Export")');
    
    // Verify download dialog or success message
    await expect(page.locator('text=Export successful')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile menu is accessible
    await page.click('button[aria-label="Menu"]');
    await expect(page.locator('.mobile-menu')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Simulate network error by going to non-existent page
    await page.goto('http://localhost:5173/non-existent-page');
    
    // Verify error page is displayed
    await expect(page.locator('text=Page Not Found')).toBeVisible();
    await expect(page.locator('text=Go Home')).toBeVisible();
    
    // Test going back to home
    await page.click('text=Go Home');
    await expect(page).toHaveURL('http://localhost:5173/');
  });
});
