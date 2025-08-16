#!/usr/bin/env node

/**
 * Script to run tests against the Node.js application
 * This script helps manage the test environment and provides guidance
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Test Management App - Test Runner');
console.log('=====================================\n');

// Check if backend is running
async function checkBackendHealth() {
  try {
    const response = await fetch('http://localhost:4000/health');
    if (response.ok) {
      console.log('✅ Backend is running on http://localhost:4000');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend is not running on http://localhost:4000');
    return false;
  }
}

// Check if frontend is running
async function checkFrontendHealth() {
  try {
    const response = await fetch('http://localhost:5173');
    if (response.ok) {
      console.log('✅ Frontend is running on http://localhost:5173');
      return true;
    }
  } catch (error) {
    console.log('❌ Frontend is not running on http://localhost:5173');
    return false;
  }
}

// Run a specific test command
function runTestCommand(command, description) {
  console.log(`\n🚀 Running: ${description}`);
  console.log(`Command: ${command}\n`);
  
  const [cmd, ...args] = command.split(' ');
  const child = spawn(cmd, args, { 
    stdio: 'inherit',
    shell: true 
  });
  
  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${description} completed successfully`);
        resolve();
      } else {
        console.log(`\n❌ ${description} failed with code ${code}`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`\n❌ Error running ${description}:`, error.message);
      reject(error);
    });
  });
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'help';
  
  // Check application status
  console.log('📋 Checking application status...\n');
  const backendRunning = await checkBackendHealth();
  const frontendRunning = await checkFrontendHealth();
  
  if (!backendRunning) {
    console.log('\n💡 To start the backend:');
    console.log('   cd backend && npm start\n');
  }
  
  if (!frontendRunning) {
    console.log('\n💡 To start the frontend:');
    console.log('   npm run dev\n');
  }
  
  // Test commands
  const testCommands = {
    'unit': {
      description: 'Unit Tests (Jest)',
      command: 'npm run test:unit:jest'
    },
    'integration': {
      description: 'Integration Tests (Supertest)',
      command: 'npm run test:integration:supertest'
    },
    'api': {
      description: 'API Tests (Postman/Newman)',
      command: 'npm run test:api:postman'
    },
    'e2e': {
      description: 'E2E Tests (Playwright)',
      command: 'npm run test:e2e:playwright'
    },
    'pytest': {
      description: 'Python Integration Tests',
      command: 'npm run test:integration:pytest'
    },
    'all': {
      description: 'All Tests',
      command: 'npm run test:pipeline:all'
    }
  };
  
  if (testType === 'help' || !testCommands[testType]) {
    console.log('\n📖 Available test commands:');
    console.log('===========================\n');
    
    Object.entries(testCommands).forEach(([key, value]) => {
      console.log(`  ${key.padEnd(12)} - ${value.description}`);
    });
    
    console.log('\n💡 Usage:');
    console.log('   node scripts/run-tests-against-app.js <test-type>');
    console.log('   node scripts/run-tests-against-app.js unit');
    console.log('   node scripts/run-tests-against-app.js integration');
    console.log('   node scripts/run-tests-against-app.js api');
    console.log('   node scripts/run-tests-against-app.js e2e');
    console.log('   node scripts/run-tests-against-app.js pytest');
    console.log('   node scripts/run-tests-against-app.js all');
    
    console.log('\n🔧 Prerequisites:');
    console.log('   1. Backend running on http://localhost:4000');
    console.log('   2. Frontend running on http://localhost:5173 (for E2E tests)');
    console.log('   3. Dependencies installed: npm install');
    console.log('   4. Python dependencies: pip install -r requirements.txt');
    
    return;
  }
  
  // Run the specified test
  try {
    await runTestCommand(testCommands[testType].command, testCommands[testType].description);
  } catch (error) {
    console.log('\n❌ Test execution failed');
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
