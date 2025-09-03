import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchInput } from '../search-input';

describe('SearchInput', () => {
  const mockSuggestions = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
  ];

  it('renders with default placeholder', () => {
    render(<SearchInput />);
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search symbol or company...');
  });

  it('renders with custom placeholder', () => {
    const customPlaceholder = 'Enter stock symbol';
    render(<SearchInput placeholder={customPlaceholder} />);
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('placeholder', customPlaceholder);
  });

  it('calls onSearch when input value changes', () => {
    const mockOnSearch = vi.fn();
    render(<SearchInput onSearch={mockOnSearch} />);
    const input = screen.getByRole('combobox');
    
    fireEvent.change(input, { target: { value: 'AAPL' } });
    expect(mockOnSearch).toHaveBeenCalledWith('AAPL');
  });

  it('displays suggestions when input has value and suggestions are provided', async () => {
    render(
      <SearchInput suggestions={mockSuggestions} />
    );
    const input = screen.getByRole('combobox');
    
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'A' } });
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByText('Apple Inc. (AAPL)')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Corporation (MSFT)')).toBeInTheDocument();
    });
  });

  it('hides suggestions when input is empty', async () => {
    render(<SearchInput suggestions={mockSuggestions} />);
    const input = screen.getByRole('combobox');
    
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.change(input, { target: { value: '' } });
    
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('selects suggestion when clicked', async () => {
    const mockOnSearch = vi.fn();
    render(
      <SearchInput onSearch={mockOnSearch} suggestions={mockSuggestions} />
    );
    const input = screen.getByRole('combobox');
    
    fireEvent.change(input, { target: { value: 'A' } });
    
    await waitFor(() => {
      const suggestion = screen.getByText('Apple Inc. (AAPL)');
      fireEvent.click(suggestion);
    });
    
    expect(input).toHaveValue('AAPL');
    expect(mockOnSearch).toHaveBeenCalledWith('AAPL');
  });

  it('hides suggestions when Escape key is pressed', async () => {
    render(<SearchInput suggestions={mockSuggestions} />);
    const input = screen.getByRole('combobox');
    
    fireEvent.change(input, { target: { value: 'A' } });
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    fireEvent.keyDown(input, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('calls onSearch when search button is clicked', () => {
    const mockOnSearch = vi.fn();
    render(<SearchInput onSearch={mockOnSearch} />);
    const input = screen.getByRole('combobox');
    const searchButton = screen.getByRole('button', { name: 'Search' });
    
    fireEvent.change(input, { target: { value: 'AAPL' } });
    fireEvent.click(searchButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith('AAPL');
  });

  it('has proper accessibility attributes', () => {
    render(<SearchInput suggestions={mockSuggestions} />);
    const input = screen.getByRole('combobox');
    
    expect(input).toHaveAttribute('aria-label', 'Stock search input');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.change(input, { target: { value: 'A' } });
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('applies custom className', () => {
    const customClass = 'custom-search-class';
    const { container } = render(<SearchInput className={customClass} />);
    const searchContainer = container.firstChild;
    
    expect(searchContainer).toHaveClass(customClass);
  });
});