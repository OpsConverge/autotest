import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

describe('Card Component', () => {
  it('Card component renders correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Card content</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Test Card')).toBeTruthy();
    expect(screen.getByText('Card content')).toBeTruthy();
  });

  it('Card applies custom className', () => {
    render(<Card className="custom-card" />);
    const card = document.querySelector('.custom-card');
    expect(card).toBeTruthy();
  });

  it('CardHeader renders with title', () => {
    render(
      <CardHeader>
        <CardTitle>Header Title</CardTitle>
      </CardHeader>
    );

    expect(screen.getByText('Header Title')).toBeTruthy();
  });

  it('CardContent renders children', () => {
    render(
      <CardContent>
        <div data-testid="content-child">Content child</div>
      </CardContent>
    );

    expect(screen.getByTestId('content-child')).toBeTruthy();
  });

  it('CardTitle applies heading styles', () => {
    render(<CardTitle>Test Title</CardTitle>);
    const title = screen.getByText('Test Title');
    expect(title).toBeTruthy();
    expect(title.tagName === 'H3' || title.classList.contains('text-lg')).toBe(true);
  });
});
