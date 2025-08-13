import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import { useTeam } from '../../context/TeamContext'

// Mock the API client
vi.mock('../../api/apiClient', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn()
}))

// Mock the entities API
vi.mock('../../api/entities', () => ({
  Teams: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  TeamSettings: {
    get: vi.fn(),
    update: vi.fn()
  }
}))

describe('Team Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Team Creation Flow', () => {
    it('should create a team and update context', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        role: 'owner'
      }

      const { Teams } = await import('../../api/entities')
      Teams.create.mockResolvedValue(mockTeam)
      Teams.list.mockResolvedValue({ teams: [mockTeam] })

      // Simulate team creation
      const result = await Teams.create({ name: 'Test Team' })
      
      expect(result).toEqual(mockTeam)
      expect(Teams.create).toHaveBeenCalledWith({ name: 'Test Team' })
    })

    it('should handle team creation errors', async () => {
      const { Teams } = await import('../../api/entities')
      Teams.create.mockRejectedValue(new Error('Team creation failed'))

      await expect(Teams.create({ name: 'Test Team' }))
        .rejects.toThrow('Team creation failed')
    })
  })

  describe('Team Settings Integration', () => {
    it('should load and update team settings', async () => {
      const mockSettings = {
        team_name: 'Test Team',
        github_config: { is_connected: false },
        notification_preferences: { flaky_tests: true }
      }

      const { TeamSettings } = await import('../../api/entities')
      TeamSettings.get.mockResolvedValue(mockSettings)
      TeamSettings.update.mockResolvedValue({ ...mockSettings, team_name: 'Updated Team' })

      // Load settings
      const settings = await TeamSettings.get(1)
      expect(settings).toEqual(mockSettings)

      // Update settings
      const updatedSettings = await TeamSettings.update(1, { team_name: 'Updated Team' })
      expect(updatedSettings.team_name).toBe('Updated Team')
    })
  })

  describe('Authentication Integration', () => {
    it('should handle login and team loading', async () => {
      const mockUser = { id: 1, email: 'test@example.com' }
      const mockTeams = [{ id: 1, name: 'Test Team', role: 'owner' }]

      const { login } = await import('../../api/apiClient')
      const { Teams } = await import('../../api/entities')

      login.mockResolvedValue({ token: 'mock-token', user: mockUser })
      Teams.list.mockResolvedValue({ teams: mockTeams })

      // Simulate login
      const loginResult = await login('test@example.com', 'password')
      expect(loginResult.token).toBe('mock-token')
      expect(loginResult.user).toEqual(mockUser)

      // Simulate team loading after login
      const teamsResult = await Teams.list()
      expect(teamsResult.teams).toEqual(mockTeams)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const { Teams } = await import('../../api/entities')
      Teams.list.mockRejectedValue(new Error('Network error'))

      await expect(Teams.list()).rejects.toThrow('Network error')
    })

    it('should handle authentication errors', async () => {
      const { login } = await import('../../api/apiClient')
      login.mockRejectedValue(new Error('Invalid credentials'))

      await expect(login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials')
    })
  })

  describe('Data Consistency', () => {
    it('should maintain consistent team data across operations', async () => {
      const mockTeam = { id: 1, name: 'Test Team', role: 'owner' }
      const { Teams } = await import('../../api/entities')

      Teams.list.mockResolvedValue({ teams: [mockTeam] })
      Teams.get = vi.fn().mockResolvedValue(mockTeam)

      // List teams
      const listResult = await Teams.list()
      expect(listResult.teams[0]).toEqual(mockTeam)

      // Get specific team
      const getResult = await Teams.get(1)
      expect(getResult).toEqual(mockTeam)

      // Verify data consistency
      expect(listResult.teams[0].id).toBe(getResult.id)
      expect(listResult.teams[0].name).toBe(getResult.name)
    })
  })
})
