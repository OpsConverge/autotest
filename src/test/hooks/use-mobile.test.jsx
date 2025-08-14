import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsMobile } from '../../hooks/use-mobile'

// Mock window.matchMedia
const mockMatchMedia = vi.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })
  })

  it('returns false for desktop screen size', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })

    mockMatchMedia.mockReturnValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true for mobile screen size', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    })

    mockMatchMedia.mockReturnValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false for tablet screen size (768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 768,
    })

    mockMatchMedia.mockReturnValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('updates when window is resized', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })

    const mockAddEventListener = vi.fn()
    const mockRemoveEventListener = vi.fn()

    mockMatchMedia.mockReturnValue({
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    })

    const { result, rerender } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    // Simulate resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    })

    // Trigger the change handler
    const changeHandler = mockAddEventListener.mock.calls[0][1]
    changeHandler()

    rerender()
    expect(result.current).toBe(true)
  })

  it('handles edge case of exactly 768px width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 768,
    })

    mockMatchMedia.mockReturnValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('handles edge case of exactly 1024px width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })

    mockMatchMedia.mockReturnValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})
