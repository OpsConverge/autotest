import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../../server';

let app;
let authToken;

beforeAll(async () => {
  app = await createServer();
  
  // Login to get auth token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });
  
  authToken = loginResponse.body.token;
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

describe('Teams API Endpoints', () => {
  describe('GET /api/teams', () => {
    it('should return user teams with valid token', async () => {
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('teams');
      expect(Array.isArray(response.body.teams)).toBe(true);
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/teams')
        .expect(401);
    });
  });

  describe('POST /api/teams', () => {
    it('should create new team', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Test Team',
          description: 'A test team'
        })
        .expect(201);

      expect(response.body).toHaveProperty('team');
      expect(response.body.team.name).toBe('New Test Team');
      expect(response.body.team.description).toBe('A test team');
    });

    it('should require team name', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Team without name'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should return team details', async () => {
      // First create a team
      const createResponse = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Team for Details Test',
          description: 'Test team for details'
        });

      const teamId = createResponse.body.team.id;

      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('team');
      expect(response.body.team.id).toBe(teamId);
      expect(response.body.team.name).toBe('Team for Details Test');
    });

    it('should return 404 for non-existent team', async () => {
      await request(app)
        .get('/api/teams/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update team details', async () => {
      // First create a team
      const createResponse = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Team to Update',
          description: 'Original description'
        });

      const teamId = createResponse.body.team.id;

      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Team Name',
          description: 'Updated description'
        })
        .expect(200);

      expect(response.body).toHaveProperty('team');
      expect(response.body.team.name).toBe('Updated Team Name');
      expect(response.body.team.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should delete team', async () => {
      // First create a team
      const createResponse = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Team to Delete',
          description: 'Will be deleted'
        });

      const teamId = createResponse.body.team.id;

      await request(app)
        .delete(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify team is deleted
      await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
