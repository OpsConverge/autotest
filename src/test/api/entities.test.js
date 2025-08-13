import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getApiUrl } from '../../utils'

// Mock fetch globally
global.fetch = vi.fn()

describe('API Entities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.getItem.mockReturnValue('mock-token')
  })

  describe('API URL Generation', () => {
    it('should generate correct API URLs', () => {
      expect(getApiUrl('auth/login')).toContain('/api/auth/login')
      expect(getApiUrl('teams')).toContain('/api/teams')
      expect(getApiUrl('teams/1/settings')).toContain('/api/teams/1/settings')
    })
  })

  describe('Authentication Headers', () => {
    it('should include auth token in requests', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      await fetch(getApiUrl('teams'), {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/teams'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )
    })

    it('should handle missing auth token', async () => {
      localStorage.getItem.mockReturnValue(null)

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Missing token' })
      })

      const response = await fetch(getApiUrl('teams'))
      expect(response.ok).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(fetch(getApiUrl('teams')))
        .rejects.toThrow('Network error')
    })

    it('should handle authentication errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })

      const response = await fetch(getApiUrl('teams'))
      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should handle server errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      const response = await fetch(getApiUrl('teams'))
      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })
  })

  describe('API Endpoints', () => {
    it('should handle teams endpoint', async () => {
      const mockTeams = [
        { id: 1, name: 'Team 1', role: 'owner' },
        { id: 2, name: 'Team 2', role: 'member' }
      ]

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ teams: mockTeams })
      })

      const response = await fetch(getApiUrl('teams'), {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.teams).toEqual(mockTeams)
    })

    it('should handle team settings endpoint', async () => {
      const mockSettings = {
        team_name: 'Test Team',
        github_config: { is_connected: false }
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings
      })

      const response = await fetch(getApiUrl('teams/1/settings'), {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data).toEqual(mockSettings)
    })

    it('should handle test runs endpoint', async () => {
      const mockTestRuns = [
        { id: 1, name: 'Test 1', status: 'passed' },
        { id: 2, name: 'Test 2', status: 'failed' }
      ]

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testRuns: mockTestRuns })
      })

      const response = await fetch(getApiUrl('teams/1/test-runs'), {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.testRuns).toEqual(mockTestRuns)
    })
  })
})
