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

interface StockQuoteCardProps {
  data?: StockQuoteData;
  isLoading?: boolean;
  error?: string;
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(1)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toString();
}

function LoadingSkeleton(): JSX.Element {
  return (
    <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
      <div className="stat">
        <div className="stat-title">
          <div className="skeleton h-4 w-16"></div>
        </div>
        <div className="stat-value">
          <div className="skeleton h-8 w-24"></div>
        </div>
        <div className="stat-desc">
          <div className="skeleton h-4 w-20"></div>
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">
          <div className="skeleton h-4 w-16"></div>
        </div>
        <div className="stat-value">
          <div className="skeleton h-8 w-24"></div>
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">
          <div className="skeleton h-4 w-16"></div>
        </div>
        <div className="stat-value">
          <div className="skeleton h-8 w-24"></div>
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">
          <div className="skeleton h-4 w-16"></div>
        </div>
        <div className="stat-value">
          <div className="skeleton h-8 w-24"></div>
        </div>
      </div>
    </div>
  );
}

function ErrorDisplay({ error }: { error: string }): JSX.Element {
  return (
    <div className="card bg-error/10 border border-error/20 w-full">
      <div className="card-body text-center py-8">
        <div className="text-error text-lg font-semibold mb-2">Error Loading Quote Data</div>
        <p className="text-error/70 text-sm">{error}</p>
        <div className="card-actions justify-center mt-4">
          <button className="btn btn-error btn-sm">Retry</button>
        </div>
      </div>
    </div>
  );
}

export function StockQuoteCard({ data, isLoading, error }: StockQuoteCardProps): JSX.Element {
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (isLoading || !data) {
    return <LoadingSkeleton />;
  }

  const isPositiveChange = data.change >= 0;
  const changeColorClass = isPositiveChange ? 'text-success' : 'text-error';
  const changePrefix = isPositiveChange ? '+' : '';

  return (
    <div className="w-full">
      {/* Current Price Section */}
      <div className="card bg-base-200 shadow-lg mb-6">
        <div className="card-body text-center py-8">
          <div className="stat place-items-center">
            <div className="stat-title text-lg">Current Price</div>
            <div className="stat-value text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold break-all">
              {formatCurrency(data.price)}
            </div>
            <div className={`stat-desc text-base sm:text-lg lg:text-xl font-semibold ${changeColorClass} break-words`}>
              {changePrefix}{formatCurrency(data.change)} ({changePrefix}{data.percentChange.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Quote Details Grid */}
      <div className="stats stats-vertical sm:stats-horizontal shadow w-full bg-base-100 overflow-hidden">
        <div className="stat min-w-0">
          <div className="stat-title">Open</div>
          <div className="stat-value text-lg sm:text-xl lg:text-2xl break-all">{formatCurrency(data.open)}</div>
        </div>

        <div className="stat min-w-0">
          <div className="stat-title">High</div>
          <div className="stat-value text-lg sm:text-xl lg:text-2xl break-all">{formatCurrency(data.high)}</div>
        </div>

        <div className="stat min-w-0">
          <div className="stat-title">Low</div>
          <div className="stat-value text-lg sm:text-xl lg:text-2xl break-all">{formatCurrency(data.low)}</div>
        </div>

        <div className="stat min-w-0">
          <div className="stat-title">Previous Close</div>
          <div className="stat-value text-lg sm:text-xl lg:text-2xl break-all">{formatCurrency(data.prevClose)}</div>
        </div>
      </div>

      {/* Volume Section */}
      <div className="stats shadow w-full bg-base-100 mt-4 overflow-hidden">
        <div className="stat place-items-center">
          <div className="stat-title">Volume</div>
          <div className="stat-value text-xl sm:text-2xl lg:text-3xl">{formatVolume(data.volume)}</div>
          <div className="stat-desc text-xs sm:text-sm break-words">{data.volume.toLocaleString('en-US')} shares</div>
        </div>
      </div>
    </div>
  );
}