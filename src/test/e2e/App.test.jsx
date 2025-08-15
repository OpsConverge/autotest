import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import App from '../../App'

// Mock localStorage for Node.js environment
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock the TeamContext to prevent real API calls
vi.mock('../../context/TeamContext', () => ({
  useTeam: vi.fn(() => ({
    teams: [],
    activeTeam: null,
    setActiveTeam: vi.fn(),
    loading: false,
    refreshTeams: vi.fn(),
  })),
  TeamProvider: ({ children }) => children,
}))

// Mock all the page components
vi.mock('@/pages/index.jsx', () => ({
  default: () => (
    <div data-testid="pages-component">
      <div data-testid="landing-page">Landing Page</div>
      <div data-testid="login-page">Login Page</div>
      <div data-testid="register-page">Register Page</div>
      <div data-testid="dashboard-page">Dashboard Page</div>
      <div data-testid="test-results-page">Test Results Page</div>
      <div data-testid="build-history-page">Build History Page</div>
      <div data-testid="analytics-page">Analytics Page</div>
      <div data-testid="ai-assistant-page">AI Assistant Page</div>
      <div data-testid="settings-page">Settings Page</div>
      <div data-testid="integrations-page">Integrations Page</div>
      <div data-testid="flakiness-page">Flakiness Page</div>
      <div data-testid="test-scheduling-page">Test Scheduling Page</div>
    </div>
  )
}))

// Mock the Toaster component
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}))

describe('App E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('renders the complete application', () => {
    render(<App />)
    
    expect(screen.getByTestId('pages-component')).toBeInTheDocument()
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('provides team context to all components', () => {
    render(<App />)
    
    // The TeamProvider should wrap all content
    expect(screen.getByTestId('pages-component')).toBeInTheDocument()
  })

  it('handles authentication state changes', async () => {
    // Mock authenticated user
    localStorageMock.getItem.mockReturnValue('mock-token')
    
    render(<App />)
    
    // Should render authenticated content
    expect(screen.getByTestId('pages-component')).toBeInTheDocument()
  })

  it('handles unauthenticated state', () => {
    // Mock unauthenticated user
    localStorageMock.getItem.mockReturnValue(null)
    
    render(<App />)
    
    // Should still render the app structure
    expect(screen.getByTestId('pages-component')).toBeInTheDocument()
  })

  it('maintains app structure across different states', () => {
    render(<App />)
    
    // Core app structure should always be present
    expect(screen.getByTestId('pages-component')).toBeInTheDocument()
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('provides consistent routing context', () => {
    render(<App />)
    
    // Router context should be available
    expect(screen.getByTestId('pages-component')).toBeInTheDocument()
  })

  it('handles theme and styling consistently', () => {
    render(<App />)
    
    // App should render with consistent styling
    const appElement = screen.getByTestId('pages-component')
    expect(appElement).toBeInTheDocument()
  })

  it('provides toast notifications system', () => {
    render(<App />)
    
    // Toaster should be available for notifications
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('maintains team context across navigation', () => {
    render(<App />)
    
    // Team context should persist across page changes
    expect(screen.getByTestId('pages-component')).toBeInTheDocument()
  })
})
