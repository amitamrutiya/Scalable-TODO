import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('should render input with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const handleChange = vi.fn();
    render(<Input label="Name" onChange={handleChange} />);

    const input = screen.getByLabelText(/name/i);
    await userEvent.type(input, 'John');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('John');
  });

  it('should display error state', () => {
    render(<Input label="Email" error="Invalid email" />);

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveClass('border-red-500');
  });

  it('should forward ref', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input label="Test" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('should apply custom id if provided', () => {
    render(<Input label="Test" id="custom-id" />);
    expect(screen.getByLabelText(/test/i)).toHaveAttribute('id', 'custom-id');
  });
});
