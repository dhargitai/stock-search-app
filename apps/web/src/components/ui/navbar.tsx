import Link from 'next/link';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className = '' }: NavbarProps): JSX.Element {
  return (
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
            <li>
              <Link href={"/login" as any}>Login</Link>
            </li>
            <li>
              <Link href={"/watchlist" as any}>Watchlist</Link>
            </li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl font-bold text-primary">
          Peak Finance
        </Link>
      </div>
      <div className="navbar-end hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link href={"/login" as any} className="btn btn-ghost">
              Login
            </Link>
          </li>
          <li>
            <Link href={"/watchlist" as any} className="btn btn-ghost">
              Watchlist
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}