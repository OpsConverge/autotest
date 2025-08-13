import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../../api/apiClient'

// Mock fetch globally
global.fetch = vi.fn()

describe('apiClient API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Mock localStorage.getItem to return the actual stored value
    localStorage.getItem = vi.fn((key) => {
      if (key === 'token') {
        return localStorage.getItem.mockReturnValue || null
      }
      return null
    })
  })

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, email: 'test@example.com' }
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.login('test@example.com', 'password123')

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      expect(result).toEqual(mockResponse)
    })

    it('handles login error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      })

      await expect(apiClient.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Login failed')
    })

    it('handles network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.login('test@example.com', 'password123'))
        .rejects.toThrow('Network error')
    })
  })

  describe('register', () => {
    it('successfully registers user', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, email: 'new@example.com' }
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.register('new@example.com', 'password123')

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'password123'
        })
      })

      expect(result).toEqual(mockResponse)
    })

    it('handles registration error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Email already exists' })
      })

      await expect(apiClient.register('existing@example.com', 'password123'))
        .rejects.toThrow('Registration failed')
    })
  })

  describe('syncBuilds', () => {
    it('successfully syncs builds', async () => {
      const mockResponse = { message: 'Sync completed', synced: 5 }
      localStorage.getItem.mockReturnValue = 'mock-token'

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.syncBuilds(1, 'owner/repo')

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/teams/1/repos/owner/repo/sync-builds'), {
        method: 'POST',
        headers: { 'Authorization': 'Bearer mock-token' }
      })

      expect(result).toEqual(mockResponse)
    })

    it('handles sync error', async () => {
      localStorage.getItem.mockReturnValue = 'mock-token'

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Sync failed' })
      })

      await expect(apiClient.syncBuilds(1, 'owner/repo'))
        .rejects.toThrow('Sync failed')
    })
  })

  describe('fetchBuilds', () => {
    it('successfully fetches builds', async () => {
      const mockResponse = { builds: [{ id: 1, name: 'Build 1' }] }
      localStorage.getItem.mockReturnValue = 'mock-token'

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.fetchBuilds(1, 'owner/repo', 10)

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/teams/1/builds?repo=owner%2Frepo&limit=10'), {
        headers: { 'Authorization': 'Bearer mock-token' }
      })

      expect(result).toEqual(mockResponse)
    })

    it('handles fetch error', async () => {
      localStorage.getItem.mockReturnValue = 'mock-token'

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      })

      await expect(apiClient.fetchBuilds(1, 'owner/repo'))
        .rejects.toThrow('Failed to fetch builds')
    })
  })
})
