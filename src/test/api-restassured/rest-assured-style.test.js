import { describe, it, expect, beforeAll } from 'vitest';
import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:4000/api';
let authToken;

// REST Assured-style helper functions
const given = () => ({
  when: (method, endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    return fetch(url, config);
  }
});

const then = (response) => ({
  statusCode: (expectedStatus) => {
    expect(response.status).toBe(expectedStatus);
    return { response };
  },
  body: () => response.json(),
  header: (headerName) => response.headers.get(headerName)
});

beforeAll(async () => {
  // Login to get auth token
  const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });

  const loginData = await loginResponse.json();
  authToken = loginData.token;
});

describe('REST Assured-Style API Tests', () => {
  describe('Authentication Tests', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await given()
        .when('POST', '/auth/login', {
          body: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

      const result = then(response);
      result.statusCode(200);

      const body = await result.body();
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('email', 'test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await given()
        .when('POST', '/auth/login', {
          body: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        });

      const result = then(response);
      result.statusCode(401);

      const body = await result.body();
      expect(body).toHaveProperty('error');
    });

    it('should require email and password', async () => {
      const response = await given()
        .when('POST', '/auth/login', {
          body: {}
        });

      const result = then(response);
      result.statusCode(400);
    });
  });

  describe('Teams API - REST Assured Style', () => {
    it('should get user teams', async () => {
      const response = await given()
        .when('GET', '/teams', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

      const result = then(response);
      result.statusCode(200);

      const body = await result.body();
      expect(body).toHaveProperty('teams');
      expect(Array.isArray(body.teams)).toBe(true);
    });

    it('should create new team', async () => {
      const teamData = {
        name: 'REST Assured Test Team',
        description: 'Team created via REST Assured-style test'
      };

      const response = await given()
        .when('POST', '/teams', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: teamData
        });

      const result = then(response);
      result.statusCode(201);

      const body = await result.body();
      expect(body).toHaveProperty('team');
      expect(body.team.name).toBe(teamData.name);
      expect(body.team.description).toBe(teamData.description);
    });

    it('should get team by ID', async () => {
      // First create a team
      const createResponse = await given()
        .when('POST', '/teams', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: {
            name: 'Team for Get Test',
            description: 'Test team for get operation'
          }
        });

      const createBody = await createResponse.json();
      const teamId = createBody.team.id;

      // Now get the team
      const response = await given()
        .when('GET', `/teams/${teamId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

      const result = then(response);
      result.statusCode(200);

      const body = await result.body();
      expect(body).toHaveProperty('team');
      expect(body.team.id).toBe(teamId);
    });

    it('should update team', async () => {
      // First create a team
      const createResponse = await given()
        .when('POST', '/teams', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: {
            name: 'Team to Update',
            description: 'Original description'
          }
        });

      const createBody = await createResponse.json();
      const teamId = createBody.team.id;

      // Update the team
      const updateData = {
        name: 'Updated Team Name',
        description: 'Updated description'
      };

      const response = await given()
        .when('PUT', `/teams/${teamId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: updateData
        });

      const result = then(response);
      result.statusCode(200);

      const body = await result.body();
      expect(body).toHaveProperty('team');
      expect(body.team.name).toBe(updateData.name);
      expect(body.team.description).toBe(updateData.description);
    });

    it('should delete team', async () => {
      // First create a team
      const createResponse = await given()
        .when('POST', '/teams', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: {
            name: 'Team to Delete',
            description: 'Will be deleted'
          }
        });

      const createBody = await createResponse.json();
      const teamId = createBody.team.id;

      // Delete the team
      const response = await given()
        .when('DELETE', `/teams/${teamId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

      const result = then(response);
      result.statusCode(204);

      // Verify team is deleted
      const getResponse = await given()
        .when('GET', `/teams/${teamId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

      const getResult = then(getResponse);
      getResult.statusCode(404);
    });
  });

  describe('Validation Tests - REST Assured Style', () => {
    it('should validate required fields', async () => {
      const response = await given()
        .when('POST', '/teams', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: {
            description: 'Team without name'
          }
        });

      const result = then(response);
      result.statusCode(400);
    });

    it('should handle invalid team ID format', async () => {
      const response = await given()
        .when('GET', '/teams/invalid-id', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

      const result = then(response);
      result.statusCode(400);
    });

    it('should handle non-existent team ID', async () => {
      const response = await given()
        .when('GET', '/teams/999999', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

      const result = then(response);
      result.statusCode(404);
    });
  });

  describe('Security Tests - REST Assured Style', () => {
    it('should reject unauthorized access', async () => {
      const response = await given()
        .when('GET', '/teams', {
          headers: {
            'Authorization': 'Bearer invalid-token'
          }
        });

      const result = then(response);
      result.statusCode(401);
    });

    it('should reject missing authorization header', async () => {
      const response = await given()
        .when('GET', '/teams');

      const result = then(response);
      result.statusCode(401);
    });

    it('should handle malformed authorization header', async () => {
      const response = await given()
        .when('GET', '/teams', {
          headers: {
            'Authorization': 'InvalidFormat token'
          }
        });

      const result = then(response);
      result.statusCode(401);
    });
  });

  describe('Content Type Tests - REST Assured Style', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: 'invalid json'
      });

      const result = then(response);
      result.statusCode(400);
    });

    it('should handle wrong content type', async () => {
      const response = await fetch(`${BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${authToken}`
        },
        body: 'plain text body'
      });

      const result = then(response);
      result.statusCode(400);
    });
  });
});
