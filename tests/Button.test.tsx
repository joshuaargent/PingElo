import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  describe('rendering', () => {
    it('renders button with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(<Button className="custom-class">Test</Button>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('variants', () => {
    it('applies primary variant styles', () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      expect(container.firstChild).toHaveClass('bg-accent');
    });

    it('applies secondary variant styles', () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>);
      expect(container.firstChild).toHaveClass('bg-bg-secondary');
    });

    it('applies outline variant styles', () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      expect(container.firstChild).toHaveClass('border');
    });

    it('applies ghost variant styles', () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      expect(container.firstChild).toHaveClass('text-text-primary');
    });

    it('applies link variant styles', () => {
      const { container } = render(<Button variant="link">Link</Button>);
      expect(container.firstChild).toHaveClass('text-accent');
    });

    it('applies danger variant styles', () => {
      const { container } = render(<Button variant="danger">Danger</Button>);
      expect(container.firstChild).toHaveClass('bg-red-600');
    });
  });

  describe('sizes', () => {
    it('applies small size styles', () => {
      const { container } = render(<Button size="sm">Small</Button>);
      expect(container.firstChild).toHaveClass('h-9');
    });

    it('applies medium size styles', () => {
      const { container } = render(<Button size="md">Medium</Button>);
      expect(container.firstChild).toHaveClass('h-11');
    });

    it('applies large size styles', () => {
      const { container } = render(<Button size="lg">Large</Button>);
      expect(container.firstChild).toHaveClass('h-14');
    });

    it('applies icon size styles', () => {
      const { container } = render(<Button size="icon">Icon</Button>);
      expect(container.firstChild).toHaveClass('h-10');
    });
  });

  describe('loading state', () => {
    it('shows spinner when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('disables button when loading', () => {
      render(<Button isLoading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('disabled state', () => {
    it('disables the button', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled styles', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      expect(container.firstChild).toHaveClass('disabled:opacity-50');
    });
  });

  describe('icons', () => {
    it('renders left icon', () => {
      const { container } = render(
        <Button leftIcon={<span data-testid="left-icon">←</span>}>
          With Left Icon
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      render(
        <Button rightIcon={<span data-testid="right-icon">→</span>}>
          With Right Icon
        </Button>
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('hides right icon when loading', () => {
      render(
        <Button isLoading rightIcon={<span data-testid="right-icon">→</span>}>
          Loading
        </Button>
      );
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('event handling', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('forwardRef', () => {
    it('forwards ref to button element', () => {
      const ref = { current: null } as React.RefObject<HTMLButtonElement>;
      render(<Button ref={ref}>Ref Button</Button>);
      expect(ref.current).not.toBeNull();
    });
  });
});