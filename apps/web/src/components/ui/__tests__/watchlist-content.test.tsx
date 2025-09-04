import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WatchlistContent } from '../watchlist-content'
import { useAuth } from '../../../hooks/useAuth'

// Mock the dependencies
vi.mock('../../../hooks/useAuth')
vi.mock('../watchlist-item', () => ({
  WatchlistItem: ({ symbol, onRemove }: { symbol: string; onRemove: () => void }) => (
    <div data-testid={`watchlist-item-${symbol}`}>
      <span>{symbol}</span>
      <button onClick={onRemove}>Remove</button>
    </div>
  )
}))

// Mock tRPC API
vi.mock('../../../lib/trpc', () => ({
  api: {
    watchlist: {
      get: {
        useQuery: vi.fn(),
      },
    },
  },
}))

import { api } from '../../../lib/trpc'

const mockUseAuth = useAuth as Mock
const mockApi = vi.mocked(api) as any

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('WatchlistContent', () => {
  const mockWatchlistData = [
    { id: 1, symbol: 'AAPL', userId: 'user1', createdAt: new Date() },
    { id: 2, symbol: 'GOOGL', userId: 'user1', createdAt: new Date() },
    { id: 3, symbol: 'MSFT', userId: 'user1', createdAt: new Date() }
  ]

  const mockGetQuery = {
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default API mock
    mockApi.watchlist.get.useQuery.mockReturnValue(mockGetQuery)
  })

  describe('Authentication Loading State', () => {
    it('should show loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      expect(document.querySelector('.loading-spinner')).toBeTruthy()
    })

    it('should disable query when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: true
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      expect(mockApi.watchlist.get.useQuery).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          enabled: false // isAuthenticated && !authLoading should be false
        })
      )
    })
  })

  describe('Data Loading State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
    })

    it('should show loading spinner when data is loading', () => {
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        isLoading: true
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      expect(document.querySelector('.loading-spinner')).toBeTruthy()
    })

    it('should enable query for authenticated users', () => {
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      expect(mockApi.watchlist.get.useQuery).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          enabled: true,
          staleTime: 0
        })
      )
    })
  })

  describe('Error State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
    })

    it('should display error message when API call fails', () => {
      const mockError = new Error('Failed to fetch watchlist')
      
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        error: mockError
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      expect(screen.getByText('Failed to load watchlist. Please try again.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should call refetch when retry button is clicked', () => {
      const mockRefetch = vi.fn()
      const mockError = new Error('Failed to fetch watchlist')
      
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        error: mockError,
        refetch: mockRefetch
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)
      
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('should have proper error alert styling', () => {
      const mockError = new Error('Failed to fetch watchlist')
      
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        error: mockError
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      const alert = screen.getByText('Failed to load watchlist. Please try again.').closest('.alert')
      expect(alert).toHaveClass('alert', 'alert-error')
    })
  })

  describe('Empty State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
    })

    it('should display empty state when watchlist is empty', () => {
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        data: []
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument()
      expect(screen.getByText('Search for stocks to add them to your list.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /find stocks/i })).toBeInTheDocument()
    })

    it('should display empty state when data is undefined', () => {
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        data: undefined
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument()
    })

    it('should have correct link to home page in empty state', () => {
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        data: []
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      const findStocksLink = screen.getByRole('link', { name: /find stocks/i })
      expect(findStocksLink).toHaveAttribute('href', '/')
      expect(findStocksLink).toHaveClass('btn', 'btn-primary')
    })

    it('should render heart icon in empty state', () => {
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        data: []
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      // Check for SVG heart icon
      const heartIcon = document.querySelector('svg')
      expect(heartIcon).toBeTruthy()
    })
  })

  describe('Populated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
      
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        data: mockWatchlistData
      })
    })

    it('should render watchlist items when data is available', () => {
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      expect(screen.getByTestId('watchlist-item-AAPL')).toBeInTheDocument()
      expect(screen.getByTestId('watchlist-item-GOOGL')).toBeInTheDocument()
      expect(screen.getByTestId('watchlist-item-MSFT')).toBeInTheDocument()
    })

    it('should pass correct props to WatchlistItem components', () => {
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      // Check that each symbol is displayed
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('GOOGL')).toBeInTheDocument()
      expect(screen.getByText('MSFT')).toBeInTheDocument()
    })

    it('should call refetch when WatchlistItem onRemove is triggered', () => {
      const mockRefetch = vi.fn()
      
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        data: mockWatchlistData,
        refetch: mockRefetch
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      // Click remove button on first item
      const removeButton = screen.getAllByText('Remove')[0]
      fireEvent.click(removeButton)
      
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('should have proper container styling for watchlist items', () => {
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      const container = screen.getByTestId('watchlist-item-AAPL').parentElement
      expect(container).toHaveClass('space-y-4')
    })
  })

  describe('Authentication States', () => {
    it('should not render when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      // Should not call the API when not authenticated
      expect(mockApi.watchlist.get.useQuery).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          enabled: false
        })
      )
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
    })

    it('should have responsive empty state layout', () => {
      mockApi.watchlist.get.useQuery.mockReturnValue({
        ...mockGetQuery,
        data: []
      })
      
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      const emptyStateContainer = screen.getByText('Your watchlist is empty').closest('.text-center')
      expect(emptyStateContainer).toHaveClass('text-center')
      
      const maxWidthContainer = screen.getByText('Search for stocks to add them to your list.').closest('.max-w-md')
      expect(maxWidthContainer).toHaveClass('max-w-md', 'mx-auto')
    })
  })

  describe('Data Freshness', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
    })

    it('should always fetch fresh data (staleTime: 0)', () => {
      render(
        <TestWrapper>
          <WatchlistContent />
        </TestWrapper>
      )
      
      expect(mockApi.watchlist.get.useQuery).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          staleTime: 0
        })
      )
    })
  })
})