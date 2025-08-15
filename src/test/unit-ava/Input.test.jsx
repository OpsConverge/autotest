import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../../components/ui/input';

describe('Input Component', () => {
  it('renders input with correct placeholder', () => {
    render(<Input placeholder="Enter your name" />);
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeTruthy();
  });

  it('calls onChange handler when value changes', () => {
    const handleChange = (value) => {
      expect(value).toBe('test value');
    };

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
  });

  it('applies disabled state correctly', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input.disabled).toBe(true);
  });

  it('applies type attribute correctly', () => {
    render(<Input type="password" />);
    const input = screen.getByRole('textbox');
    expect(input.type).toBe('password');
  });

  it('handles controlled input value', () => {
    render(<Input value="controlled value" readOnly />);
    const input = screen.getByRole('textbox');
    expect(input.value).toBe('controlled value');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.classList.contains('custom-class')).toBe(true);
  });
});
