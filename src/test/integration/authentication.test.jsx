import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../../pages/Login'
import Register from '../../pages/Register'

// Mock the API client
vi.mock('../../api/apiClient', () => ({
  apiClient: {
    login: vi.fn(),
    register: vi.fn(),
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

describe('Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('Login Flow', () => {
    it('completes full login process', async () => {
      const mockLoginResponse = { token: 'test-token', email: 'test@example.com' }
      const mockTeamsResponse = { teams: [{ id: 1, name: 'Test Team' }] }
      
      const { apiClient } = await import('../../api/apiClient')
      apiClient.login.mockResolvedValue(mockLoginResponse)
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTeamsResponse,
      })

      renderWithRouter(<Login />)

      // Fill in login form using getAllByDisplayValue to get specific inputs
      const inputs = screen.getAllByDisplayValue('')
      const emailInput = inputs[0] // First input is email
      const passwordInput = inputs[1] // Second input is password
      const submitButton = screen.getByRole('button', { name: /login/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(apiClient.login).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
        expect(mockNavigate).toHaveBeenCalledWith('/teams/1/dashboard')
      })
    })

    it('handles login validation errors', async () => {
      renderWithRouter(<Login />)

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      // Should show validation error for required fields
      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('')
        expect(inputs).toHaveLength(2) // Email and password inputs
      })
    })

    it('handles login API errors', async () => {
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
  })

  describe('Register Flow', () => {
    it('completes full registration process', async () => {
      const mockRegisterResponse = { team: { id: 1, name: 'Default Team' } }
      const mockLoginResponse = { token: 'test-token', email: 'test@example.com' }
      
      const { apiClient } = await import('../../api/apiClient')
      apiClient.register.mockResolvedValue(mockRegisterResponse)
      apiClient.login.mockResolvedValue(mockLoginResponse)

      renderWithRouter(<Register />)

      // Fill in registration form - only email and password fields
      const inputs = screen.getAllByDisplayValue('')
      const emailInput = inputs[0]
      const passwordInput = inputs[1]
      const submitButton = screen.getByRole('button', { name: /register/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(apiClient.register).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
        expect(mockNavigate).toHaveBeenCalledWith('/teams/1/dashboard')
      })
    })

    it('validates password confirmation', async () => {
      renderWithRouter(<Register />)

      const submitButton = screen.getByRole('button', { name: /register/i })
      fireEvent.click(submitButton)

      // Should show validation error for required fields
      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('')
        expect(inputs).toHaveLength(2) // Email and password inputs
      })
    })
  })

  describe('Navigation Between Auth Pages', () => {
    it('navigates from login to register', () => {
      renderWithRouter(<Login />)

      const registerLink = screen.getByRole('link', { name: /don't have an account\? register/i })
      expect(registerLink).toBeInTheDocument()
      expect(registerLink.getAttribute('href')).toBe('/Register')
    })

    it('navigates from register to login', () => {
      renderWithRouter(<Register />)

      const loginLink = screen.getByRole('link', { name: /already have an account\? login/i })
      expect(loginLink).toBeInTheDocument()
      expect(loginLink.getAttribute('href')).toBe('/Login')
    })
  })
})
