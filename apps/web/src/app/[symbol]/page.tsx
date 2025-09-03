import { Navbar } from '@/components/ui/navbar';

// TODO: Future integration with tRPC for fetching real stock data
// import { api } from '@/lib/api';

interface StockDetailPageProps {
  params: Promise<{
    symbol: string;
  }>;
}

export default async function StockDetailPage({ params }: StockDetailPageProps): Promise<JSX.Element> {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol);

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-base-content mb-2">
              Stock Details: {decodedSymbol.toUpperCase()}
            </h1>
            <p className="text-base-content/70">
              Detailed information for {decodedSymbol.toUpperCase()}
            </p>
          </div>

          <div className="grid gap-6">
            {/* Stock Info Card */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Stock Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="stat">
                    <div className="stat-title">Symbol</div>
                    <div className="stat-value text-primary">{decodedSymbol.toUpperCase()}</div>
                  </div>
                  
                  <div className="stat">
                    <div className="stat-title">Status</div>
                    <div className="stat-value text-sm">
                      <div className="badge badge-info">Coming Soon</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder for future data */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Real-time Data</h2>
                <div className="text-center py-12">
                  <div className="loading loading-spinner loading-lg mb-4"></div>
                  <p className="text-base-content/70">
                    Real-time stock data integration will be implemented in future stories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}