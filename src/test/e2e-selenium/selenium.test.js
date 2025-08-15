import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const BASE_URL = process.env.TEST_TARGET_URL || 'http://localhost:5173';
let driver;

beforeAll(async () => {
  // Setup Chrome driver
  const options = new chrome.Options();
  options.addArguments('--headless'); // Run in headless mode for CI
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
});

afterAll(async () => {
  if (driver) {
    await driver.quit();
  }
});

describe('Selenium E2E Tests', () => {
  describe('Authentication Flow', () => {
    it('should display login page', async () => {
      await driver.get(`${BASE_URL}/login`);
      
      const title = await driver.getTitle();
      expect(title).toContain('Login');
      
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      
      expect(await emailInput.isDisplayed()).toBe(true);
      expect(await passwordInput.isDisplayed()).toBe(true);
      expect(await loginButton.isDisplayed()).toBe(true);
    });

    it('should login successfully with valid credentials', async () => {
      await driver.get(`${BASE_URL}/login`);
      
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      
      await emailInput.sendKeys('test@example.com');
      await passwordInput.sendKeys('password123');
      await loginButton.click();
      
      // Wait for redirect to dashboard
      await driver.wait(until.urlContains('/dashboard'), 5000);
      
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('/dashboard');
    });

    it('should show error for invalid credentials', async () => {
      await driver.get(`${BASE_URL}/login`);
      
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      
      await emailInput.sendKeys('test@example.com');
      await passwordInput.sendKeys('wrongpassword');
      await loginButton.click();
      
      // Wait for error message
      await driver.wait(until.elementLocated(By.css('[data-testid="error-message"]')), 5000);
      
      const errorMessage = await driver.findElement(By.css('[data-testid="error-message"]'));
      expect(await errorMessage.isDisplayed()).toBe(true);
    });
  });

  describe('Dashboard Navigation', () => {
    beforeEach(async () => {
      // Login before each test
      await driver.get(`${BASE_URL}/login`);
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      
      await emailInput.sendKeys('test@example.com');
      await passwordInput.sendKeys('password123');
      await loginButton.click();
      
      await driver.wait(until.urlContains('/dashboard'), 5000);
    });

    it('should display dashboard components', async () => {
      const dashboardTitle = await driver.findElement(By.css('h1'));
      expect(await dashboardTitle.getText()).toContain('Dashboard');
      
      const runTestsButton = await driver.findElement(By.css('button:contains("Run Tests")'));
      expect(await runTestsButton.isDisplayed()).toBe(true);
      
      const refreshButton = await driver.findElement(By.css('button:contains("Refresh")'));
      expect(await refreshButton.isDisplayed()).toBe(true);
    });

    it('should navigate to teams page', async () => {
      const teamsLink = await driver.findElement(By.css('a[href*="teams"]'));
      await teamsLink.click();
      
      await driver.wait(until.urlContains('/teams'), 5000);
      
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('/teams');
    });

    it('should navigate to settings page', async () => {
      const settingsLink = await driver.findElement(By.css('a[href*="settings"]'));
      await settingsLink.click();
      
      await driver.wait(until.urlContains('/settings'), 5000);
      
      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('/settings');
    });
  });

  describe('Team Management', () => {
    beforeEach(async () => {
      // Login and navigate to teams page
      await driver.get(`${BASE_URL}/login`);
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      
      await emailInput.sendKeys('test@example.com');
      await passwordInput.sendKeys('password123');
      await loginButton.click();
      
      await driver.wait(until.urlContains('/dashboard'), 5000);
      
      const teamsLink = await driver.findElement(By.css('a[href*="teams"]'));
      await teamsLink.click();
      await driver.wait(until.urlContains('/teams'), 5000);
    });

    it('should display teams list', async () => {
      const teamsList = await driver.findElement(By.css('[data-testid="teams-list"]'));
      expect(await teamsList.isDisplayed()).toBe(true);
    });

    it('should create new team', async () => {
      const createTeamButton = await driver.findElement(By.css('button:contains("Create Team")'));
      await createTeamButton.click();
      
      const nameInput = await driver.findElement(By.css('input[name="name"]'));
      const descriptionInput = await driver.findElement(By.css('textarea[name="description"]'));
      const submitButton = await driver.findElement(By.css('button[type="submit"]'));
      
      await nameInput.sendKeys('Selenium Test Team');
      await descriptionInput.sendKeys('Team created via Selenium test');
      await submitButton.click();
      
      // Wait for team to be created
      await driver.wait(until.elementLocated(By.css('text:contains("Selenium Test Team")')), 5000);
      
      const newTeam = await driver.findElement(By.css('text:contains("Selenium Test Team")'));
      expect(await newTeam.isDisplayed()).toBe(true);
    });

    it('should edit team', async () => {
      const editButton = await driver.findElement(By.css('button[aria-label="Edit team"]'));
      await editButton.click();
      
      const nameInput = await driver.findElement(By.css('input[name="name"]'));
      await nameInput.clear();
      await nameInput.sendKeys('Updated Team Name');
      
      const submitButton = await driver.findElement(By.css('button[type="submit"]'));
      await submitButton.click();
      
      // Wait for update
      await driver.wait(until.elementLocated(By.css('text:contains("Updated Team Name")')), 5000);
      
      const updatedTeam = await driver.findElement(By.css('text:contains("Updated Team Name")'));
      expect(await updatedTeam.isDisplayed()).toBe(true);
    });
  });

  describe('Test Execution', () => {
    beforeEach(async () => {
      // Login and navigate to dashboard
      await driver.get(`${BASE_URL}/login`);
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      
      await emailInput.sendKeys('test@example.com');
      await passwordInput.sendKeys('password123');
      await loginButton.click();
      
      await driver.wait(until.urlContains('/dashboard'), 5000);
    });

    it('should run tests', async () => {
      const runTestsButton = await driver.findElement(By.css('button:contains("Run Tests")'));
      await runTestsButton.click();
      
      // Wait for test execution to start
      await driver.wait(until.elementLocated(By.css('[data-testid="test-status"]')), 5000);
      
      const testStatus = await driver.findElement(By.css('[data-testid="test-status"]'));
      expect(await testStatus.getText()).toContain('Running');
    });

    it('should display test results', async () => {
      // First run tests
      const runTestsButton = await driver.findElement(By.css('button:contains("Run Tests")'));
      await runTestsButton.click();
      
      // Wait for tests to complete
      await driver.wait(until.elementLocated(By.css('[data-testid="test-results"]')), 10000);
      
      const testResults = await driver.findElement(By.css('[data-testid="test-results"]'));
      expect(await testResults.isDisplayed()).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile viewport', async () => {
      await driver.manage().window().setRect({ width: 375, height: 667 });
      
      await driver.get(`${BASE_URL}/login`);
      
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      
      expect(await emailInput.isDisplayed()).toBe(true);
      expect(await passwordInput.isDisplayed()).toBe(true);
      expect(await loginButton.isDisplayed()).toBe(true);
    });

    it('should work on tablet viewport', async () => {
      await driver.manage().window().setRect({ width: 768, height: 1024 });
      
      await driver.get(`${BASE_URL}/login`);
      
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      
      expect(await emailInput.isDisplayed()).toBe(true);
      expect(await passwordInput.isDisplayed()).toBe(true);
      expect(await loginButton.isDisplayed()).toBe(true);
    });
  });
});
