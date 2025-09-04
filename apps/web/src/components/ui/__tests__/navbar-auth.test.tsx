import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { Navbar } from '../navbar'
import { saveRedirectUrl } from '../../../lib/auth-redirect'

// Mock the auth hook
const mockUseAuth = vi.fn()
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}))

const mockSaveRedirectUrl = vi.mocked(saveRedirectUrl)

// Mock the auth-redirect utility
vi.mock('../../../lib/auth-redirect', () => ({
  saveRedirectUrl: vi.fn(),
  redirectAfterAuth: vi.fn()
}))

// Mock Next.js router - already handled in setup.ts

// Mock LoginForm component
vi.mock('../../auth/LoginForm', () => ({
  LoginForm: ({ onClose, isOpen }: { onClose: () => void; isOpen?: boolean }) => 
    isOpen ? (
      <div data-testid="login-form">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
}))

// Mock dialog methods
const mockShowModal = vi.fn()
const mockClose = vi.fn()

// Mock document.getElementById
const originalGetElementById = document.getElementById
beforeEach(() => {
  document.getElementById = vi.fn().mockReturnValue({
    showModal: mockShowModal,
    close: mockClose
  } as any)
})

afterEach(() => {
  document.getElementById = originalGetElementById
})

describe('Navbar Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state', () => {
    it('shows loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signOut: vi.fn(),
      })

      act(() => {
        render(<Navbar />)
      })
      
      expect(screen.getByText('Peak Finance')).toBeInTheDocument()
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      })
    })

    it('shows Sign In and Watchlist buttons for guests', () => {
      act(() => {
        render(<Navbar />)
      })
      
      expect(screen.getAllByText('Sign In')).toHaveLength(2) // desktop and mobile
      expect(screen.getAllByText('Watchlist')).toHaveLength(2) // desktop and mobile
    })

    it('opens login modal when Sign In is clicked', () => {
      act(() => {
        render(<Navbar />)
      })
      
      const signInButtons = screen.getAllByText('Sign In')
      fireEvent.click(signInButtons[0])
      
      // Check that the LoginForm modal appears
      expect(screen.getByTestId('login-form')).toBeInTheDocument()
    })

    it('saves redirect URL and opens login modal when Watchlist is clicked', () => {
      act(() => {
        render(<Navbar />)
      })
      
      const watchlistButtons = screen.getAllByText('Watchlist')
      fireEvent.click(watchlistButtons[0])
      
      expect(mockSaveRedirectUrl).toHaveBeenCalledWith('/watchlist')
      // Check that the LoginForm modal appears
      expect(screen.getByTestId('login-form')).toBeInTheDocument()
    })
  })

  describe('Authenticated state', () => {
    const mockSignOut = vi.fn()

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'test@example.com' },
        loading: false,
        signOut: mockSignOut,
      })
    })

    it('shows Watchlist and Sign Out buttons for authenticated users', () => {
      act(() => {
        render(<Navbar />)
      })
      
      expect(screen.getAllByText('Watchlist')).toHaveLength(2) // desktop and mobile
      expect(screen.getAllByText('Sign Out')).toHaveLength(2) // desktop and mobile
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    })

    it('calls signOut when Sign Out is clicked', () => {
      act(() => {
        render(<Navbar />)
      })
      
      const signOutButtons = screen.getAllByText('Sign Out')
      fireEvent.click(signOutButtons[0])
      
      expect(mockSignOut).toHaveBeenCalled()
    })

    it('navigates to watchlist directly when authenticated', () => {
      act(() => {
        render(<Navbar />)
      })
      
      // Desktop navigation should have a link to /watchlist
      const watchlistLinks = screen.getAllByRole('link', { name: 'Watchlist' })
      expect(watchlistLinks).toHaveLength(2) // mobile and desktop
      expect(watchlistLinks[0]).toHaveAttribute('href', '/watchlist')
      expect(watchlistLinks[1]).toHaveAttribute('href', '/watchlist')
    })
  })

  describe('Modal interaction', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      })
    })

    it('closes login modal when onClose is called', () => {
      act(() => {
        render(<Navbar />)
      })
      
      // First open the modal
      const signInButton = screen.getAllByText('Sign In')[0]
      fireEvent.click(signInButton)
      
      // Verify modal is open
      expect(screen.getByTestId('login-form')).toBeInTheDocument()
      
      // Find the close button in the mocked LoginForm and click it
      const closeButton = screen.getByText('Close Modal')
      fireEvent.click(closeButton)
      
      // Verify modal is closed (mocked LoginForm should disappear)
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument()
    })
  })

  describe('Responsive design', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      })
    })

    it('renders mobile dropdown menu', () => {
      act(() => {
        render(<Navbar />)
      })
      
      // Look for the mobile dropdown menu structure
      const mobileDropdown = document.querySelector('.dropdown')
      expect(mobileDropdown).toBeInTheDocument()

      // Mobile menu should contain the hamburger button
      const mobileMenuButton = mobileDropdown?.querySelector('[role="button"]')
      expect(mobileMenuButton).toBeInTheDocument()
    })

    it('shows desktop navigation items', () => {
      act(() => {
        render(<Navbar />)
      })
      
      // Desktop navigation should have the hidden lg:flex class structure  
      const desktopNav = document.querySelector('.navbar-end.hidden.lg\\:flex')
      expect(desktopNav).toBeInTheDocument()

      // Should contain menu with navigation items
      const desktopMenu = desktopNav?.querySelector('.menu.menu-horizontal')
      expect(desktopMenu).toBeInTheDocument()
    })
  })

  describe('Brand link', () => {
    it('renders Peak Finance brand link to home', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      })

      act(() => {
        render(<Navbar />)
      })
      
      const brandLink = screen.getByText('Peak Finance')
      expect(brandLink.closest('a')).toHaveAttribute('href', '/')
    })
  })

  describe('Custom className prop', () => {
    it('applies custom className to navbar', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      })

      let container: any
      act(() => {
        const result = render(<Navbar className="custom-class" />)
        container = result.container
      })
      
      const navbar = container.querySelector('.navbar')
      expect(navbar).toHaveClass('custom-class')
    })
  })
})