import { describe, it, expect } from 'vitest'
import { cn } from '../../lib/utils'

describe('cn utility function', () => {
  it('combines class names correctly', () => {
    const result = cn('class1', 'class2', 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('handles conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
    expect(result).toBe('base-class conditional-class')
  })

  it('handles empty strings and null values', () => {
    const result = cn('base-class', '', null, undefined, 'valid-class')
    expect(result).toBe('base-class valid-class')
  })

  it('handles objects with boolean values', () => {
    const result = cn('base-class', {
      'active': true,
      'disabled': false,
      'hidden': true
    })
    expect(result).toBe('base-class active hidden')
  })

  it('handles mixed input types', () => {
    const result = cn(
      'base-class',
      'string-class',
      true && 'conditional-class',
      { 'object-class': true, 'hidden': false },
      null,
      undefined
    )
    expect(result).toBe('base-class string-class conditional-class object-class')
  })

  it('returns empty string for no input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles single class name', () => {
    const result = cn('single-class')
    expect(result).toBe('single-class')
  })
})
