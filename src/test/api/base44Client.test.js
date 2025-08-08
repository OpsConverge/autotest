import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, register, getCurrentUser } from '../../api/base44Client'

// Mock fetch globally
global.fetch = vi.fn()

describe('base44Client API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
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

      const result = await login('test@example.com', 'password123')

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
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
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token')
    })

    it('handles login error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      })

      await expect(login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials')
    })

    it('handles network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(login('test@example.com', 'password123'))
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

      const result = await register('new@example.com', 'password123', 'John Doe')

      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'password123',
          name: 'John Doe'
        })
      })

      expect(result).toEqual(mockResponse)
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token')
    })

    it('handles registration error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Email already exists' })
      })

      await expect(register('existing@example.com', 'password123', 'John Doe'))
        .rejects.toThrow('Email already exists')
    })
  })

  describe('getCurrentUser', () => {
    it('returns current user when token exists', async () => {
      localStorage.getItem.mockReturnValue('mock-token')

      const mockUser = { id: 1, email: 'test@example.com', name: 'John Doe' }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      })

      const result = await getCurrentUser()

      expect(fetch).toHaveBeenCalledWith('/api/auth/me', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      })

      expect(result).toEqual(mockUser)
    })

    it('returns null when no token exists', async () => {
      localStorage.getItem.mockReturnValue(null)

      const result = await getCurrentUser()

      expect(result).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('handles API error', async () => {
      localStorage.getItem.mockReturnValue('invalid-token')

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token' })
      })

      await expect(getCurrentUser()).rejects.toThrow('Invalid token')
    })
  })
})
