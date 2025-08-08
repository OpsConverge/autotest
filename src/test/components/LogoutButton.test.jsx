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
    const mockLogout = vi.fn()
    render(<LogoutButton onLogout={mockLogout} />)
    
    const button = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(button)
    
    expect(mockLogout).toHaveBeenCalledTimes(1)
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
