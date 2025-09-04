import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'

// Get the mocked Supabase methods (these are already mocked in setup.ts)
import { createClient } from '../../lib/supabase'

const mockSupabase = createClient()
const mockGetSession = mockSupabase.auth.getSession as ReturnType<typeof vi.fn>
const mockOnAuthStateChange = mockSupabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>
const mockSignOut = mockSupabase.auth.signOut as ReturnType<typeof vi.fn>

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default mock values
    mockGetSession.mockResolvedValue({ 
      data: { session: null },
      error: null 
    })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  })

  it('initializes with loading state', async () => {
    const { result } = renderHook(() => useAuth())
    
    // Check initial loading state
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)

    // Wait for the async getInitialSession to complete to avoid act() warning
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })
  })

  it('loads session and sets authenticated state', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }
    
    mockGetSession.mockResolvedValue({
      data: { session: mockSession as any },
      error: null
    })

    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles session loading error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Session error')
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('Error getting session:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('listens for auth state changes', async () => {
    let authCallback: any = null
    
    mockOnAuthStateChange.mockImplementation((callback) => {
      authCallback = callback
      return {
        data: { subscription: { unsubscribe: vi.fn() } }
      }
    })

    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })

    expect(authCallback).toBeDefined()

    // Simulate auth state change
    const mockUser = { id: '123', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }
    
    await act(async () => {
      if (authCallback) {
        authCallback('SIGNED_IN', mockSession)
      }
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles sign out', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('handles sign out error', async () => {
    const error = new Error('Sign out error')
    mockSignOut.mockResolvedValue({ error })
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })

    await act(async () => {
      await result.current.signOut()
    })

    expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', error)
    
    consoleSpy.mockRestore()
  })

  it('cleans up subscription on unmount', async () => {
    const mockUnsubscribe = vi.fn()
    
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    const { unmount } = renderHook(() => useAuth())
    
    unmount()
    
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('handles auth state change with null session (sign out)', async () => {
    let authCallback: any = null
    
    mockOnAuthStateChange.mockImplementation((callback) => {
      authCallback = callback
      return {
        data: { subscription: { unsubscribe: vi.fn() } }
      }
    })

    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })

    expect(authCallback).toBeDefined()

    // Simulate sign out
    await act(async () => {
      if (authCallback) {
        authCallback('SIGNED_OUT', null)
      }
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})