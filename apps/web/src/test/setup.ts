import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Create mock functions that we can spy on
const mockAuth = {
  signInWithOtp: vi.fn().mockResolvedValue({ 
    data: { user: null, session: null },
    error: null 
  }),
  verifyOtp: vi.fn().mockResolvedValue({ 
    data: { user: null, session: null },
    error: null 
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } }
  }),
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
};

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  createClient: () => ({
    auth: mockAuth
  })
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});