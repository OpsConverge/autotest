import test from 'ava';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/ui/button';

test('Button component renders with correct text', (t) => {
  render(<Button>Click me</Button>);
  const button = screen.getByRole('button', { name: /click me/i });
  t.truthy(button);
});

test('Button calls onClick handler when clicked', (t) => {
  let clicked = false;
  const handleClick = () => { clicked = true; };
  
  render(<Button onClick={handleClick}>Click me</Button>);
  const button = screen.getByRole('button', { name: /click me/i });
  
  fireEvent.click(button);
  t.true(clicked);
});

test('Button applies variant classes correctly', (t) => {
  const { rerender } = render(<Button variant="default">Default</Button>);
  let button = screen.getByRole('button', { name: /default/i });
  t.true(button.classList.contains('bg-primary'));

  rerender(<Button variant="destructive">Destructive</Button>);
  button = screen.getByRole('button', { name: /destructive/i });
  t.true(button.classList.contains('bg-destructive'));
});

test('Button applies size classes correctly', (t) => {
  const { rerender } = render(<Button size="default">Default</Button>);
  let button = screen.getByRole('button', { name: /default/i });
  t.true(button.classList.contains('h-10'));

  rerender(<Button size="sm">Small</Button>);
  button = screen.getByRole('button', { name: /small/i });
  t.true(button.classList.contains('h-9'));
});

test('Button is disabled when disabled prop is true', (t) => {
  render(<Button disabled>Disabled</Button>);
  const button = screen.getByRole('button', { name: /disabled/i });
  t.true(button.disabled);
});

test('Button does not call onClick when disabled', (t) => {
  let clicked = false;
  const handleClick = () => { clicked = true; };
  
  render(<Button disabled onClick={handleClick}>Disabled</Button>);
  const button = screen.getByRole('button', { name: /disabled/i });
  
  fireEvent.click(button);
  t.false(clicked);
});
