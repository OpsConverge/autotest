import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMobile } from '../../hooks/use-mobile'

describe('useMobile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false for desktop screen size', () => {
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useMobile())
    expect(result.current).toBe(false)
  })

  it('returns true for mobile screen size', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    const { result } = renderHook(() => useMobile())
    expect(result.current).toBe(true)
  })

  it('returns true for tablet screen size', () => {
    // Mock window.innerWidth for tablet
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 900,
    })

    const { result } = renderHook(() => useMobile())
    expect(result.current).toBe(true)
  })

  it('updates when window is resized', () => {
    // Start with desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result, rerender } = renderHook(() => useMobile())
    expect(result.current).toBe(false)

    // Change to mobile size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))
    rerender()

    expect(result.current).toBe(true)
  })

  it('handles edge case of exactly 768px width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    const { result } = renderHook(() => useMobile())
    expect(result.current).toBe(true)
  })

  it('handles edge case of exactly 1024px width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useMobile())
    expect(result.current).toBe(false)
  })
})
