import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../../pages/Dashboard'

// Mock the entities module
vi.mock('../../api/entities', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Build: {
      list: vi.fn(),
    },
    TestRun: {
      listByBuild: vi.fn(),
    },
  }
})

// Mock the TeamContext
vi.mock('../../context/TeamContext', () => ({
  useTeam: vi.fn(() => ({
    activeTeam: { id: 1, name: 'Test Team' },
  })),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'test@example.com'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard components', () => {
    renderWithRouter(<Dashboard />)
    
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Comprehensive overview of your test automation pipeline')).toBeInTheDocument()
    expect(screen.getByText('Run Tests')).toBeInTheDocument()
    expect(screen.getByText('Refresh')).toBeInTheDocument()
    expect(screen.getByText('Latest Builds')).toBeInTheDocument()
  })

  it('fetches data on mount', async () => {
    const mockBuilds = [
      { id: 1, version: 'v1.0.0', branch: 'main', status: 'completed', created_date: '2024-01-01T10:00:00Z' }
    ]
    const mockTestRuns = [
      { id: 1, status: 'passed', coverage_percentage: 85 }
    ]

    const { Build, TestRun } = await import('../../api/entities')
    Build.list.mockResolvedValue(mockBuilds)
    TestRun.listByBuild.mockResolvedValue(mockTestRuns)

    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(Build.list).toHaveBeenCalled()
      expect(TestRun.listByBuild).toHaveBeenCalledWith(1)
    })
  })

  it('shows loading state initially', () => {
    renderWithRouter(<Dashboard />)
    
    // The component should render even while loading
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Run Tests')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    const { Build } = await import('../../api/entities')
    Build.list.mockRejectedValue(new Error('API Error'))

    renderWithRouter(<Dashboard />)
    
    // Component should still render even with API errors
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument()
  })

  it('has correct page title', () => {
    renderWithRouter(<Dashboard />)
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument()
  })
})
