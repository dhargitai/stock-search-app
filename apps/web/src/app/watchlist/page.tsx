import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { WatchlistContent } from '../../components/ui/watchlist-content'
import type { Metadata } from 'next'
import { Navbar } from '@/components/ui/navbar';

export const metadata: Metadata = {
  title: 'My Watchlist | Peak Finance',
  description: 'View and manage your saved stocks in one place.',
}

export default async function WatchlistPage() {
  const supabase = await createClient()

  // Server-side authentication check
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-base-content mb-2">My Watchlist</h1>
            <p className="text-base-content/70">Monitor your saved stocks in one place</p>
          </div>
          <WatchlistContent />
        </div>
      </main>
    </div>

  )
}