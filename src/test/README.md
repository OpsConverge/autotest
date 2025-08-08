# Test Suite Documentation

This directory contains comprehensive tests for the Base44 Test Management App using **Vitest** and **React Testing Library**.

## 🏗️ Test Architecture

```
src/test/
├── README.md                 # This file
├── setup.js                  # Global test setup and mocks
├── utils/
│   └── test-utils.jsx        # Custom render function with providers
├── components/               # Component unit tests
│   ├── App.test.jsx
│   ├── LogoutButton.test.jsx
│   └── TeamSwitcher.test.jsx
├── pages/                    # Page component tests
│   ├── Login.test.jsx
│   └── Dashboard.test.jsx
├── hooks/                    # Custom hook tests
│   └── use-mobile.test.jsx
├── utils/                    # Utility function tests
│   └── utils.test.js
├── api/                      # API function tests
│   └── base44Client.test.js
├── integration/              # Integration tests
│   └── authentication.test.jsx
└── e2e/                      # End-to-end tests
    └── App.test.jsx
```

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests once (CI/CD)
npm run test:run
```

### Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run tests in watch mode |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:run` | Run tests once (no watch) |

## 🧪 Test Types

### 1. Unit Tests
Test individual components, functions, and hooks in isolation.

**Location:** `components/`, `hooks/`, `utils/`, `api/`

**Example:**
```javascript
describe('LogoutButton', () => {
  it('renders logout button', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })
})
```

### 2. Integration Tests
Test how multiple components work together.

**Location:** `integration/`

**Example:**
```javascript
describe('Authentication Integration', () => {
  it('completes full login process', async () => {
    // Test complete login flow
  })
})
```

### 3. E2E Tests
Test complete user workflows and application behavior.

**Location:** `e2e/`

**Example:**
```javascript
describe('App E2E', () => {
  it('renders the complete application', () => {
    render(<App />)
    expect(screen.getByTestId('pages-component')).toBeInTheDocument()
  })
})
```

## 🛠️ Test Utilities

### Custom Render Function

Located in `utils/test-utils.jsx`, this provides a custom render function that includes all necessary providers:

```javascript
import { render, screen } from '../utils/test-utils'

// Automatically includes:
// - BrowserRouter
// - TeamProvider
// - All other necessary context providers
```

### Global Mocks

Located in `setup.js`, includes mocks for:

- `localStorage`
- `window.matchMedia`
- `IntersectionObserver`
- `ResizeObserver`
- `fetch` (for API calls)

## 📝 Writing Tests

### Component Test Template

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import YourComponent from '../../components/YourComponent'

describe('YourComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    render(<YourComponent />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Updated Text')).toBeInTheDocument()
    })
  })
})
```

### Hook Test Template

```javascript
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useYourHook } from '../../hooks/useYourHook'

describe('useYourHook', () => {
  it('returns expected initial state', () => {
    const { result } = renderHook(() => useYourHook())
    expect(result.current).toBe(expectedValue)
  })
})
```

### API Test Template

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { yourApiFunction } from '../../api/yourApi'

describe('yourApiFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles successful response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'success' })
    })

    const result = await yourApiFunction()
    expect(result).toEqual({ data: 'success' })
  })
})
```

## 🎯 Testing Best Practices

### 1. Test User Behavior
Focus on what users see and do, not implementation details.

```javascript
// ✅ Good - Tests user behavior
expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()

// ❌ Bad - Tests implementation details
expect(component.state.isLoading).toBe(true)
```

### 2. Use Semantic Queries
Prefer queries that reflect how users interact with your app.

```javascript
// ✅ Good - Semantic queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByText(/welcome/i)

// ❌ Bad - Implementation-specific queries
screen.getByTestId('submit-button')
```

### 3. Test Error States
Always test error handling and edge cases.

```javascript
it('shows error message on API failure', async () => {
  fetch.mockRejectedValueOnce(new Error('Network error'))
  
  render(<YourComponent />)
  
  await waitFor(() => {
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })
})
```

### 4. Use Descriptive Test Names
Make test names clear about what they're testing.

```javascript
// ✅ Good - Descriptive names
it('displays user profile when user is authenticated')

// ❌ Bad - Vague names
it('works correctly')
```

## 🔧 Mocking Strategies

### API Mocks

```javascript
// Mock API modules
vi.mock('../../api/yourApi', () => ({
  yourFunction: vi.fn(),
}))

// Mock fetch globally
global.fetch = vi.fn()
```

### Component Mocks

```javascript
// Mock child components
vi.mock('../../components/ChildComponent', () => ({
  default: () => <div data-testid="child-component">Mocked Child</div>
}))
```

### Router Mocks

```javascript
// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})
```

## 📊 Coverage

### Coverage Goals

- **Statements:** 80%+
- **Branches:** 80%+
- **Functions:** 80%+
- **Lines:** 80%+

### Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

## 🐛 Debugging Tests

### Debug Mode

```bash
# Run tests in debug mode
npm test -- --debug
```

### Test UI

```bash
# Open Vitest UI for debugging
npm run test:ui
```

### Common Issues

1. **Async Operations**: Always use `waitFor` for async operations
2. **Mock Cleanup**: Clear mocks in `beforeEach`
3. **Provider Wrapping**: Use custom render function for components that need context

## 📋 Test Checklist

Before committing, ensure:

- [ ] All tests pass
- [ ] New features have corresponding tests
- [ ] Error states are tested
- [ ] Edge cases are covered
- [ ] Test names are descriptive
- [ ] No implementation details are tested
- [ ] Coverage meets minimum requirements

## 🔄 Continuous Integration

Tests run automatically in CI/CD pipeline:

- Unit tests on every commit
- Integration tests on pull requests
- E2E tests on deployment

## 📚 Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

When adding new tests:

1. Follow the existing patterns
2. Use the custom render function
3. Mock external dependencies
4. Test both success and error cases
5. Update this documentation if needed

---

For questions about testing, please refer to the main project README or contact the development team.
