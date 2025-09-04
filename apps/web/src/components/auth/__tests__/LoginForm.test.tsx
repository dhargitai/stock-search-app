import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '../LoginForm'

// Mock the redirect utility
vi.mock('../../../lib/auth-redirect', () => ({
  redirectAfterAuth: vi.fn()
}))

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock window.location
const mockReload = vi.fn()
const mockLocationAssign = vi.fn()

Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
    href: '',
    assign: mockLocationAssign,
  },
  writable: true,
})

// Get the mocked Supabase methods (these are already mocked in setup.ts)
import { createClient } from '../../../lib/supabase'
import { redirectAfterAuth } from '../../../lib/auth-redirect'

const mockSupabase = createClient()
const mockSignInWithOtp = vi.mocked(mockSupabase.auth.signInWithOtp)
const mockVerifyOtp = vi.mocked(mockSupabase.auth.verifyOtp)
const mockRedirectAfterAuth = vi.mocked(redirectAfterAuth)

describe('LoginForm', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset router mocks
    mockRouter.push.mockClear()
    mockRouter.refresh.mockClear()
    // Reset all mocks to default successful responses
    mockSignInWithOtp.mockResolvedValue({ 
      data: { user: null, session: null },
      error: null 
    })
    mockVerifyOtp.mockResolvedValue({ 
      data: { 
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
        } 
      },
      error: null 
    })
  })

  it('renders initial email step', () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByText('Send Login Code')).toBeInTheDocument()
  })

  it('shows validation for empty email', async () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    const sendButton = screen.getByText('Send Login Code')
    
    expect(sendButton).toBeDisabled()
  })

  it('enables send button when email is entered', async () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    const emailInput = screen.getByLabelText('Email')
    const sendButton = screen.getByText('Send Login Code')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    expect(sendButton).not.toBeDisabled()
  })

  it('sends OTP successfully and moves to verification step', async () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    const emailInput = screen.getByLabelText('Email')
    const sendButton = screen.getByText('Send Login Code')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          shouldCreateUser: true,
        },
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument()
      expect(screen.getByText(/We sent a 6-digit verification code to/)).toBeInTheDocument()
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument()
    })
  })

  it('handles OTP send error', async () => {
    mockSignInWithOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: Object.assign(new Error('Invalid email'), { code: '', status: 0, __isAuthError: false }) as any
    })

    render(<LoginForm onClose={mockOnClose} />)
    
    const emailInput = screen.getByLabelText('Email')
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    
    // Submit form directly to avoid jsdom requestSubmit limitation
    const form = emailInput.closest('form')!
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid email|Error/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('validates OTP input to only accept 6 digits', async () => {
    // First get to OTP step
    render(<LoginForm onClose={mockOnClose} />)
    
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByText('Send Login Code'))

    await waitFor(() => {
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument()
    })

    const otpInput = screen.getByLabelText('Verification Code')
    const verifyButton = screen.getByText('Verify Code')
    
    // Test that non-digits are filtered
    fireEvent.change(otpInput, { target: { value: 'abc123def' } })
    expect(otpInput).toHaveValue('123')
    
    // Test that only 6 digits are allowed
    fireEvent.change(otpInput, { target: { value: '1234567890' } })
    expect(otpInput).toHaveValue('123456')
    
    // Verify button should be enabled with 6 digits
    expect(verifyButton).not.toBeDisabled()
  })

  it('verifies OTP successfully and calls redirect', async () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    // Get to OTP step
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByText('Send Login Code'))

    await waitFor(() => {
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument()
    })

    const otpInput = screen.getByLabelText('Verification Code')
    const verifyButton = screen.getByText('Verify Code')
    
    fireEvent.change(otpInput, { target: { value: '123456' } })
    fireEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456',
        type: 'email',
      })
    })

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
      expect(mockRedirectAfterAuth).toHaveBeenCalled()
    })
  })

  it('handles OTP verification error', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: Object.assign(new Error('Invalid code'), { code: '', status: 0, __isAuthError: false }) as any
    })

    render(<LoginForm onClose={mockOnClose} />)
    
    // Get to OTP step
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByText('Send Login Code'))

    await waitFor(() => {
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument()
    })

    const otpInput = screen.getByLabelText('Verification Code')
    const verifyButton = screen.getByText('Verify Code')
    
    fireEvent.change(otpInput, { target: { value: '123456' } })
    fireEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid code')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('allows going back to email step', async () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    // Get to OTP step
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByText('Send Login Code'))

    await waitFor(() => {
      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument()
    })

    const backButton = screen.getByText('Back')
    fireEvent.click(backButton)

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })
  })

  it('closes modal when close button is clicked', () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    // Use testid instead of role for this JSDOM compatibility issue
    const closeButton = screen.getByText('✕')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('uses custom redirect when provided', async () => {
    render(<LoginForm onClose={mockOnClose} redirectTo="/custom-page" />)
    
    // Get to OTP step and verify
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByText('Send Login Code'))

    await waitFor(() => {
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument()
    })

    const otpInput = screen.getByLabelText('Verification Code')
    fireEvent.change(otpInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByText('Verify Code'))
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/custom-page')
    })
  })
})