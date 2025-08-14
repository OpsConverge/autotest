import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../utils/test-utils'
import LogoutButton from '../../components/LogoutButton'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders logout button', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('calls logout function when clicked', () => {
    render(<LogoutButton />)
    
    const button = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(button)
    
    // Verify that localStorage.removeItem was called for all expected keys
    expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    expect(localStorage.removeItem).toHaveBeenCalledWith('activeTeamId')
    expect(localStorage.removeItem).toHaveBeenCalledWith('teams')
  })

  it('clears localStorage when logout is called', () => {
    render(<LogoutButton />)
    
    const button = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(button)
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('token')
  })

  it('has correct styling classes', () => {
    render(<LogoutButton />)
    const button = screen.getByRole('button', { name: /logout/i })
    expect(button).toHaveClass('text-red-600')
  })
})
