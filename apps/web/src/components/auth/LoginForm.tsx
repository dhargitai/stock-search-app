'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { redirectAfterAuth } from '../../lib/auth-redirect'

interface LoginFormProps {
  onClose?: () => void
  redirectTo?: string
  isOpen?: boolean
}

export function LoginForm({ onClose, redirectTo, isOpen = false }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) throw error

      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })

      if (error) throw error

      // Close modal on success
      onClose?.()
      
      // Handle redirect after authentication
      if (redirectTo) {
        router.push(redirectTo as any)
      } else {
        redirectAfterAuth(router)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep('email')
    setOtp('')
    setError('')
  }

  return (
    <dialog id="login_modal" className="modal" open={isOpen}>
      <div className="modal-box">
        <form method="dialog">
          <button 
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </button>
        </form>
        
        <h3 className="font-bold text-lg mb-4">
          {step === 'email' ? 'Sign In' : 'Enter Verification Code'}
        </h3>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="form-control">
              <label className="label mr-2" htmlFor="email">Email</label>
              <label className="input">
                <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    fill="none"
                    stroke="currentColor"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </g>
                </svg>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="grow"
                />
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={loading || !email}
            >
              {loading && <span className="loading loading-spinner"></span>}
              {loading ? 'Sending...' : 'Send Login Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-sm text-base-content/70 mb-4">
              We sent a 6-digit verification code to <strong>{email}</strong>
            </div>

            <div className="form-control">
              <label className="label mr-3" htmlFor="otp">Verification Code</label>
              <input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="input w-full text-center text-lg font-mono"
                maxLength={6}
                pattern="[0-9]{6}"
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handleBack}
                className="btn btn-ghost flex-1"
                disabled={loading}
              >
                Back
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex-1"
                disabled={loading || otp.length !== 6}
              >
                {loading && <span className="loading loading-spinner"></span>}
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </form>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}