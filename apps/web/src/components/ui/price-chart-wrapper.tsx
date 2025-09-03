'use client';

import { useRouter, usePathname } from 'next/navigation';
import { PriceChartContainer } from './price-chart-container';
import type { ChartDataPoint } from '@/lib/types/stock';

type ChartPeriod = '1D' | '5D' | '1M' | '1Y';

interface PriceChartWrapperProps {
  symbol: string;
  historicalData: ChartDataPoint[] | undefined;
  initialPeriod: ChartPeriod;
  isLoading?: boolean;
  error?: string;
}

/**
 * Client-side wrapper for PriceChartContainer that handles URL navigation
 * This component is responsible for updating the URL when period changes
 */
export function PriceChartWrapper({
  symbol,
  historicalData,
  initialPeriod,
  isLoading,
  error
}: PriceChartWrapperProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();

  const handlePeriodChange = (newPeriod: ChartPeriod): void => {
    if (newPeriod === initialPeriod) return;
    
    const url = `${pathname}?period=${encodeURIComponent(newPeriod)}`;
    router.push(url as any);
  };

  return (
    <PriceChartContainer
      symbol={symbol}
      historicalData={historicalData}
      isLoading={isLoading}
      error={error}
      period={initialPeriod}
      onPeriodChange={handlePeriodChange}
    />
  );
}