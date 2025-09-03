'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ChartDataPoint } from '@/lib/types/stock';

type ChartPeriod = '1D' | '5D' | '1M' | '1Y';

// Utility to get theme colors with proper fallbacks
function getThemeColors() {
  if (typeof window === 'undefined') {
    // Fallback colors for SSR matching Peak Finance theme
    return {
      primary: '#3b82f6',
      primaryAlpha30: '#3b82f64d', // 30% opacity
      primaryAlpha5: '#3b82f60d',  // 5% opacity
      text: '#1f2937',
      textMuted: '#1f293799', // 60% opacity
      gridLight: '#e2e8f01a', // 10% opacity
      borderLight: '#e2e8f033', // 20% opacity
      background: '#ffffff'
    };
  }

  // Get computed CSS variables with fallbacks
  const computedStyle = getComputedStyle(document.documentElement);
  const primary = computedStyle.getPropertyValue('--color-primary').trim() || '#3b82f6';
  const text = computedStyle.getPropertyValue('--color-base-content').trim() || '#1f2937';
  const background = computedStyle.getPropertyValue('--color-base-100').trim() || '#ffffff';
  const borderColor = computedStyle.getPropertyValue('--color-base-300').trim() || '#e2e8f0';
  
  return {
    primary,
    primaryAlpha30: primary + '4d', // 30% opacity
    primaryAlpha5: primary + '0d',  // 5% opacity
    text,
    textMuted: text + '99', // 60% opacity
    gridLight: borderColor + '1a', // 10% opacity
    borderLight: borderColor + '33', // 20% opacity
    background
  };
}

interface PriceChartContainerProps {
  symbol: string;
  historicalData?: ChartDataPoint[];
  isLoading?: boolean;
  error?: string;
  className?: string;
  period?: ChartPeriod;
  onPeriodChange?: (period: ChartPeriod) => void;
}

function ChartLoadingSkeleton(): JSX.Element {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="skeleton h-6 w-32"></div>
        <div className="skeleton h-8 w-24"></div>
      </div>
      <div className="skeleton h-64 w-full rounded-lg"></div>
      <div className="flex justify-center gap-2">
        <div className="skeleton h-8 w-16"></div>
        <div className="skeleton h-8 w-16"></div>
        <div className="skeleton h-8 w-16"></div>
        <div className="skeleton h-8 w-16"></div>
      </div>
    </div>
  );
}

function ChartErrorDisplay({ error }: { error: string }): JSX.Element {
  return (
    <div className="card bg-error/10 border border-error/20 w-full">
      <div className="card-body text-center py-12">
        <div className="text-error text-lg font-semibold mb-2">Chart Unavailable</div>
        <p className="text-error/70 text-sm mb-4">{error}</p>
        <div className="card-actions justify-center">
          <button className="btn btn-error btn-sm">Retry</button>
        </div>
      </div>
    </div>
  );
}

