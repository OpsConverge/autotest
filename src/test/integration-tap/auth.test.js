const { test } = require('tap');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const React = require('react');
const { BrowserRouter } = require('react-router-dom');
const { Login } = require('../../pages/Login');

test('Login form integration test', async (t) => {
  // Mock fetch for API calls
  global.fetch = () =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ token: 'mock-token', user: { id: 1, email: 'test@example.com' } })
    });

  render(
    React.createElement(BrowserRouter, null,
      React.createElement(Login)
    )
  );

  // Check if login form is rendered
  const emailInput = screen.getByPlaceholderText(/email/i);
  const passwordInput = screen.getByPlaceholderText(/password/i);
  const loginButton = screen.getByRole('button', { name: /sign in/i });

  t.ok(emailInput, 'Email input should be rendered');
  t.ok(passwordInput, 'Password input should be rendered');
  t.ok(loginButton, 'Login button should be rendered');

  // Fill form
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });

  // Submit form
  fireEvent.click(loginButton);

  // Wait for form submission
  await waitFor(() => {
    t.equal(emailInput.value, 'test@example.com', 'Email should be filled');
    t.equal(passwordInput.value, 'password123', 'Password should be filled');
  });

  t.end();
});

test('Login form validation', async (t) => {
  render(
    React.createElement(BrowserRouter, null,
      React.createElement(Login)
    )
  );

  const loginButton = screen.getByRole('button', { name: /sign in/i });
  
  // Try to submit without filling form
  fireEvent.click(loginButton);

  // Should show validation errors
  await waitFor(() => {
    const errorMessages = screen.queryAllByText(/required/i);
    t.ok(errorMessages.length > 0, 'Should show validation errors');
  });

  t.end();
});

test('API integration test', async (t) => {
  let fetchCalled = false;
  
  // Mock fetch to track calls
  global.fetch = () => {
    fetchCalled = true;
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ token: 'mock-token', user: { id: 1, email: 'test@example.com' } })
    });
  };

  render(
    React.createElement(BrowserRouter, null,
      React.createElement(Login)
    )
  );

  const emailInput = screen.getByPlaceholderText(/email/i);
  const passwordInput = screen.getByPlaceholderText(/password/i);
  const loginButton = screen.getByRole('button', { name: /sign in/i });

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(loginButton);

  await waitFor(() => {
    t.ok(fetchCalled, 'Fetch should be called when form is submitted');
  });

  t.end();
});
