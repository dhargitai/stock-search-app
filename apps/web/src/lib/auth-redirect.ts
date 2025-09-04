/**
 * Utility functions for handling authentication redirects
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

const REDIRECT_KEY = 'auth_redirect_to'

export function saveRedirectUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REDIRECT_KEY, url)
  }
}

export function getRedirectUrl(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REDIRECT_KEY)
  }
  return null
}

export function clearRedirectUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(REDIRECT_KEY)
  }
}

export function redirectAfterAuth(router: AppRouterInstance): void {
  const redirectUrl = getRedirectUrl()
  clearRedirectUrl()
  
  if (redirectUrl && redirectUrl !== '/') {
    router.push(redirectUrl)
  } else {
    // Default redirect or page refresh
    router.refresh()
  }
}