function PriceChart({ 
  symbol, 
  data, 
  period = '1M', 
  onPeriodChange 
}: { 
  symbol: string; 
  data: ChartDataPoint[];
  period?: ChartPeriod;
  onPeriodChange?: (period: ChartPeriod) => void;
}): JSX.Element {
  const chartRef = useRef<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get theme colors with proper CSS variable resolution
  const colors = useMemo(() => getThemeColors(), []);

  // Transform data for ECharts with validation
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    try {
      // Filter data based on selected period
      // Data is already filtered by the API based on period
      const validData = data.filter(item => 
        item && 
        typeof item.date === 'string' && 
        typeof item.close === 'number' && 
        !isNaN(item.close)
      );

      if (validData.length === 0) return null;

      const dates = validData.map(item => item.date);
      const prices = validData.map(item => item.close);

      // Validate that we have valid price data
      const validPrices = prices.filter(price => typeof price === 'number' && !isNaN(price));
      if (validPrices.length === 0) return null;

      return {
        dates,
        prices,
        minPrice: Math.min(...validPrices),
        maxPrice: Math.max(...validPrices)
      };
    } catch (error) {
      console.error('Error transforming chart data:', error);
      return null;
    }
  }, [data]);

  const chartOption = useMemo(() => {
    if (!chartData || !chartData.dates.length || !chartData.prices.length) return null;

    try {
      return {
        grid: {
          top: 20,
          right: 20,
          bottom: 60,
          left: 60,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: chartData.dates,
          axisLine: {
            lineStyle: {
              color: colors.borderLight
            }
          },
          axisLabel: {
            color: colors.textMuted,
            formatter: function(value: string, index: number) {
              try {
                const date = new Date(value);
                
                // For 1D period, show time format
                if (period === '1D') {
                  // Get the current date string for comparison
                  const currentDateString = date.toDateString();
                  
                  // Check if this is the first occurrence of this date
                  let isFirstOccurrence = false;
                  if (chartData && chartData.dates && index !== undefined) {
                    const previousIndex = index - 1;
                    if (previousIndex < 0) {
                      isFirstOccurrence = true;
                    } else {
                      const previousDate = new Date(chartData.dates[previousIndex]);
                      isFirstOccurrence = previousDate.toDateString() !== currentDateString;
                    }
                  }
                  
                  // For first occurrence of the date, show "Sep 2, 13:15"
                  if (isFirstOccurrence) {
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    }) + ', ' + date.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    });
                  } else {
                    // For subsequent times, show only "13:15"
                    return date.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    });
                  }
                } else {
                  // For other periods, show date only
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });
                }
              } catch {
                return value;
              }
            }
          }
        },
        yAxis: {
          type: 'value',
          scale: true,
          axisLine: {
            lineStyle: {
              color: colors.borderLight
            }
          },
          axisLabel: {
            color: colors.textMuted,
            formatter: function(value: number) {
              return '$' + (typeof value === 'number' ? value.toFixed(2) : '0.00');
            }
          },
          splitLine: {
            lineStyle: {
              color: colors.gridLight
            }
          }
        },
        series: [{
          data: chartData.prices,
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: colors.primary,
            width: 3
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: colors.primaryAlpha30
              }, {
                offset: 1,
                color: colors.primaryAlpha5
              }]
            }
          },
          animationDelay: 0
        }],
        tooltip: {
          trigger: 'axis',
          backgroundColor: colors.background,
          borderColor: colors.borderLight,
          borderWidth: 1,
          textStyle: {
            color: colors.text
          },
          extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);',
          formatter: function(params: any) {
            if (!params || !Array.isArray(params) || params.length === 0) return '';
            
            try {
              const dataPoint = params[0];
              if (!dataPoint || dataPoint.name === undefined || dataPoint.value === undefined) return '';
              
              const date = new Date(dataPoint.name);
              let dateDisplay: string;
              
              // For 1D period, show full datetime
              if (period === '1D') {
                dateDisplay = date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                }) + ' at ' + date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
              } else {
                // For other periods, show date only
                dateDisplay = date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
              }
              
              const price = typeof dataPoint.value === 'number' ? dataPoint.value.toFixed(2) : '0.00';
              return `${dateDisplay}<br/>Price: $${price}`;
            } catch (error) {
              console.error('Tooltip formatter error:', error);
              return 'Data unavailable';
            }
          }
        },
        animation: !isAnimating,
        animationDuration: isAnimating ? 0 : 800,
        animationEasing: 'cubicOut'
      };
    } catch (error) {
      console.error('Error creating chart options:', error);
      return null;
    }
  }, [chartData, colors, isAnimating, period]);

  // Handle period changes with animation control
  const handlePeriodChange = (newPeriod: ChartPeriod) => {
    if (newPeriod === period) return;
    
    setIsAnimating(true);
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
    
    // Reset animation flag after update
    setTimeout(() => {
      setIsAnimating(false);
    }, 100);
  };

  if (!chartData || !chartOption) {
    return (
      <div className="w-full">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold">Price Chart</h3>
            <p className="text-base-content/70 text-sm">Historical price data for {symbol}</p>
          </div>
        </div>

        {/* No Data Message */}
        <div className="card bg-base-100 border border-base-300 min-h-[400px]">
          <div className="card-body flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl">📊</div>
              <div>
                <h4 className="text-lg font-semibold mb-2">No Chart Data Available</h4>
                <p className="text-base-content/70 text-sm">Unable to load historical price data for {symbol}</p>
              </div>
              <div className="badge badge-warning">No Data</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold">Price Chart</h3>
          <p className="text-base-content/70 text-sm">Historical price data for {symbol}</p>
        </div>
        <div className="flex gap-2">
          <div className="btn-group">
            <button 
              className={`btn btn-sm ${period === '1D' ? 'btn-active' : ''}`}
              onClick={() => handlePeriodChange('1D')}
            >
              1D
            </button>
            <button 
              className={`btn btn-sm ${period === '5D' ? 'btn-active' : ''}`}
              onClick={() => handlePeriodChange('5D')}
            >
              5D
            </button>
            <button 
              className={`btn btn-sm ${period === '1M' ? 'btn-active' : ''}`}
              onClick={() => handlePeriodChange('1M')}
            >
              1M
            </button>
            <button 
              className={`btn btn-sm ${period === '1Y' ? 'btn-active' : ''}`}
              onClick={() => handlePeriodChange('1Y')}
            >
              1Y
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-6">
          <ReactECharts 
            ref={chartRef}
            option={chartOption}
            style={{ height: '400px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            className="w-full"
          />

          {/* Chart Info */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-base-300">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="badge badge-success badge-sm">Live Data</div>
              <div className="badge badge-outline badge-sm">Close Price</div>
              <span className="text-xs text-base-content/50">
                {chartData.prices.length} data points
              </span>
            </div>
            <div className="text-sm text-base-content/50">
              Range: ${chartData.minPrice.toFixed(2)} - ${chartData.maxPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PriceChartContainer({ 
  symbol, 
  historicalData,
  isLoading, 
  error, 
  className = "",
  period = '1M',
  onPeriodChange
}: PriceChartContainerProps): JSX.Element {
  if (error) {
    return (
      <div className={className}>
        <ChartErrorDisplay error={error} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        <ChartLoadingSkeleton />
      </div>
    );
  }

  const hasData = historicalData && historicalData.length > 0;

  if (!hasData) {
    return (
      <div className={className}>
        <div className="w-full">
          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold">Price Chart</h3>
              <p className="text-base-content/70 text-sm">Historical price data for {symbol}</p>
            </div>
          </div>

          {/* No Data Message */}
          <div className="card bg-base-100 border border-base-300 min-h-[400px]">
            <div className="card-body flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-4xl">📊</div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">No Chart Data Available</h4>
                  <p className="text-base-content/70 text-sm">Historical price data for {symbol} is not available at this time</p>
                </div>
                <div className="badge badge-info">Awaiting Data</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <PriceChart 
        symbol={symbol} 
        data={historicalData} 
        period={period}
        onPeriodChange={onPeriodChange}
      />
    </div>
  );
}