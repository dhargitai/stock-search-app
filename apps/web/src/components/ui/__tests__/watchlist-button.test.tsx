import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WatchlistButton } from '../watchlist-button'
import { useAuth } from '../../../hooks/useAuth'
import { useRouter } from 'next/navigation'

// Mock the dependencies
vi.mock('../../../hooks/useAuth')
vi.mock('next/navigation')

// Mock tRPC API
vi.mock('../../../lib/trpc', () => ({
  api: {
    watchlist: {
      check: {
        useQuery: vi.fn(),
      },
      add: {
        useMutation: vi.fn(),
      },
      remove: {
        useMutation: vi.fn(),
      },
    },
  },
}))

import { api } from '../../../lib/trpc'

const mockUseAuth = useAuth as Mock
const mockUseRouter = useRouter as Mock
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

describe('WatchlistButton', () => {
  const mockSymbol = 'AAPL'
  const mockRouter = {
    push: vi.fn()
  }
  
  const mockCheckQuery = {
    data: undefined,
    isLoading: false,
    refetch: vi.fn()
  }
  
  const mockAddMutation = {
    mutate: vi.fn(),
    isPending: false
  }
  
  const mockRemoveMutation = {
    mutate: vi.fn(),
    isPending: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default router mock
    mockUseRouter.mockReturnValue(mockRouter)
    
    // Default API mocks
    mockApi.watchlist.check.useQuery.mockReturnValue(mockCheckQuery)
    mockApi.watchlist.add.useMutation.mockReturnValue(mockAddMutation)
    mockApi.watchlist.remove.useMutation.mockReturnValue(mockRemoveMutation)
  })

  describe('Guest User (Not Authenticated)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false
      })
    })

    it('should render "Login to Add to Watchlist" button for guest users', () => {
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /login to add to watchlist/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn', 'btn-outline', 'btn-primary')
    })

    it('should open login modal when guest user clicks button', () => {
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /login to add to watchlist/i })
      fireEvent.click(button)
      
      // Check that the login modal appears in the DOM
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    it('should not call watchlist check query for guest users', () => {
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      expect(mockApi.watchlist.check.useQuery).toHaveBeenCalledWith(
        { symbol: mockSymbol },
        expect.objectContaining({
          enabled: false // isAuthenticated && !authLoading should be false
        })
      )
    })
  })

  describe('Authenticated User - Stock Not in Watchlist', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
      
      mockApi.watchlist.check.useQuery.mockReturnValue({
        ...mockCheckQuery,
        data: false // Stock is not in watchlist
      })
    })

    it('should render "Add to Watchlist" button when stock is not in watchlist', () => {
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /add to watchlist/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn', 'btn-primary')
      expect(button).not.toHaveClass('btn-outline')
    })

    it('should call add mutation when clicking "Add to Watchlist"', () => {
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /add to watchlist/i })
      fireEvent.click(button)
      
      expect(mockAddMutation.mutate).toHaveBeenCalledWith({ symbol: mockSymbol })
    })

    it('should enable watchlist check query for authenticated users', () => {
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      expect(mockApi.watchlist.check.useQuery).toHaveBeenCalledWith(
        { symbol: mockSymbol },
        expect.objectContaining({
          enabled: true,
          staleTime: 0
        })
      )
    })
  })

  describe('Authenticated User - Stock In Watchlist', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
      
      mockApi.watchlist.check.useQuery.mockReturnValue({
        ...mockCheckQuery,
        data: true // Stock is in watchlist
      })
    })

    it('should render "Remove from Watchlist" button when stock is in watchlist', () => {
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /remove from watchlist/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn', 'btn-outline', 'btn-secondary')
    })

    it('should call remove mutation when clicking "Remove from Watchlist"', () => {
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /remove from watchlist/i })
      fireEvent.click(button)
      
      expect(mockRemoveMutation.mutate).toHaveBeenCalledWith({ symbol: mockSymbol })
    })
  })

  describe('Loading States', () => {
    it('should show loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: true // Auth is loading
      })
      
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /loading/i })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('should show loading state when check query is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
      
      mockApi.watchlist.check.useQuery.mockReturnValue({
        ...mockCheckQuery,
        isLoading: true
      })
      
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /loading/i })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('should show loading state during add mutation', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
      
      mockApi.watchlist.check.useQuery.mockReturnValue({
        ...mockCheckQuery,
        data: false
      })
      
      mockApi.watchlist.add.useMutation.mockReturnValue({
        ...mockAddMutation,
        isPending: true
      })
      
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /loading/i })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('should show loading state during remove mutation', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
      
      mockApi.watchlist.check.useQuery.mockReturnValue({
        ...mockCheckQuery,
        data: true
      })
      
      mockApi.watchlist.remove.useMutation.mockReturnValue({
        ...mockRemoveMutation,
        isPending: true
      })
      
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /loading/i })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    })
  })

  describe('Optimistic Updates', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
    })

    it('should refetch watchlist status on successful add mutation', async () => {
      const mockRefetch = vi.fn()
      
      mockApi.watchlist.check.useQuery.mockReturnValue({
        ...mockCheckQuery,
        data: false,
        refetch: mockRefetch
      })
      
      // Mock successful add mutation
      mockApi.watchlist.add.useMutation.mockImplementation((options: any) => ({
        ...mockAddMutation,
        mutate: (data: any) => {
          // Simulate successful mutation
          if (options?.onSuccess) {
            options.onSuccess()
          }
        }
      }))
      
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /add to watchlist/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })

    it('should refetch watchlist status on successful remove mutation', async () => {
      const mockRefetch = vi.fn()
      
      mockApi.watchlist.check.useQuery.mockReturnValue({
        ...mockCheckQuery,
        data: true,
        refetch: mockRefetch
      })
      
      // Mock successful remove mutation
      mockApi.watchlist.remove.useMutation.mockImplementation((options: any) => ({
        ...mockRemoveMutation,
        mutate: (data: any) => {
          // Simulate successful mutation
          if (options?.onSuccess) {
            options.onSuccess()
          }
        }
      }))
      
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /remove from watchlist/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      })
      
      // Mock console.error to avoid noise in tests
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('should handle add mutation errors', () => {
      const mockError = new Error('Failed to add')
      
      mockApi.watchlist.check.useQuery.mockReturnValue({
        ...mockCheckQuery,
        data: false
      })
      
      // Mock error in add mutation
      mockApi.watchlist.add.useMutation.mockImplementation((options: any) => ({
        ...mockAddMutation,
        mutate: (data: any) => {
          if (options?.onError) {
            options.onError(mockError)
          }
        }
      }))
      
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /add to watchlist/i })
      fireEvent.click(button)
      
      expect(console.error).toHaveBeenCalledWith('Failed to add to watchlist:', mockError)
    })

    it('should handle remove mutation errors', () => {
      const mockError = new Error('Failed to remove')
      
      mockApi.watchlist.check.useQuery.mockReturnValue({
        ...mockCheckQuery,
        data: true
      })
      
      // Mock error in remove mutation
      mockApi.watchlist.remove.useMutation.mockImplementation((options: any) => ({
        ...mockRemoveMutation,
        mutate: (data: any) => {
          if (options?.onError) {
            options.onError(mockError)
          }
        }
      }))
      
      render(
        <TestWrapper>
          <WatchlistButton symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const button = screen.getByRole('button', { name: /remove from watchlist/i })
      fireEvent.click(button)
      
      expect(console.error).toHaveBeenCalledWith('Failed to remove from watchlist:', mockError)
    })
  })
})