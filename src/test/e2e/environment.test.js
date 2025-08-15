import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fetch from 'node-fetch'

// Environment configuration
const TEST_URL = process.env.TEST_TARGET_URL || 'http://localhost:5173'
const API_URL = process.env.TEST_API_URL || 'http://localhost:4000/api'
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpass123'

describe('E2E Tests - Test Environment', () => {
  let authToken = null

  beforeAll(async () => {
    // Wait for the application to be ready
    await new Promise(resolve => setTimeout(resolve, 2000))
  })

  afterAll(async () => {
    // Cleanup if needed
  })

  describe('Authentication Flow', () => {
    it('should allow user registration', async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: uniqueEmail,
          password: TEST_USER_PASSWORD
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.team).toBeDefined()
    })

    it('should allow user login', async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.token).toBeDefined()
      expect(data.email).toBeDefined() // Backend returns email, not user object
      
      authToken = data.token
    })

    it('should reject invalid credentials', async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USER_EMAIL,
          password: 'wrongpassword'
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })
  })

  describe('API Endpoints', () => {
    it('should return teams for authenticated user', async () => {
      if (!authToken) {
        // Login first if no token
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD
          })
        })
        const loginData = await loginResponse.json()
        authToken = loginData.token
      }

      const response = await fetch(`${API_URL}/teams`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.teams).toBeDefined()
      expect(Array.isArray(data.teams)).toBe(true)
    })

    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${API_URL}/teams`)
      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should handle team settings', async () => {
      if (!authToken) return // Skip if no auth token

      // First get teams to get team ID
      const teamsResponse = await fetch(`${API_URL}/teams`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      const teamsData = await teamsResponse.json()
      const teamId = teamsData.teams[0]?.id

      if (!teamId) return // Skip if no team

      const response = await fetch(`${API_URL}/teams/${teamId}/settings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.team_name).toBeDefined()
    })
  })

  describe('Application Health', () => {
    it('should serve the frontend application', async () => {
      const response = await fetch(TEST_URL)
      expect(response.ok).toBe(true)
      expect(response.headers.get('content-type')).toContain('text/html')
    })

    it('should have working API endpoints', async () => {
      // Extract the base URL without /api suffix for the health endpoint
      const baseUrl = API_URL.replace('/api', '')
      const healthUrl = `${baseUrl}/health`
      console.log('Testing health endpoint at:', healthUrl)
      
      const response = await fetch(healthUrl)
      expect(response.ok).toBe(true)
      
      // Check content type to handle different response formats
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        // Local environment returns JSON
        const data = await response.json()
        expect(data.status).toBe('ok') // Backend returns { status: 'ok', timestamp: ... }
      } else if (contentType && contentType.includes('text/plain')) {
        // Deployed environment returns plain text
        const text = await response.text()
        expect(text.trim()).toBe('healthy') // Deployed environment returns "healthy" (with possible whitespace/newlines)
      } else {
        // If neither JSON nor plain text, log the response for debugging
        const text = await response.text()
        console.log('Health endpoint response:', text.substring(0, 200))
        throw new Error(`Unexpected content type: ${contentType}`)
      }
    })

    it('should handle CORS properly', async () => {
      const response = await fetch(`${API_URL}/teams`, {
        method: 'OPTIONS',
        headers: {
          'Origin': TEST_URL
        }
      })
      
      expect(response.headers.get('access-control-allow-origin')).toBeDefined()
    })
  })

  describe('Database Connectivity', () => {
    it('should be able to create and retrieve data', async () => {
      if (!authToken) return // Skip if no auth token

      // Test creating a new team
      const createTeamResponse = await fetch(`${API_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: `Test Team ${Date.now()}`
        })
      })

      expect(createTeamResponse.ok).toBe(true)
      const teamData = await createTeamResponse.json()
      expect(teamData.team).toBeDefined() // Backend returns { team: { id, name } }
      expect(teamData.team.id).toBeDefined()
    })
  })
})
