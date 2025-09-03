import { Navbar } from '@/components/ui/navbar';
import { StockQuoteCard } from '@/components/ui/stock-quote-card';
import { PriceChartWrapper } from '@/components/ui/price-chart-wrapper';
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
    <div className="min-h-screen bg-base-100">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-base-content mb-2">
                  {stockData?.symbol || decodedSymbol.toUpperCase()}
                </h1>
                <p className="text-xl text-base-content/70">
                  {stockData?.companyName || `${decodedSymbol.toUpperCase()} Company`}
                </p>
              </div>
              <div className="badge badge-outline badge-lg">
                Last Updated: {stockData?.lastUpdated 
                  ? new Date(stockData.lastUpdated).toLocaleTimeString()
                  : 'N/A'
                }
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:gap-8">
            {/* Stock Quote Data Section */}
            <div>
              <StockQuoteCard 
                data={stockData?.quote}
                isLoading={isLoading}
                error={error}
              />
            </div>

            {/* Price Chart Container */}
            <div>
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