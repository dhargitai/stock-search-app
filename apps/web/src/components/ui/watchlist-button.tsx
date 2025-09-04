'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/trpc'

interface WatchlistButtonProps {
  symbol: string
}

export function WatchlistButton({ symbol }: WatchlistButtonProps) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  const {
    data: isInWatchlist,
    isLoading: checkLoading,
    refetch: refetchWatchlistStatus
  } = api.watchlist.check.useQuery(
    { symbol },
    {
      enabled: isAuthenticated && !authLoading,
      staleTime: 0, // Always refetch to ensure accuracy
    }
  )

  const addMutation = api.watchlist.add.useMutation({
    onSuccess: () => {
      // Optimistically update the query cache
      refetchWatchlistStatus()
    },
    onError: (error) => {
      console.error('Failed to add to watchlist:', error)
      // Could add toast notification here in the future
    }
  })

  const removeMutation = api.watchlist.remove.useMutation({
    onSuccess: () => {
      // Optimistically update the query cache
      refetchWatchlistStatus()
    },
    onError: (error) => {
      console.error('Failed to remove from watchlist:', error)
      // Could add toast notification here in the future
    }
  })

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (isInWatchlist) {
      removeMutation.mutate({ symbol })
    } else {
      addMutation.mutate({ symbol })
    }
  }

  const isLoading = authLoading || checkLoading || addMutation.isPending || removeMutation.isPending

  const getButtonText = () => {
    if (!isAuthenticated) {
      return 'Login to Add to Watchlist'
    }
    
    if (isLoading) {
      return 'Loading...'
    }
    
    return isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'
  }

  const getButtonClasses = () => {
    const baseClasses = 'btn'
    
    if (!isAuthenticated) {
      return `${baseClasses} btn-outline btn-primary`
    }
    
    if (isInWatchlist) {
      return `${baseClasses} btn-outline btn-secondary`
    }
    
    return `${baseClasses} btn-primary`
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={getButtonClasses()}
    >
      {getButtonText()}
    </button>
  )
}