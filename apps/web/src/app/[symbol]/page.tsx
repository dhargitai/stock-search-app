import { Navbar } from '@/components/ui/navbar';
import { StockQuoteCard } from '@/components/ui/stock-quote-card';
import { PriceChartWrapper } from '@/components/ui/price-chart-wrapper';
import { WatchlistButton } from '@/components/ui/watchlist-button';
import { serverApi } from '@/lib/trpc-server';
import { TRPCError } from '@trpc/server';
import type { StockDetailsData } from '@/lib/types/stock';

type ChartPeriod = '1D' | '5D' | '1M' | '1Y';

// Route segment config for caching
export const revalidate = 60; // ISR - revalidate every 60 seconds
export const fetchCache = 'default-cache'; // Allow fetch caching

interface StockDetailPageProps {
  params: Promise<{
    symbol: string;
  }>;
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function StockDetailPage({ params, searchParams }: StockDetailPageProps): Promise<JSX.Element> {
  const { symbol } = await params;
  const { period = '1M' } = await searchParams;
  const decodedSymbol = decodeURIComponent(symbol);

  // Fetch real stock data using SSR with tRPC
  let stockData: StockDetailsData | null = null;
  let error: string | undefined = undefined;
  const isLoading = false; // SSR means data is always loaded by the time we render

  try {
    stockData = await serverApi.stock.getDetails({ 
      symbol: decodedSymbol, 
      period: period as ChartPeriod 
    });
  } catch (err) {
    if (err instanceof TRPCError) {
      error = err.message;
    } else {
      error = 'Failed to fetch stock data. Please try again later.';
    }
  }

  return (
    <div className="min-h-screen bg-base-100 overflow-x-hidden">
      <Navbar />

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto overflow-x-hidden">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content mb-2 break-words">
                  {stockData?.symbol || decodedSymbol.toUpperCase()}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-base-content/70 break-words">
                  {stockData?.companyName || `${decodedSymbol.toUpperCase()} Company`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <WatchlistButton symbol={stockData?.symbol || decodedSymbol.toUpperCase()} />
                <div className="badge badge-outline badge-sm sm:badge-md lg:badge-lg">
                  <span className="text-xs sm:text-sm">
                    Last Updated: {stockData?.lastUpdated
                      ? new Date(stockData.lastUpdated).toLocaleTimeString()
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-4 sm:gap-6 lg:gap-8 overflow-x-hidden">
            {/* Stock Quote Data Section */}
            <div className="w-full min-w-0 overflow-x-hidden">
              <StockQuoteCard
                data={stockData?.quote}
                isLoading={isLoading}
                error={error}
              />
            </div>

            {/* Price Chart Container */}
            <div className="w-full min-w-0 overflow-x-hidden">
              <PriceChartWrapper
                symbol={stockData?.symbol || decodedSymbol.toUpperCase()}
                historicalData={stockData?.historicalData}
                initialPeriod={period as ChartPeriod}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}