'use client'

import { useEffect, useState } from 'react'
import { type User, type Session } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

// Create a single Supabase client instance outside the hook
const supabase = createClient()

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }

        setAuthState({
          user: session?.user ?? null,
          session: session ?? null,
          loading: false,
        })
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        setAuthState({
          user: null,
          session: null,
          loading: false,
        })
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session: session ?? null,
          loading: false,
        })
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
    } catch (error) {
      console.error('Error in signOut:', error)
    }
  }

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    isAuthenticated: !!authState.user,
    signOut,
  }
}