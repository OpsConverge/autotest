import { describe, it, expect, beforeAll } from 'vitest';
import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:4000/api';
let authToken;

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

describe('Karate-Style API Tests', () => {
  describe('Authentication Flow', () => {
    it('should login and return token', async () => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('email', 'test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Teams API - Karate Style', () => {
    it('should get user teams', async () => {
      const response = await fetch(`${BASE_URL}/teams`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('teams');
      expect(Array.isArray(data.teams)).toBe(true);
    });

    it('should create new team', async () => {
      const teamData = {
        name: 'Karate Test Team',
        description: 'Team created via Karate-style test'
      };

      const response = await fetch(`${BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(teamData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('team');
      expect(data.team.name).toBe(teamData.name);
      expect(data.team.description).toBe(teamData.description);
    });

    it('should get team by ID', async () => {
      // First create a team
      const createResponse = await fetch(`${BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Team for Get Test',
          description: 'Test team for get operation'
        })
      });

      const createData = await createResponse.json();
      const teamId = createData.team.id;

      // Now get the team
      const response = await fetch(`${BASE_URL}/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('team');
      expect(data.team.id).toBe(teamId);
    });

    it('should update team', async () => {
      // First create a team
      const createResponse = await fetch(`${BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Team to Update',
          description: 'Original description'
        })
      });

      const createData = await createResponse.json();
      const teamId = createData.team.id;

      // Update the team
      const updateData = {
        name: 'Updated Team Name',
        description: 'Updated description'
      };

      const response = await fetch(`${BASE_URL}/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('team');
      expect(data.team.name).toBe(updateData.name);
      expect(data.team.description).toBe(updateData.description);
    });

    it('should delete team', async () => {
      // First create a team
      const createResponse = await fetch(`${BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Team to Delete',
          description: 'Will be deleted'
        })
      });

      const createData = await createResponse.json();
      const teamId = createData.team.id;

      // Delete the team
      const response = await fetch(`${BASE_URL}/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(204);

      // Verify team is deleted
      const getResponse = await fetch(`${BASE_URL}/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Error Handling - Karate Style', () => {
    it('should handle unauthorized access', async () => {
      const response = await fetch(`${BASE_URL}/teams`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.status).toBe(401);
    });

    it('should handle invalid team ID', async () => {
      const response = await fetch(`${BASE_URL}/teams/999999`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });
  });
});
