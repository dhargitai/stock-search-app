import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from '../navbar';

describe('Navbar', () => {
  it('renders Peak Finance branding', () => {
    render(<Navbar />);
    const brandLink = screen.getByRole('link', { name: 'Peak Finance' });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('renders Login and Watchlist links in desktop navigation', () => {
    render(<Navbar />);
    
    // Desktop navigation (hidden on mobile, visible on lg+)
    const desktopNav = document.querySelector('.navbar-end .menu-horizontal');
    expect(desktopNav).toBeInTheDocument();
    
    const loginLinks = screen.getAllByRole('link', { name: 'Login' });
    const watchlistLinks = screen.getAllByRole('link', { name: 'Watchlist' });
    
    expect(loginLinks).toHaveLength(2); // One in mobile menu, one in desktop
    expect(watchlistLinks).toHaveLength(2); // One in mobile menu, one in desktop
    
    // Check desktop links have correct hrefs
    const desktopLoginLink = loginLinks.find(link => 
      link.closest('.navbar-end .menu-horizontal')
    );
    const desktopWatchlistLink = watchlistLinks.find(link => 
      link.closest('.navbar-end .menu-horizontal')
    );
    
    expect(desktopLoginLink).toHaveAttribute('href', '/login');
    expect(desktopWatchlistLink).toHaveAttribute('href', '/watchlist');
  });

  it('renders mobile hamburger menu with navigation links', () => {
    render(<Navbar />);
    
    // Mobile hamburger button
    const hamburgerButton = screen.getByRole('button');
    expect(hamburgerButton).toBeInTheDocument();
    expect(hamburgerButton).toHaveAttribute('tabIndex', '0');
    
    // Mobile dropdown menu
    const mobileMenu = document.querySelector('.dropdown .menu-sm');
    expect(mobileMenu).toBeInTheDocument();
    
    const loginLinks = screen.getAllByRole('link', { name: 'Login' });
    const watchlistLinks = screen.getAllByRole('link', { name: 'Watchlist' });
    
    // Check mobile links have correct hrefs
    const mobileLoginLink = loginLinks.find(link => 
      link.closest('.dropdown .menu-sm')
    );
    const mobileWatchlistLink = watchlistLinks.find(link => 
      link.closest('.dropdown .menu-sm')
    );
    
    expect(mobileLoginLink).toHaveAttribute('href', '/login');
    expect(mobileWatchlistLink).toHaveAttribute('href', '/watchlist');
  });

  it('has proper responsive visibility classes', () => {
    const { container } = render(<Navbar />);
    
    // Mobile hamburger menu should be hidden on large screens
    const mobileDropdown = container.querySelector('.dropdown.lg\\:hidden');
    expect(mobileDropdown).toBeInTheDocument();
    
    // Desktop navigation should be hidden on small screens and visible on large
    const desktopNav = container.querySelector('.navbar-end.hidden.lg\\:flex');
    expect(desktopNav).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-navbar-class';
    const { container } = render(<Navbar className={customClass} />);
    const navbar = container.querySelector('.navbar');
    
    expect(navbar).toHaveClass(customClass);
  });

  it('has proper styling classes', () => {
    const { container } = render(<Navbar />);
    const navbar = container.querySelector('.navbar');
    
    expect(navbar).toHaveClass('navbar', 'bg-base-100', 'shadow-sm');
  });

  it('hamburger button has proper SVG icon', () => {
    render(<Navbar />);
    const hamburgerButton = screen.getByRole('button');
    const svg = hamburgerButton.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 17 14');
    expect(svg).toHaveClass('w-5', 'h-5');
  });
});