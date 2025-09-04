'use client'

import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/trpc'
import { WatchlistItem } from './watchlist-item'
import Link from 'next/link'

export function WatchlistContent() {
  const { isAuthenticated, loading: authLoading } = useAuth()

  const {
    data: watchlistItems,
    isLoading,
    error,
    refetch
  } = api.watchlist.get.useQuery(undefined, {
    enabled: isAuthenticated && !authLoading,
    staleTime: 0, // Always fetch fresh data
  })

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Failed to load watchlist. Please try again.</span>
        <div>
          <button className="btn btn-sm" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!watchlistItems || watchlistItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="text-base-content/50 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-base-content mb-2">Your watchlist is empty</h3>
          <p className="text-base-content/70 mb-6">Search for stocks to add them to your list.</p>
          <Link href="/" className="btn btn-primary">
            Find Stocks
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {watchlistItems.map((item) => (
        <WatchlistItem 
          key={item.id}
          symbol={item.symbol}
          onRemove={() => refetch()}
        />
      ))}
    </div>
  )
}