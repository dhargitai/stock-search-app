import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Navbar } from '../navbar';
import { useAuth } from '../../../hooks/useAuth';

// Mock the auth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/'
  })
}));

// Mock LoginForm component
vi.mock('../auth/LoginForm', () => ({
  LoginForm: ({ onClose }: { onClose: () => void }) => (
    <dialog id="login_modal" className="modal">
      <div className="modal-box">
        <button onClick={onClose}>Close</button>
      </div>
    </dialog>
  )
}));

// Mock auth-redirect utility
vi.mock('../../../lib/auth-redirect', () => ({
  saveRedirectUrl: vi.fn()
}));

describe('Navbar', () => {
  const mockUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when loading', () => {
    it('shows loading spinner', () => {
      mockUseAuth.mockReturnValue({ user: null, session: null, loading: true, isAuthenticated: false, signOut: vi.fn() });
      
      render(<Navbar />);
      
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('renders Peak Finance branding during loading', () => {
      mockUseAuth.mockReturnValue({ user: null, session: null, loading: true, isAuthenticated: false, signOut: vi.fn() });
      
      render(<Navbar />);
      
      const brandLink = screen.getByRole('link', { name: 'Peak Finance' });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute('href', '/');
    });
  });

  describe('when not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, session: null, loading: false, isAuthenticated: false, signOut: vi.fn() });
    });

    it('renders Peak Finance branding', () => {
      render(<Navbar />);
      
      const brandLink = screen.getByRole('link', { name: 'Peak Finance' });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute('href', '/');
    });

    it('renders Sign In and Watchlist buttons for guests', () => {
      render(<Navbar />);
      
      // Count buttons in navbar only, not in modal
      const navbarButtons = screen.getAllByRole('button');
      const signInButtons = navbarButtons.filter(button => button.textContent === 'Sign In');
      const watchlistButtons = navbarButtons.filter(button => button.textContent === 'Watchlist');
      
      expect(signInButtons).toHaveLength(2); // Desktop and mobile
      expect(watchlistButtons).toHaveLength(2); // Desktop and mobile
    });

    it('opens login modal when Sign In button is clicked', () => {
      render(<Navbar />);
      
      // Mock showModal method
      const mockShowModal = vi.fn();
      const mockModal = { showModal: mockShowModal };
      vi.spyOn(document, 'getElementById').mockReturnValue(mockModal as any);
      
      const signInButton = screen.getAllByText('Sign In')[0];
      fireEvent.click(signInButton);
      
      expect(mockShowModal).toHaveBeenCalled();
    });
  });

  describe('when authenticated', () => {
    const mockSignOut = vi.fn();
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ 
        user: { 
          id: '123', 
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2023-01-01T00:00:00.000Z'
        }, 
        session: { 
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: { 
            id: '123', 
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2023-01-01T00:00:00.000Z'
          }
        },
        loading: false,
        isAuthenticated: true,
        signOut: mockSignOut 
      });
    });

    it('renders Watchlist links and Sign Out buttons', () => {
      render(<Navbar />);
      
      // Check for both link and button versions of Watchlist
      const watchlistElements = screen.getAllByText('Watchlist');
      const signOutButtons = screen.getAllByText('Sign Out');
      
      expect(watchlistElements).toHaveLength(2); // Desktop link + mobile button
      expect(signOutButtons).toHaveLength(2); // Desktop and mobile buttons
    });

    it('calls signOut when Sign Out button is clicked', () => {
      render(<Navbar />);
      
      const signOutButton = screen.getAllByText('Sign Out')[0];
      fireEvent.click(signOutButton);
      
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('has proper responsive layout structure', () => {
    mockUseAuth.mockReturnValue({ user: null, session: null, loading: false, isAuthenticated: false, signOut: vi.fn() });
    const { container } = render(<Navbar />);
    
    // Desktop navigation should be hidden on mobile and shown on large screens
    const desktopNav = container.querySelector('.navbar-end.hidden.lg\\:flex');
    expect(desktopNav).toBeInTheDocument();
    
    // Mobile dropdown should be shown on small screens and hidden on large
    const mobileDropdown = container.querySelector('.dropdown.lg\\:hidden');
    expect(mobileDropdown).toBeInTheDocument();
  });

  it('renders mobile hamburger menu with navigation items', () => {
    mockUseAuth.mockReturnValue({ user: null, session: null, loading: false, isAuthenticated: false, signOut: vi.fn() });
    render(<Navbar />);
    
    // Mobile hamburger button (has SVG inside)
    const hamburgerButton = document.querySelector('.dropdown [role="button"]');
    expect(hamburgerButton).toBeInTheDocument();
    expect(hamburgerButton).toHaveAttribute('tabIndex', '0');
    
    // Mobile dropdown menu structure
    const mobileMenu = document.querySelector('.dropdown .menu-sm');
    expect(mobileMenu).toBeInTheDocument();
    
    // Check that mobile menu contains watchlist and sign in buttons
    const mobileSignInButton = mobileMenu?.querySelector('button');
    expect(mobileSignInButton).toBeInTheDocument();
  });

  it('hamburger button has proper SVG icon', () => {
    mockUseAuth.mockReturnValue({ user: null, session: null, loading: false, isAuthenticated: false, signOut: vi.fn() });
    render(<Navbar />);
    
    const hamburgerButton = document.querySelector('.dropdown [role="button"]');
    const svg = hamburgerButton?.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 17 14');
    expect(svg).toHaveClass('w-5', 'h-5');
  });

  it('applies custom className', () => {
    mockUseAuth.mockReturnValue({ user: null, session: null, loading: false, isAuthenticated: false, signOut: vi.fn() });
    const customClass = 'custom-navbar-class';
    const { container } = render(<Navbar className={customClass} />);
    const navbar = container.querySelector('.navbar');
    
    expect(navbar).toHaveClass(customClass);
  });

  it('has proper styling classes', () => {
    mockUseAuth.mockReturnValue({ user: null, session: null, loading: false, isAuthenticated: false, signOut: vi.fn() });
    const { container } = render(<Navbar />);
    const navbar = container.querySelector('.navbar');
    
    expect(navbar).toHaveClass('navbar', 'bg-base-100', 'shadow-sm');
  });

  it('renders LoginForm modal component', () => {
    mockUseAuth.mockReturnValue({ user: null, session: null, loading: false, isAuthenticated: false, signOut: vi.fn() });
    render(<Navbar />);
    
    const modal = screen.getByRole('dialog', { hidden: true });
    expect(modal).toBeInTheDocument();
  });
});