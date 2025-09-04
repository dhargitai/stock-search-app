'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/trpc'

interface WatchlistItemProps {
  symbol: string
  onRemove?: () => void
}

export function WatchlistItem({ symbol, onRemove }: WatchlistItemProps) {
  const router = useRouter()
  const [isRemoving, setIsRemoving] = useState(false)

  const removeMutation = api.watchlist.remove.useMutation({
    onMutate: () => {
      setIsRemoving(true)
    },
    onSuccess: () => {
      // Optimistic update - call parent's refetch
      onRemove?.()
    },
    onError: (error) => {
      console.error('Failed to remove from watchlist:', error)
      setIsRemoving(false)
      // Could add toast notification here in the future
    }
  })

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation when clicking remove
    removeMutation.mutate({ symbol })
  }

  const handleClick = () => {
    router.push(`/${symbol}`)
  }

  return (
    <div className="list bg-base-100 rounded-box shadow-sm">
      <div className="list-row cursor-pointer hover:bg-base-200 transition-colors" onClick={handleClick}>
        {/* Stock Symbol Icon/Avatar */}
        <div className="flex-shrink-0">
          <div className="size-12 bg-primary text-primary-content rounded-lg flex items-center justify-center font-bold text-sm">
            {symbol.slice(0, 2)}
          </div>
        </div>

        {/* Stock Information - Growing Column */}
        <div className="list-col-grow">
          <div className="font-semibold text-base-content">{symbol}</div>
          <div className="text-sm text-base-content/70">
            Stock Quote • Click to view details
          </div>
        </div>

        {/* Remove Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="btn btn-square btn-ghost btn-sm text-error hover:bg-error hover:text-error-content"
            aria-label={`Remove ${symbol} from watchlist`}
          >
            {isRemoving ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <svg className="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}