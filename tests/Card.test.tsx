import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card', () => {
  describe('rendering', () => {
    it('renders card with children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Test</Card>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('hover state', () => {
    it('applies hover styles when hover is true', () => {
      const { container } = render(<Card hover>Hoverable</Card>);
      expect(container.firstChild).toHaveClass('hover:shadow-md');
    });

    it('does not apply hover styles by default', () => {
      const { container } = render(<Card>Not Hoverable</Card>);
      expect(container.firstChild).not.toHaveClass('hover:shadow-md');
    });
  });

  describe('padding variants', () => {
    it('applies no padding when padding is none', () => {
      const { container } = render(<Card padding="none">None</Card>);
      // padding="none" returns empty string, so no padding class
      expect(container.firstChild).not.toHaveClass('p-4');
      expect(container.firstChild).not.toHaveClass('p-6');
      expect(container.firstChild).not.toHaveClass('p-8');
    });

    it('applies small padding', () => {
      const { container } = render(<Card padding="sm">Small</Card>);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('applies medium padding (default)', () => {
      const { container } = render(<Card>Medium</Card>);
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('applies large padding', () => {
      const { container } = render(<Card padding="lg">Large</Card>);
      expect(container.firstChild).toHaveClass('p-8');
    });
  });

  describe('base styles', () => {
    it('applies background and border styles', () => {
      const { container } = render(<Card>Base Styles</Card>);
      expect(container.firstChild).toHaveClass('bg-bg-card');
      expect(container.firstChild).toHaveClass('border-border');
      expect(container.firstChild).toHaveClass('rounded-xl');
    });
  });
});

describe('CardHeader', () => {
  it('renders card header', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('applies flex and spacing styles', () => {
    const { container } = render(<CardHeader>Test</CardHeader>);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('flex-col');
    expect(container.firstChild).toHaveClass('space-y-1.5');
  });
});

describe('CardTitle', () => {
  it('renders card title', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders as heading element', () => {
    render(<CardTitle>Heading</CardTitle>);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('applies typography styles', () => {
    const { container } = render(<CardTitle>Test</CardTitle>);
    expect(container.firstChild).toHaveClass('text-xl');
    expect(container.firstChild).toHaveClass('font-semibold');
  });
});

describe('CardDescription', () => {
  it('renders card description', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('applies secondary text styles', () => {
    const { container } = render(<CardDescription>Test</CardDescription>);
    expect(container.firstChild).toHaveClass('text-sm');
    expect(container.firstChild).toHaveClass('text-text-secondary');
  });
});

describe('CardContent', () => {
  it('renders card content', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies top padding reset', () => {
    const { container } = render(<CardContent>Test</CardContent>);
    expect(container.firstChild).toHaveClass('pt-0');
  });
});

describe('CardFooter', () => {
  it('renders card footer', () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies flex and alignment styles', () => {
    const { container } = render(<CardFooter>Test</CardFooter>);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('items-center');
  });
});

describe('Card composition', () => {
  it('renders composed card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>Main content goes here</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description text')).toBeInTheDocument();
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});