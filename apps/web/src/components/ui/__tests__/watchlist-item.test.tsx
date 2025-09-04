import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WatchlistItem } from '../watchlist-item'
import { useRouter } from 'next/navigation'

// Mock the dependencies
vi.mock('next/navigation')

// Mock tRPC API
vi.mock('../../../lib/trpc', () => ({
  api: {
    watchlist: {
      remove: {
        useMutation: vi.fn(),
      },
    },
  },
}))

import { api } from '../../../lib/trpc'

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

describe('WatchlistItem', () => {
  const mockSymbol = 'AAPL'
  const mockOnRemove = vi.fn()
  const mockRouter = {
    push: vi.fn()
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
    mockApi.watchlist.remove.useMutation.mockReturnValue(mockRemoveMutation)
  })

  describe('Rendering', () => {
    it('should render stock symbol and information', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      // Check stock symbol display
      expect(screen.getByText(mockSymbol)).toBeInTheDocument()
      expect(screen.getByText('Stock Quote • Click to view details')).toBeInTheDocument()
      
      // Check symbol avatar (first 2 characters)
      expect(screen.getByText('AA')).toBeInTheDocument()
    })

    it('should render remove button with proper accessibility', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      expect(removeButton).toBeInTheDocument()
      expect(removeButton).toHaveClass('btn', 'btn-square', 'btn-ghost', 'btn-sm')
    })
  })

  describe('Navigation', () => {
    it('should navigate to stock detail page when clicking the item', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      // Click on the list row (not the remove button)
      const listRow = screen.getByText(mockSymbol).closest('.list-row')
      expect(listRow).toBeTruthy()
      
      fireEvent.click(listRow!)
      
      expect(mockRouter.push).toHaveBeenCalledWith(`/${mockSymbol}`)
    })

    it('should have cursor pointer and hover effects', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const listRow = screen.getByText(mockSymbol).closest('.list-row')
      expect(listRow).toHaveClass('cursor-pointer', 'hover:bg-base-200', 'transition-colors')
    })
  })

  describe('Remove Functionality', () => {
    it('should call remove mutation when clicking remove button', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      fireEvent.click(removeButton)
      
      expect(mockRemoveMutation.mutate).toHaveBeenCalledWith({ symbol: mockSymbol })
    })

    it('should stop propagation when clicking remove button', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      fireEvent.click(removeButton)
      
      // Router should not be called when clicking remove button
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should call onRemove callback on successful removal', async () => {
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
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      fireEvent.click(removeButton)
      
      await waitFor(() => {
        expect(mockOnRemove).toHaveBeenCalled()
      })
    })

    it('should work without onRemove callback', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      
      // Should not throw error when onRemove is undefined
      expect(() => fireEvent.click(removeButton)).not.toThrow()
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner during remove operation', () => {
      // Mock mutation in pending state
      mockApi.watchlist.remove.useMutation.mockImplementation((options: any) => ({
        ...mockRemoveMutation,
        mutate: (data: any) => {
          // Simulate onMutate being called
          if (options?.onMutate) {
            options.onMutate()
          }
        }
      }))
      
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      fireEvent.click(removeButton)
      
      // Check for loading spinner
      expect(screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` }))
        .toContainHTML('<span class="loading loading-spinner loading-sm"')
    })

    it('should disable remove button during loading', () => {
      // Mock mutation in pending state
      mockApi.watchlist.remove.useMutation.mockImplementation((options: any) => ({
        ...mockRemoveMutation,
        mutate: (data: any) => {
          if (options?.onMutate) {
            options.onMutate()
          }
        }
      }))
      
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      fireEvent.click(removeButton)
      
      expect(removeButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock console.error to avoid noise in tests
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('should handle remove mutation errors', () => {
      const mockError = new Error('Failed to remove')
      
      // Mock error in remove mutation
      mockApi.watchlist.remove.useMutation.mockImplementation((options: any) => ({
        ...mockRemoveMutation,
        mutate: (data: any) => {
          // First call onMutate to set loading state
          if (options?.onMutate) {
            options.onMutate()
          }
          // Then call onError
          if (options?.onError) {
            options.onError(mockError)
          }
        }
      }))
      
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      fireEvent.click(removeButton)
      
      expect(console.error).toHaveBeenCalledWith('Failed to remove from watchlist:', mockError)
    })

    it('should reset loading state on error', async () => {
      const mockError = new Error('Failed to remove')
      
      mockApi.watchlist.remove.useMutation.mockImplementation((options: any) => ({
        ...mockRemoveMutation,
        mutate: (data: any) => {
          if (options?.onMutate) {
            options.onMutate()
          }
          if (options?.onError) {
            options.onError(mockError)
          }
        }
      }))
      
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      fireEvent.click(removeButton)
      
      // Wait for error handling to complete
      await waitFor(() => {
        expect(removeButton).not.toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      expect(removeButton).toHaveAttribute('aria-label', `Remove ${mockSymbol} from watchlist`)
    })

    it('should be keyboard accessible', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      
      // Should be focusable
      removeButton.focus()
      expect(document.activeElement).toBe(removeButton)
    })
  })

  describe('Visual Styling', () => {
    it('should apply correct DaisyUI classes', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      // Check main container classes
      const container = screen.getByText(mockSymbol).closest('.list')
      expect(container).toHaveClass('list', 'bg-base-100', 'rounded-box', 'shadow-sm')
      
      // Check list row classes
      const listRow = screen.getByText(mockSymbol).closest('.list-row')
      expect(listRow).toHaveClass('list-row')
      
      // Check growing column
      const growingCol = screen.getByText(mockSymbol).closest('.list-col-grow')
      expect(growingCol).toHaveClass('list-col-grow')
    })

    it('should have proper button styling', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const removeButton = screen.getByRole('button', { name: `Remove ${mockSymbol} from watchlist` })
      expect(removeButton).toHaveClass(
        'btn', 'btn-square', 'btn-ghost', 'btn-sm', 
        'text-error', 'hover:bg-error', 'hover:text-error-content'
      )
    })

    it('should render stock symbol avatar with proper styling', () => {
      render(
        <TestWrapper>
          <WatchlistItem symbol={mockSymbol} onRemove={mockOnRemove} />
        </TestWrapper>
      )
      
      const avatar = screen.getByText('AA')
      expect(avatar).toHaveClass(
        'size-12', 'bg-primary', 'text-primary-content', 
        'rounded-lg', 'flex', 'items-center', 'justify-center', 
        'font-bold', 'text-sm'
      )
    })
  })

})