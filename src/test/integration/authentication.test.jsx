import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import Login from '../../pages/Login'
import Register from '../../pages/Register'

// Mock the API calls
vi.mock('../../api/base44Client', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Login Flow', () => {
    it('completes full login process', async () => {
      const { login } = await import('../../api/base44Client')
      login.mockResolvedValue({
        token: 'mock-token',
        user: { id: 1, email: 'test@example.com', name: 'John Doe' }
      })

      render(<Login />)

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Verify API call
      await waitFor(() => {
        expect(login).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      // Verify token is stored
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token')
    })

    it('handles login validation errors', async () => {
      render(<Login />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('handles login API errors', async () => {
      const { login } = await import('../../api/base44Client')
      login.mockRejectedValue(new Error('Invalid credentials'))

      render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })

  describe('Register Flow', () => {
    it('completes full registration process', async () => {
      const { register } = await import('../../api/base44Client')
      register.mockResolvedValue({
        token: 'mock-token',
        user: { id: 1, email: 'new@example.com', name: 'Jane Doe' }
      })

      render(<Register />)

      // Fill in registration form
      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /sign up/i })

      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Verify API call
      await waitFor(() => {
        expect(register).toHaveBeenCalledWith('new@example.com', 'password123', 'Jane Doe')
      })

      // Verify token is stored
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token')
    })

    it('validates password confirmation', async () => {
      render(<Register />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /sign up/i })

      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation Between Auth Pages', () => {
    it('navigates from login to register', () => {
      render(<Login />)
      
      const registerLink = screen.getByRole('link', { name: /sign up/i })
      expect(registerLink).toBeInTheDocument()
      expect(registerLink.getAttribute('href')).toBe('/Register')
    })

    it('navigates from register to login', () => {
      render(<Register />)
      
      const loginLink = screen.getByRole('link', { name: /sign in/i })
      expect(loginLink).toBeInTheDocument()
      expect(loginLink.getAttribute('href')).toBe('/Login')
    })
  })
})
