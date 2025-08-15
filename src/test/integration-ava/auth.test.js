import test from 'ava';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../../pages/Login';

test.beforeEach(() => {
  // Mock fetch for API calls
  global.fetch = () =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ token: 'mock-token', user: { id: 1, email: 'test@example.com' } })
    });
});

test('Login form integration test', async (t) => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );

  // Check if login form is rendered
  const emailInput = screen.getByPlaceholderText(/email/i);
  const passwordInput = screen.getByPlaceholderText(/password/i);
  const loginButton = screen.getByRole('button', { name: /sign in/i });

  t.truthy(emailInput);
  t.truthy(passwordInput);
  t.truthy(loginButton);

  // Fill form
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });

  // Submit form
  fireEvent.click(loginButton);

  // Wait for form submission
  await waitFor(() => {
    t.is(emailInput.value, 'test@example.com');
    t.is(passwordInput.value, 'password123');
  });
});

test('Login form validation', async (t) => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );

  const loginButton = screen.getByRole('button', { name: /sign in/i });
  
  // Try to submit without filling form
  fireEvent.click(loginButton);

  // Should show validation errors
  await waitFor(() => {
    const errorMessages = screen.queryAllByText(/required/i);
    t.truthy(errorMessages.length > 0);
  });
});
