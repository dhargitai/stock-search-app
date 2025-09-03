import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchInput } from '../search-input';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the tRPC API
vi.mock('@/lib/api', () => ({
  api: {
    stock: {
      search: {
        useQuery: vi.fn(),
      },
    },
  },
}));

import { api } from '@/lib/api';

const mockUseQuery = vi.mocked(api.stock.search.useQuery);

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('SearchInput with tRPC Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it('renders with default placeholder', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SearchInput />
      </TestWrapper>
    );
    
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search symbol or company...');
  });

  it('displays loading state while fetching suggestions', async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SearchInput />
      </TestWrapper>
    );
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'AAPL' } });
    
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  it('displays suggestions when data is loaded', async () => {
    const mockSuggestions = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
    ];

    mockUseQuery.mockReturnValue({
      data: mockSuggestions,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SearchInput />
      </TestWrapper>
    );
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'A' } });
    
    await waitFor(() => {
      expect(screen.getByText('Apple Inc. (AAPL)')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Corporation (MSFT)')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: { message: 'API rate limit exceeded' },
    } as any);

    render(
      <TestWrapper>
        <SearchInput />
      </TestWrapper>
    );
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'AAPL' } });
    
    await waitFor(() => {
      expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument();
    });
  });

  it('displays "no results" message when no suggestions found', async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SearchInput />
      </TestWrapper>
    );
    
    const input = screen.getByRole('combobox');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'NONEXISTENT' } });
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350));
    });
    
    await waitFor(() => {
      expect(screen.getByText('No matching stocks found.')).toBeInTheDocument();
    });
  });

  it('navigates to stock detail page when suggestion is clicked', async () => {
    const mockSuggestions = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
    ];

    mockUseQuery.mockReturnValue({
      data: mockSuggestions,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SearchInput />
      </TestWrapper>
    );
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'A' } });
    
    await waitFor(() => {
      const suggestion = screen.getByText('Apple Inc. (AAPL)');
      fireEvent.click(suggestion);
    });
    
    expect(mockPush).toHaveBeenCalledWith('/AAPL');
  });

  it('debounces API calls', async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SearchInput />
      </TestWrapper>
    );
    
    const input = screen.getByRole('combobox');
    
    await act(async () => {
      // Type quickly
      fireEvent.change(input, { target: { value: 'A' } });
      fireEvent.change(input, { target: { value: 'AA' } });
      fireEvent.change(input, { target: { value: 'AAP' } });
      fireEvent.change(input, { target: { value: 'AAPL' } });
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350));
    });
    
    // Should only be called once with the final query after debounce
    expect(mockUseQuery).toHaveBeenCalledWith(
      { query: 'AAPL' },
      {
        enabled: true,
        staleTime: 5 * 60 * 1000,
      }
    );
  });

  it('only enables query when debouncedQuery length > 0', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SearchInput />
      </TestWrapper>
    );
    
    // Should be called with enabled: false when no query
    expect(mockUseQuery).toHaveBeenCalledWith(
      { query: '' },
      {
        enabled: false,
        staleTime: 5 * 60 * 1000,
      }
    );
  });

  it('calls onSearch callback when provided', () => {
    const mockOnSearch = vi.fn();
    
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SearchInput onSearch={mockOnSearch} />
      </TestWrapper>
    );
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'AAPL' } });
    
    expect(mockOnSearch).toHaveBeenCalledWith('AAPL');
  });

  it('handles special characters in stock symbols', async () => {
    const mockSuggestions = [
      { symbol: 'BRK.A', name: 'Berkshire Hathaway Inc. Class A' },
    ];

    mockUseQuery.mockReturnValue({
      data: mockSuggestions,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <SearchInput />
      </TestWrapper>
    );
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'BRK' } });
    
    await waitFor(() => {
      const suggestion = screen.getByText('Berkshire Hathaway Inc. Class A (BRK.A)');
      fireEvent.click(suggestion);
    });
    
    expect(mockPush).toHaveBeenCalledWith('/BRK.A');
  });
});