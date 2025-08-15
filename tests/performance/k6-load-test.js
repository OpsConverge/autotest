import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.TEST_TARGET_URL || 'http://localhost:5173';
const API_URL = __ENV.TEST_API_URL || 'http://localhost:4000/api';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be less than 10%
    errors: ['rate<0.1'],              // Custom error rate must be less than 10%
  },
};

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = null;

export function setup() {
  // Login to get auth token
  const loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginResponse, {
    'login successful': (r) => r.status === 200 && r.json('token') !== undefined,
  });

  if (loginResponse.status === 200) {
    authToken = loginResponse.json('token');
  }

  return { authToken };
}

export default function(data) {
  const { authToken } = data;

  // Test 1: Health check
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test 2: Login page load
  const loginPage = http.get(`${BASE_URL}/login`);
  check(loginPage, {
    'login page status is 200': (r) => r.status === 200,
    'login page loads in < 1000ms': (r) => r.timings.duration < 1000,
    'login page contains login form': (r) => r.body.includes('login'),
  });

  sleep(1);

  // Test 3: API authentication
  if (authToken) {
    const authCheck = http.get(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    check(authCheck, {
      'auth check status is 200': (r) => r.status === 200,
      'auth check response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    sleep(1);

    // Test 4: Get teams
    const teamsResponse = http.get(`${API_URL}/teams`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    check(teamsResponse, {
      'teams API status is 200': (r) => r.status === 200,
      'teams API response time < 1000ms': (r) => r.timings.duration < 1000,
      'teams API returns valid JSON': (r) => r.json('teams') !== undefined,
    });

    sleep(1);

    // Test 5: Create team (with cleanup)
    const teamData = {
      name: `Load Test Team ${Date.now()}`,
      description: 'Team created during load test'
    };

    const createTeamResponse = http.post(`${API_URL}/teams`, JSON.stringify(teamData), {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` 
      },
    });

    check(createTeamResponse, {
      'create team status is 201': (r) => r.status === 201,
      'create team response time < 2000ms': (r) => r.timings.duration < 2000,
      'create team returns valid response': (r) => r.json('team') !== undefined,
    });

    // Clean up - delete the team
    if (createTeamResponse.status === 201) {
      const teamId = createTeamResponse.json('team.id');
      const deleteTeamResponse = http.del(`${API_URL}/teams/${teamId}`, null, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      check(deleteTeamResponse, {
        'delete team status is 204': (r) => r.status === 204,
      });
    }

    sleep(1);
  }

  // Test 6: Dashboard page load (simulated)
  const dashboardPage = http.get(`${BASE_URL}/dashboard`);
  check(dashboardPage, {
    'dashboard page status is 200': (r) => r.status === 200,
    'dashboard page loads in < 1500ms': (r) => r.timings.duration < 1500,
  });

  sleep(1);

  // Test 7: Static assets
  const staticAssets = [
    '/favicon.ico',
    '/assets/index.css',
    '/assets/index.js'
  ];

  staticAssets.forEach(asset => {
    const assetResponse = http.get(`${BASE_URL}${asset}`);
    check(assetResponse, {
      [`${asset} status is 200`]: (r) => r.status === 200,
      [`${asset} loads in < 500ms`]: (r) => r.timings.duration < 500,
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data),
    [`reports/k6-results-${Date.now()}.json`]: JSON.stringify(data),
  };
}
