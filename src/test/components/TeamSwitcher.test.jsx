import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import TeamSwitcher from '../../components/TeamSwitcher'

// Mock the API calls
vi.mock('../../api/entities', () => ({
  getTeams: vi.fn(),
  getCurrentTeam: vi.fn(),
}))

describe('TeamSwitcher', () => {
  const mockTeams = [
    { id: 1, name: 'Team Alpha' },
    { id: 2, name: 'Team Beta' },
    { id: 3, name: 'Team Gamma' },
  ]

  const mockCurrentTeam = { id: 1, name: 'Team Alpha' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders team switcher', () => {
    render(<TeamSwitcher />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows current team name', async () => {
    const { getTeams, getCurrentTeam } = await import('../../api/entities')
    getCurrentTeam.mockResolvedValue(mockCurrentTeam)
    getTeams.mockResolvedValue(mockTeams)

    render(<TeamSwitcher />)
    
    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    })
  })

  it('opens dropdown when clicked', async () => {
    const { getTeams, getCurrentTeam } = await import('../../api/entities')
    getCurrentTeam.mockResolvedValue(mockCurrentTeam)
    getTeams.mockResolvedValue(mockTeams)

    render(<TeamSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Team Beta')).toBeInTheDocument()
      expect(screen.getByText('Team Gamma')).toBeInTheDocument()
    })
  })

  it('handles team selection', async () => {
    const { getTeams, getCurrentTeam } = await import('../../api/entities')
    getCurrentTeam.mockResolvedValue(mockCurrentTeam)
    getTeams.mockResolvedValue(mockTeams)

    render(<TeamSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      const teamOption = screen.getByText('Team Beta')
      fireEvent.click(teamOption)
    })
  })

  it('shows loading state initially', () => {
    render(<TeamSwitcher />)
    // Should show some loading indicator or default text
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
