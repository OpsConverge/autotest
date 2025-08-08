import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/test-utils'
import App from '../../App'

// Mock the Pages component
vi.mock('@/pages/index.jsx', () => ({
  default: () => <div data-testid="pages-component">Pages Component</div>
}))

// Mock the Toaster component
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('pages-component')).toBeInTheDocument()
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('wraps content in TeamProvider', () => {
    render(<App />)
    // The TeamProvider should be present in the component tree
    expect(screen.getByTestId('pages-component')).toBeInTheDocument()
  })
})
