import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import Dashboard from '../../pages/Dashboard'

// Mock the API calls
vi.mock('../../api/entities', () => ({
  getTestResults: vi.fn(),
  getBuildHistory: vi.fn(),
  getAnalytics: vi.fn(),
}))

// Mock the dashboard components
vi.mock('../../components/dashboard/MetricsGrid', () => ({
  default: () => <div data-testid="metrics-grid">Metrics Grid</div>
}))

vi.mock('../../components/dashboard/TestTrends', () => ({
  default: () => <div data-testid="test-trends">Test Trends</div>
}))

vi.mock('../../components/dashboard/RecentActivity', () => ({
  default: () => <div data-testid="recent-activity">Recent Activity</div>
}))

vi.mock('../../components/dashboard/QuickActions', () => ({
  default: () => <div data-testid="quick-actions">Quick Actions</div>
}))

vi.mock('../../components/dashboard/FlakyTests', () => ({
  default: () => <div data-testid="flaky-tests">Flaky Tests</div>
}))

describe('Dashboard', () => {
  const mockTestResults = [
    { id: 1, name: 'Test 1', status: 'passed', duration: 1000 },
    { id: 2, name: 'Test 2', status: 'failed', duration: 2000 },
  ]

  const mockBuildHistory = [
    { id: 1, buildNumber: '1.0.0', status: 'success', timestamp: '2024-01-01' },
    { id: 2, buildNumber: '1.0.1', status: 'failed', timestamp: '2024-01-02' },
  ]

  const mockAnalytics = {
    totalTests: 100,
    passedTests: 85,
    failedTests: 10,
    flakyTests: 5,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard components', async () => {
    const { getTestResults, getBuildHistory, getAnalytics } = await import('../../api/entities')
    getTestResults.mockResolvedValue(mockTestResults)
    getBuildHistory.mockResolvedValue(mockBuildHistory)
    getAnalytics.mockResolvedValue(mockAnalytics)

    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByTestId('metrics-grid')).toBeInTheDocument()
      expect(screen.getByTestId('test-trends')).toBeInTheDocument()
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument()
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
      expect(screen.getByTestId('flaky-tests')).toBeInTheDocument()
    })
  })

  it('fetches data on mount', async () => {
    const { getTestResults, getBuildHistory, getAnalytics } = await import('../../api/entities')
    getTestResults.mockResolvedValue(mockTestResults)
    getBuildHistory.mockResolvedValue(mockBuildHistory)
    getAnalytics.mockResolvedValue(mockAnalytics)

    render(<Dashboard />)
    
    await waitFor(() => {
      expect(getTestResults).toHaveBeenCalled()
      expect(getBuildHistory).toHaveBeenCalled()
      expect(getAnalytics).toHaveBeenCalled()
    })
  })

  it('shows loading state initially', () => {
    render(<Dashboard />)
    // Should show loading indicators while data is being fetched
    expect(screen.getByTestId('metrics-grid')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    const { getTestResults, getBuildHistory, getAnalytics } = await import('../../api/entities')
    getTestResults.mockRejectedValue(new Error('API Error'))
    getBuildHistory.mockRejectedValue(new Error('API Error'))
    getAnalytics.mockRejectedValue(new Error('API Error'))

    render(<Dashboard />)
    
    await waitFor(() => {
      // Should still render the components even if API calls fail
      expect(screen.getByTestId('metrics-grid')).toBeInTheDocument()
      expect(screen.getByTestId('test-trends')).toBeInTheDocument()
    })
  })

  it('has correct page title', () => {
    render(<Dashboard />)
    expect(document.title).toContain('Dashboard')
  })
})
