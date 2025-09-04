import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '../LoginForm'

// Mock the redirect utility
vi.mock('../../../lib/auth-redirect', () => ({
  redirectAfterAuth: vi.fn()
}))

// Get the mocked Supabase methods (these are already mocked in setup.ts)
import { createClient } from '../../../lib/supabase'
const mockSupabase = createClient()
const mockSignInWithOtp = vi.mocked(mockSupabase.auth.signInWithOtp)
const mockVerifyOtp = vi.mocked(mockSupabase.auth.verifyOtp)

describe('LoginForm - Core Functionality', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
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

  it('renders the login form with email input', () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByText('Send Login Code')).toBeInTheDocument()
  })

  it('shows email input initially', () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    const emailInput = screen.getByLabelText('Email')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('placeholder', 'Enter your email')
  })

  it('moves to OTP step after sending email', async () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    const sendButton = screen.getByText('Send Login Code')
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument()
    })
  })

  it('calls Supabase signInWithOtp when form is submitted', async () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    const form = emailInput.closest('form')!
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          shouldCreateUser: true,
        },
      })
    })
  })

  it('shows OTP input after successful email submission', async () => {
    render(<LoginForm onClose={mockOnClose} />)
    
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    const sendButton = screen.getByText('Send Login Code')
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument()
      expect(screen.getByText(/We sent a 6-digit verification code to/)).toBeInTheDocument()
    })
  })
})