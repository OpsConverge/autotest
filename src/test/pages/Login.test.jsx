import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../../pages/Login'

// Mock the API client
vi.mock('../../api/apiClient', () => ({
  apiClient: {
    login: vi.fn(),
  },
}))

// Mock the TeamContext
vi.mock('../../context/TeamContext', () => ({
  useTeam: vi.fn(() => ({
    refreshTeams: vi.fn(),
  })),
}))

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('renders login form', () => {
    renderWithRouter(<Login />)
    
    // Check for form elements using getAllByDisplayValue
    const inputs = screen.getAllByDisplayValue('')
    expect(inputs).toHaveLength(2) // Email and password inputs
    
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    renderWithRouter(<Login />)

    const submitButton = screen.getByRole('button', { name: /login/i })
    fireEvent.click(submitButton)

    // Should show validation error for required fields
    await waitFor(() => {
      const inputs = screen.getAllByDisplayValue('')
      expect(inputs).toHaveLength(2) // Email and password inputs
    })
  })

  it('shows validation error for invalid email', async () => {
    renderWithRouter(<Login />)

    const inputs = screen.getAllByDisplayValue('')
    const emailInput = inputs[0]
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

    // HTML5 validation should prevent form submission with invalid email
    const submitButton = screen.getByRole('button', { name: /login/i })
    fireEvent.click(submitButton)

    // Should still have the invalid email in the input
    expect(emailInput.value).toBe('invalid-email')
  })

  it('submits form with valid data', async () => {
    const mockLoginResponse = { token: 'test-token', email: 'test@example.com' }
    const mockTeamsResponse = { teams: [{ id: 1, name: 'Test Team' }] }
    
    const { apiClient } = await import('../../api/apiClient')
    apiClient.login.mockResolvedValue(mockLoginResponse)
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTeamsResponse,
    })

    renderWithRouter(<Login />)

    const inputs = screen.getAllByDisplayValue('')
    const emailInput = inputs[0]
    const passwordInput = inputs[1]
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(apiClient.login).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('shows error message on login failure', async () => {
    const { apiClient } = await import('../../api/apiClient')
    apiClient.login.mockRejectedValue(new Error('Invalid credentials'))

    renderWithRouter(<Login />)

    const inputs = screen.getAllByDisplayValue('')
    const emailInput = inputs[0]
    const passwordInput = inputs[1]
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })

  it('has link to register page', () => {
    renderWithRouter(<Login />)
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /don't have an account\? register/i })).toBeInTheDocument()
  })
})
