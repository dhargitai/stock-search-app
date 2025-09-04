import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  saveRedirectUrl, 
  getRedirectUrl, 
  clearRedirectUrl, 
  redirectAfterAuth 
} from '../auth-redirect'

const REDIRECT_KEY = 'auth_redirect_to'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock window.location
const mockReload = vi.fn()
let mockHref = ''

Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
    get href() {
      return mockHref
    },
    set href(value) {
      mockHref = value
    },
  },
  writable: true,
})

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}

describe('auth-redirect utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHref = ''
    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null)
    // Reset router mocks
    mockRouter.push.mockClear()
    mockRouter.refresh.mockClear()
  })

  describe('saveRedirectUrl', () => {
    it('saves redirect URL to localStorage', () => {
      saveRedirectUrl('/test-page')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(REDIRECT_KEY, '/test-page')
    })

    it('handles empty URL', () => {
      saveRedirectUrl('')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(REDIRECT_KEY, '')
    })
  })

  describe('getRedirectUrl', () => {
    it('retrieves redirect URL from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('/saved-page')
      
      const result = getRedirectUrl()
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(REDIRECT_KEY)
      expect(result).toBe('/saved-page')
    })

    it('returns null when no redirect URL is saved', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const result = getRedirectUrl()
      
      expect(result).toBeNull()
    })
  })

  describe('clearRedirectUrl', () => {
    it('removes redirect URL from localStorage', () => {
      clearRedirectUrl()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(REDIRECT_KEY)
    })
  })

  describe('redirectAfterAuth', () => {
    it('redirects to saved URL and clears it', () => {
      mockLocalStorage.getItem.mockReturnValue('/watchlist')
      
      redirectAfterAuth(mockRouter as any)
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(REDIRECT_KEY)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(REDIRECT_KEY)
      expect(mockRouter.push).toHaveBeenCalledWith('/watchlist')
    })

    it('refreshes page when no redirect URL is saved', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      redirectAfterAuth(mockRouter as any)
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(REDIRECT_KEY)
      expect(mockRouter.refresh).toHaveBeenCalled()
    })

    it('refreshes page when redirect URL is home page', () => {
      mockLocalStorage.getItem.mockReturnValue('/')
      
      redirectAfterAuth(mockRouter as any)
      
      expect(mockRouter.refresh).toHaveBeenCalled()
    })

    it('clears redirect URL even when redirecting to home', () => {
      mockLocalStorage.getItem.mockReturnValue('/')
      
      redirectAfterAuth(mockRouter as any)
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(REDIRECT_KEY)
    })
  })

  describe('browser environment handling', () => {
    it('handles server-side environment gracefully', () => {
      // Temporarily remove window object
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      expect(() => {
        saveRedirectUrl('/test')
        getRedirectUrl()
        clearRedirectUrl()
      }).not.toThrow()

      // Restore window
      global.window = originalWindow
    })
  })
})