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

// Mock console.error to suppress jsdom requestSubmit warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress the specific jsdom requestSubmit error
  if (typeof args[0] === 'string' && args[0].includes('requestSubmit')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Comprehensive jsdom requestSubmit polyfill
if (typeof window !== 'undefined' && typeof HTMLFormElement !== 'undefined') {
  // Override the internal implementation
  const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
  HTMLFormElement.prototype.requestSubmit = function(submitter?: HTMLElement) {
    try {
      if (originalRequestSubmit) {
        return originalRequestSubmit.call(this, submitter);
      }
    } catch (error) {
      // Fallback for jsdom compatibility
      if (error instanceof Error && error.message.includes('Not implemented')) {
        const event = new Event('submit', {
          bubbles: true,
          cancelable: true
        });
        this.dispatchEvent(event);
        return;
      }
      throw error;
    }
    
    // Standard polyfill
    const event = new Event('submit', {
      bubbles: true,
      cancelable: true
    });
    this.dispatchEvent(event);
  };
}