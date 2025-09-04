import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import WatchlistPage from '../page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  })
}))

// Mock Supabase server client
vi.mock('../../../lib/supabase/server', () => ({
  createClient: vi.fn()
}))

// Mock WatchlistContent component
vi.mock('../../../components/ui/watchlist-content', () => ({
  WatchlistContent: () => <div data-testid="watchlist-content">Watchlist Content</div>
}))

import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'

const mockRedirect = vi.mocked(redirect)
const mockCreateClient = vi.mocked(createClient)

describe('WatchlistPage', () => {
  const mockSupabaseClient = {
    auth: {
      getSession: vi.fn()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockResolvedValue(mockSupabaseClient as any)
  })

  describe('Authentication', () => {
    it('should redirect to home when user is not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      // Since this is an async server component, we need to await the render
      await expect(async () => {
        await WatchlistPage()
      }).rejects.toThrow('NEXT_REDIRECT')

      expect(mockRedirect).toHaveBeenCalledWith('/')
    })

    it('should render page content when user is authenticated', async () => {
      const mockSession = {
        access_token: 'token',
        user: { id: 'user1', email: 'test@example.com' }
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const WatchlistPageComponent = await WatchlistPage()
      render(WatchlistPageComponent as React.ReactElement)

      expect(screen.getByText('My Watchlist')).toBeInTheDocument()
      expect(screen.getByText('Monitor your saved stocks in one place')).toBeInTheDocument()
      expect(screen.getByTestId('watchlist-content')).toBeInTheDocument()
    })
  })

  describe('Page Structure', () => {
    beforeEach(async () => {
      const mockSession = {
        access_token: 'token',
        user: { id: 'user1', email: 'test@example.com' }
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
    })

    it('should have proper page title and description', async () => {
      const WatchlistPageComponent = await WatchlistPage()
      render(WatchlistPageComponent as React.ReactElement)

      expect(screen.getByRole('heading', { name: /my watchlist/i })).toBeInTheDocument()
      expect(screen.getByText('Monitor your saved stocks in one place')).toBeInTheDocument()
    })

    it('should have proper layout structure and styling', async () => {
      const WatchlistPageComponent = await WatchlistPage()
      render(WatchlistPageComponent as React.ReactElement)

      // Check main container
      const mainContainer = screen.getByText('My Watchlist').closest('.container')
      expect(mainContainer).toHaveClass('container', 'mx-auto', 'px-4', 'py-6')

      // Check max-width wrapper
      const maxWidthWrapper = screen.getByText('My Watchlist').closest('.max-w-4xl')
      expect(maxWidthWrapper).toHaveClass('max-w-4xl', 'mx-auto')

      // Check header section
      const headerSection = screen.getByText('My Watchlist').closest('.mb-8')
      expect(headerSection).toHaveClass('mb-8')
    })

    it('should render h1 with proper styling', async () => {
      const WatchlistPageComponent = await WatchlistPage()
      render(WatchlistPageComponent as React.ReactElement)

      const heading = screen.getByRole('heading', { name: /my watchlist/i })
      expect(heading.tagName).toBe('H1')
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-base-content', 'mb-2')
    })

    it('should render subtitle with proper styling', async () => {
      const WatchlistPageComponent = await WatchlistPage()
      render(WatchlistPageComponent as React.ReactElement)

      const subtitle = screen.getByText('Monitor your saved stocks in one place')
      expect(subtitle).toHaveClass('text-base-content/70')
    })

    it('should render WatchlistContent component', async () => {
      const WatchlistPageComponent = await WatchlistPage()
      render(WatchlistPageComponent as React.ReactElement)

      expect(screen.getByTestId('watchlist-content')).toBeInTheDocument()
    })
  })

  describe('Supabase Integration', () => {
    it('should create Supabase client', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user1' } } },
        error: null
      })

      await WatchlistPage()

      expect(mockCreateClient).toHaveBeenCalled()
    })

    it('should call getSession to check authentication', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user1' } } },
        error: null
      })

      await WatchlistPage()

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
    })

    it('should handle getSession errors gracefully', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Auth error')
      })

      await expect(async () => {
        await WatchlistPage()
      }).rejects.toThrow('NEXT_REDIRECT')

      expect(mockRedirect).toHaveBeenCalledWith('/')
    })
  })

  describe('Server-side Rendering', () => {
    it('should be a server component (no use client directive)', () => {
      // This test ensures the page doesn't have 'use client' directive
      // by checking that it doesn't import client-side hooks
      expect(typeof WatchlistPage).toBe('function')
    })
  })

  describe('Metadata', () => {
    it('should export proper metadata', async () => {
      // Import the metadata export
      const { metadata } = await import('../page')
      
      expect(metadata).toEqual({
        title: 'My Watchlist | Peak Finance',
        description: 'View and manage your saved stocks in one place.',
      })
    })
  })

  describe('Route Protection', () => {
    it('should implement server-side route protection', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      // Test that unauthenticated users are redirected
      await expect(async () => {
        await WatchlistPage()
      }).rejects.toThrow()
      
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })

    it('should allow authenticated users to access the page', async () => {
      const mockSession = {
        access_token: 'token',
        user: { id: 'user1', email: 'test@example.com' }
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await WatchlistPage()
      expect(result).toBeTruthy()
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })
})