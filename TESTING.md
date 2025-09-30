# Testing Guide for ShimmyServe

This document provides comprehensive information about testing in the ShimmyServe application.

## Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast unit test framework
- **Testing Library**: [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) - Simple and complete testing utilities
- **DOM Environment**: [jsdom](https://github.com/jsdom/jsdom) - Pure JavaScript DOM implementation
- **Coverage**: [V8 Coverage](https://vitest.dev/guide/coverage.html) - Built-in code coverage
- **Mocking**: [Vitest Mocks](https://vitest.dev/guide/mocking.html) - Powerful mocking capabilities

## Test Structure

```
src/
├── test/
│   ├── setup.ts          # Test setup and global mocks
│   └── utils.tsx         # Testing utilities and helpers
├── components/
│   └── __tests__/        # Component tests
├── stores/
│   └── __tests__/        # Store/state management tests
├── lib/
│   └── __tests__/        # Utility function tests
└── hooks/
    └── __tests__/        # Custom hook tests
```

## Running Tests

### Basic Commands

```bash
# Run all tests in watch mode
npm run test

# Run all tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI interface
npm run test:ui

# Run tests in watch mode
npm run test:watch
```

### Test Filtering

```bash
# Run specific test file
npm run test -- ChatInterface.test.tsx

# Run tests matching pattern
npm run test -- --grep "authentication"

# Run tests in specific directory
npm run test -- src/stores
```

## Test Categories

### 1. Unit Tests

Test individual functions, components, and modules in isolation.

**Location**: `src/**/__tests__/*.test.ts(x)`

**Examples**:
- Utility functions (`src/lib/__tests__/utils.test.ts`)
- Store actions and state management (`src/stores/__tests__/*.test.ts`)
- Individual component logic

### 2. Integration Tests

Test how multiple components work together.

**Location**: `src/components/__tests__/*.test.tsx`

**Examples**:
- Component interactions with stores
- Form submissions and data flow
- Navigation and routing

### 3. End-to-End Tests

Test complete user workflows (planned for future implementation).

**Tools**: Playwright or Cypress
**Location**: `e2e/` (to be created)

## Writing Tests

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.tsx`
- E2E tests: `*.e2e.test.ts`

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks()
  })

  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      const props = { /* test props */ }
      
      // Act
      render(<MyComponent {...props} />)
      
      // Assert
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
  })
})
```

### Testing Components

```typescript
import { render, screen, fireEvent, waitFor } from '../../test/utils'

// Basic rendering
render(<MyComponent />)

// Finding elements
screen.getByText('Button Text')
screen.getByRole('button', { name: /submit/i })
screen.getByTestId('my-element')

// User interactions
fireEvent.click(screen.getByText('Click Me'))
fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } })

// Async operations
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument()
})
```

### Testing Stores (Zustand)

```typescript
import { useMyStore } from '../myStore'

describe('MyStore', () => {
  beforeEach(() => {
    // Reset store state
    useMyStore.setState({
      // initial state
    })
  })

  it('should update state correctly', () => {
    const store = useMyStore.getState()
    
    store.updateValue('new value')
    
    expect(useMyStore.getState().value).toBe('new value')
  })
})
```

### Mocking

#### Mock Functions
```typescript
const mockFunction = vi.fn()
mockFunction.mockReturnValue('mocked value')
mockFunction.mockResolvedValue(Promise.resolve('async value'))
```

#### Mock Modules
```typescript
vi.mock('../api/client', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked' })
}))
```

#### Mock Stores
```typescript
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: '1', name: 'Test User' },
    login: vi.fn(),
    logout: vi.fn()
  }))
}))
```

## Test Utilities

### Custom Render Function

The custom render function in `src/test/utils.tsx` provides:
- Automatic wrapper components
- Mock store providers
- Common testing utilities

```typescript
import { render } from '../../test/utils'

render(<MyComponent />) // Automatically wrapped with providers
```

### Mock Data

Use the mock data generators in `src/test/utils.tsx`:

```typescript
import { mockSystemInfo, mockChatMessages, mockDocuments } from '../../test/utils'

// Use in tests
const mockData = mockSystemInfo
```

### Async Testing

```typescript
import { waitFor, mockApiResponse } from '../../test/utils'

it('should handle async operations', async () => {
  const mockData = { id: 1, name: 'Test' }
  mockApiCall.mockImplementation(() => mockApiResponse(mockData, 100))
  
  render(<AsyncComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

## Coverage Requirements

### Target Coverage
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Exclusions

Files excluded from coverage (configured in `vitest.config.ts`):
- Test files (`**/*.test.*`)
- Configuration files (`**/*.config.*`)
- Type definitions (`**/*.d.ts`)
- Build output (`dist/`, `coverage/`)

## Best Practices

### 1. Test Organization
- Group related tests with `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Test Independence
- Each test should be independent and not rely on other tests
- Use `beforeEach` to set up clean state
- Clean up after tests when necessary

### 3. Mock Strategy
- Mock external dependencies (APIs, file system, etc.)
- Don't mock the code you're testing
- Use realistic mock data

### 4. Async Testing
- Always await async operations
- Use `waitFor` for DOM updates
- Test both success and error cases

### 5. Accessibility Testing
- Test with screen readers in mind
- Use semantic queries (`getByRole`, `getByLabelText`)
- Test keyboard navigation

## Common Patterns

### Testing Forms
```typescript
it('should submit form with valid data', async () => {
  render(<MyForm onSubmit={mockSubmit} />)
  
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))
  
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com'
    })
  })
})
```

### Testing Error States
```typescript
it('should display error message on failure', async () => {
  mockApiCall.mockRejectedValue(new Error('API Error'))
  
  render(<MyComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
```

### Testing Loading States
```typescript
it('should show loading indicator', () => {
  render(<MyComponent loading={true} />)
  
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  expect(screen.queryByText('Content')).not.toBeInTheDocument()
})
```

## Debugging Tests

### Debug Mode
```bash
# Run tests in debug mode
npm run test -- --inspect-brk

# Run specific test in debug mode
npm run test -- --inspect-brk MyComponent.test.tsx
```

### Console Output
```typescript
// Add debug output in tests
screen.debug() // Prints current DOM
console.log(screen.getByTestId('my-element')) // Inspect specific element
```

### VS Code Integration
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "--inspect-brk"],
  "console": "integratedTerminal"
}
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Release builds

### CI Configuration
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Performance Testing

### Bundle Size Testing
```bash
# Analyze bundle size
npm run build
npx bundlesize
```

### Memory Leak Testing
```typescript
it('should not leak memory', () => {
  const { unmount } = render(<MyComponent />)
  
  // Perform operations
  
  unmount()
  
  // Check for cleanup
  expect(/* cleanup verification */).toBe(true)
})
```

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in `vitest.config.ts`
   - Check for unresolved promises
   - Ensure proper cleanup

2. **Mock not working**
   - Check mock placement (before imports)
   - Verify mock path is correct
   - Clear mocks between tests

3. **DOM queries failing**
   - Use `screen.debug()` to inspect DOM
   - Check for async updates with `waitFor`
   - Verify element is actually rendered

### Getting Help

- Check [Vitest documentation](https://vitest.dev/)
- Review [Testing Library guides](https://testing-library.com/docs/)
- Look at existing tests for patterns
- Ask team members for code review
