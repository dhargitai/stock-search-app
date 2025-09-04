/**
 * Utility functions for handling authentication redirects
 */

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

export function redirectAfterAuth(): void {
  const redirectUrl = getRedirectUrl()
  clearRedirectUrl()
  
  if (redirectUrl && redirectUrl !== '/') {
    window.location.href = redirectUrl
  } else {
    // Default redirect or page refresh
    window.location.reload()
  }
}