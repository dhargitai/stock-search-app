'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginForm } from '../auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { saveRedirectUrl } from '../../lib/auth-redirect';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className = '' }: NavbarProps): JSX.Element {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      // Save the intended destination
      saveRedirectUrl('/watchlist');
      // Open login modal
      handleLoginClick();
    }
  };

  const handleCloseModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleSignOut = () => {
    signOut();
  };

  if (loading) {
    return (
      <div className={`navbar bg-base-100 shadow-sm ${className}`}>
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold text-primary">
            Peak Finance
          </Link>
        </div>
        <div className="navbar-end">
          <span className="loading loading-spinner"></span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`navbar bg-base-100 shadow-sm ${className}`}>
        <div className="navbar-start">
          <div className="dropdown lg:hidden">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 17 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 1h15M1 7h15M1 13h15"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              {user ? (
                <>
                  <li>
                    <Link href="/watchlist">Watchlist</Link>
                  </li>
                  <li>
                    <button onClick={handleSignOut}>Sign Out</button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button onClick={handleWatchlistClick}>Watchlist</button>
                  </li>
                  <li>
                    <button onClick={handleLoginClick}>Sign In</button>
                  </li>
                </>
              )}
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost text-xl font-bold text-primary">
            Peak Finance
          </Link>
        </div>
        <div className="navbar-end hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {user ? (
              <>
                <li>
                  <Link href="/watchlist" className="btn btn-ghost">
                    Watchlist
                  </Link>
                </li>
                <li>
                  <button onClick={handleSignOut} className="btn btn-ghost">
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <button onClick={handleWatchlistClick} className="btn btn-ghost">
                    Watchlist
                  </button>
                </li>
                <li>
                  <button onClick={handleLoginClick} className="btn btn-ghost">
                    Sign In
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
      <LoginForm onClose={handleCloseModal} isOpen={isLoginModalOpen} />
    </>
  );
}