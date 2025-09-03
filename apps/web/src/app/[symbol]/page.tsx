import { Navbar } from '@/components/ui/navbar';
import { StockQuoteCard } from '@/components/ui/stock-quote-card';
import { PriceChartContainer } from '@/components/ui/price-chart-container';

// TODO: Future integration with tRPC for fetching real stock data
// import { api } from '@/lib/api';

interface StockDetailPageProps {
  params: Promise<{
    symbol: string;
  }>;
}

interface StockInfo {
  symbol: string;
  companyName: string;
  lastUpdated: string;
}

interface StockQuoteData {
  price: number;
  change: number;
  percentChange: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  prevClose: number;
}

export default async function StockDetailPage({ params }: StockDetailPageProps): Promise<JSX.Element> {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol);

  // TODO: Replace with real data from tRPC in future stories
  const mockStockInfo: StockInfo = {
    symbol: decodedSymbol.toUpperCase(),
    companyName: `${decodedSymbol.toUpperCase()} Company`,
    lastUpdated: new Date().toISOString(),
  };

  const mockStockQuoteData: StockQuoteData = {
    price: 150.25,
    change: 2.34,
    percentChange: 1.58,
    open: 148.50,
    high: 152.75,
    low: 147.80,
    volume: 1234567,
    prevClose: 147.91,
  };

  // Simulate loading state - in real implementation this would come from tRPC loading state
  const isLoading = false;
  const error = undefined; // Could be set to simulate error: "Failed to fetch stock data"

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
                  {mockStockInfo.symbol}
                </h1>
                <p className="text-xl text-base-content/70">
                  {mockStockInfo.companyName}
                </p>
              </div>
              <div className="badge badge-outline badge-lg">
                Last Updated: {new Date(mockStockInfo.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:gap-8">
            {/* Stock Quote Data Section */}
            <div>
              <StockQuoteCard 
                data={mockStockQuoteData}
                isLoading={isLoading}
                error={error}
              />
            </div>

            {/* Price Chart Container */}
            <div>
              <PriceChartContainer 
                symbol={mockStockInfo.symbol}
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