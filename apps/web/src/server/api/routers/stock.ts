import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { env } from '@/lib/env';
import { stockDataCache } from '@/server/utils/cache';
import type {
  AlphaVantageGlobalQuoteResponse,
  AlphaVantageTimeSeriesResponse,
  AlphaVantageIntradayResponse,
  StockQuoteData,
  ChartDataPoint,
  StockDetailsData,
  SearchSuggestion
} from '@/lib/types/stock';

type ChartPeriod = '1D' | '5D' | '1M' | '1Y';
type OutputSize = 'compact' | 'full';

/**
 * Fetch intraday data for 1D periods using Alpha Vantage TIME_SERIES_INTRADAY
 */
async function fetchIntradayData(symbol: string): Promise<ChartDataPoint[]> {
  const cacheKey = `${symbol}-intraday`;
  const cacheTTL = 15; // minutes

  // Check cache first
  const cachedData = stockDataCache.get(cacheKey);
  if (cachedData) {
    return cachedData as ChartDataPoint[];
  }

  const response = await fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(
      symbol
    )}&interval=15min&outputsize=compact&apikey=${env.ALPHA_VANTAGE_API_KEY}`,
    { cache: 'force-cache', next: { revalidate: cacheTTL * 60 } }
  );

  if (!response.ok) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch intraday data from Alpha Vantage',
    });
  }

  const data = (await response.json()) as AlphaVantageIntradayResponse;
  
  if (data['Error Message'] || data['Note'] || data['Information']) {
    return [];
  }

  // Find the time series key (e.g., "Time Series (15min)")
  const timeSeriesKey = Object.keys(data).find(key => key.startsWith('Time Series'));
  if (!timeSeriesKey) {
    return [];
  }

  const timeSeries = data[timeSeriesKey];
  if (!timeSeries) {
    return [];
  }

  // Convert to ChartDataPoint array
  const allData = Object.entries(timeSeries)
    .map(([datetime, values]: [string, any]) => ({
      date: datetime,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) as ChartDataPoint[];

  // Filter for today's data only
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayData = allData.filter(point => {
    const pointDate = new Date(point.date);
    return pointDate >= today;
  });
  
  // If no data for today (weekend/holiday), show last trading day (~26 data points for regular hours)
  const finalData = todayData.length > 0 ? todayData : allData.slice(-26);

  // Cache the filtered data
  stockDataCache.set(cacheKey, finalData, cacheTTL);
  
  return finalData;
}

/**
 * Fetch daily historical data from Alpha Vantage TIME_SERIES_DAILY
 */
async function fetchDailyData(symbol: string, period: ChartPeriod): Promise<ChartDataPoint[]> {
  const outputSize: OutputSize = period === '1Y' ? 'full' : 'compact';
  const cacheKey = `${symbol}-${outputSize}`;
  const cacheTTL = outputSize === 'full' ? 12 * 60 : 60; // minutes

  // Check cache first
  const cachedData = stockDataCache.get(cacheKey);
  if (cachedData) {
    return cachedData as ChartDataPoint[];
  }

  const response = await fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(
      symbol
    )}&outputsize=${outputSize}&apikey=${env.ALPHA_VANTAGE_API_KEY}`,
    { cache: 'force-cache', next: { revalidate: cacheTTL * 60 } }
  );

  if (!response.ok) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch daily data from Alpha Vantage',
    });
  }

  const data = (await response.json()) as AlphaVantageTimeSeriesResponse;
  
  if (data['Error Message'] || data['Note']) {
    return [];
  }

  const timeSeries = data['Time Series (Daily)'];
  if (!timeSeries) {
    return [];
  }

  // Convert to ChartDataPoint array
  const allData = Object.entries(timeSeries)
    .map(([date, values]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) as ChartDataPoint[];

  // Cache the data
  stockDataCache.set(cacheKey, allData, cacheTTL);
  
  return allData;
}

/**
 * Centralized error handler for Alpha Vantage API responses
 */
function handleAlphaVantageError(data: any): void {
  if (data['Error Message']) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: data['Error Message'],
    });
  }

  if (data['Information'] && data['Information'].includes('API rate limit is')) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'API rate limit exceeded. Please try again later.',
    });
  }

  if (data['Information'] && data['Information'].includes('premium')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This endpoint requires a premium subscription.',
    });
  }
}

/**
 * Fetch stock quote data from Alpha Vantage GLOBAL_QUOTE endpoint with caching
 */
async function fetchGlobalQuote(symbol: string): Promise<StockQuoteData> {
  const cacheKey = `${symbol}-quote`;
  const cacheTTL = 5 * 60;

  // Check cache first
  const cachedData = stockDataCache.get(cacheKey);
  if (cachedData) {
    return cachedData as StockQuoteData;
  }

  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
      symbol
    )}&apikey=${env.ALPHA_VANTAGE_API_KEY}`,
    { cache: 'force-cache', next: { revalidate: cacheTTL } }
  );

  if (!response.ok) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch stock quote from Alpha Vantage',
    });
  }

  const data = (await response.json()) as AlphaVantageGlobalQuoteResponse;
  
  // Handle API errors
  handleAlphaVantageError(data);

  const globalQuote = data['Global Quote'];
  if (!globalQuote || Object.keys(globalQuote).length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `No quote data found for symbol: ${symbol}. This may be due to an invalid symbol or API rate limits.`,
    });
  }

  // Helper functions to safely parse values with fallbacks
  const safeParseFloat = (value: string | undefined): number => {
    if (!value || value === 'N/A') return 0;
    return parseFloat(value) || 0;
  };

  const safeParseInt = (value: string | undefined): number => {
    if (!value || value === 'N/A') return 0;
    return parseInt(value) || 0;
  };

  const safeParsePercentage = (value: string | undefined): number => {
    if (!value || value === 'N/A') return 0;
    return parseFloat(value.replace('%', '')) || 0;
  };

  const quoteData: StockQuoteData = {
    price: safeParseFloat(globalQuote['05. price']),
    change: safeParseFloat(globalQuote['09. change']),
    percentChange: safeParsePercentage(globalQuote['10. change percent']),
    open: safeParseFloat(globalQuote['02. open']),
    high: safeParseFloat(globalQuote['03. high']),
    low: safeParseFloat(globalQuote['04. low']),
    volume: safeParseInt(globalQuote['06. volume']),
    prevClose: safeParseFloat(globalQuote['08. previous close']),
    lastUpdated: globalQuote['07. latest trading day'] || '',
  };

  // Cache the result
  stockDataCache.set(cacheKey, quoteData, cacheTTL);
  
  return quoteData;
}

/**
 * Search for stocks using Alpha Vantage SYMBOL_SEARCH endpoint with caching
 */
async function searchStocks(query: string): Promise<SearchSuggestion[]> {
  const cacheKey = `search-${query.toLowerCase()}`;
  const cacheTTL = 30; // minutes

  // Check cache first
  const cachedData = stockDataCache.get(cacheKey);
  if (cachedData) {
    return cachedData as SearchSuggestion[];
  }

  const response = await fetch(
    `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
      query
    )}&apikey=${env.ALPHA_VANTAGE_API_KEY}`,
    { cache: 'force-cache', next: { revalidate: cacheTTL * 60 } }
  );

  if (!response.ok) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch stock data from Alpha Vantage',
    });
  }

  const data = (await response.json()) as AlphaVantageSearchResponse;
  
  // Handle API errors
  handleAlphaVantageError(data);

  // Transform the response to match our expected format
  const suggestions: SearchSuggestion[] = (data.bestMatches || []).map((match) => ({
    symbol: match['1. symbol'],
    name: match['2. name'],
  }));

  // Cache the result
  stockDataCache.set(cacheKey, suggestions, cacheTTL);
  
  return suggestions;
}

interface AlphaVantageSearchMatch {
  '1. symbol': string;
  '2. name': string;
  '3. type': string;
  '4. region': string;
  '5. marketOpen': string;
  '6. marketClose': string;
  '7. timezone': string;
  '8. currency': string;
  '9. matchScore': string;
}

interface AlphaVantageSearchResponse {
  bestMatches: AlphaVantageSearchMatch[];
  'Error Message'?: string;
  'Note'?: string;
  'Information'?: string;
}

export const stockRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string().min(1).max(50) }))
    .query(async ({ input }) => {
      try {
        return await searchStocks(input.query);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle network errors or JSON parsing errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search for stocks. Please try again later.',
        });
      }
    }),

  getGlobalQuote: publicProcedure
    .input(z.object({ symbol: z.string().min(1).max(10) }))
    .query(async ({ input }) => {
      try {
        return await fetchGlobalQuote(input.symbol);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle network errors or JSON parsing errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch stock quote. Please try again later.',
        });
      }
    }),

  getTimeSeriesDaily: publicProcedure
    .input(z.object({ symbol: z.string().min(1).max(10) }))
    .query(async ({ input }) => {
      try {
        // Use existing fetchDailyData utility with compact output
        const allData = await fetchDailyData(input.symbol, '1M');
        
        // Return last 30 days as before
        return allData.slice(-30);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle network errors or JSON parsing errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch time series data. Please try again later.',
        });
      }
    }),

  getDetails: publicProcedure
    .input(z.object({ 
      symbol: z.string().min(1).max(10),
      period: z.enum(['1D', '5D', '1M', '1Y']).optional().default('1M')
    }))
    .query(async ({ input, ctx }) => {
      const { symbol, period } = input;

      try {
        // Use utility functions to get both quote and historical data
        const [quote, historicalData] = await Promise.all([
          fetchGlobalQuote(symbol),
          
          // Fetch historical data using appropriate API for period
          (async (): Promise<ChartDataPoint[]> => {
            // Use intraday API for 1D, daily API for others
            if (period === '1D') {
              return await fetchIntradayData(symbol);
            } else {
              return await fetchDailyData(symbol, period);
            }
          })()
        ]);

        // Filter historical data based on requested period using simple slicing
        let filteredHistoricalData: ChartDataPoint[] = [];
        if (historicalData && historicalData.length > 0) {
          switch (period) {
            case '1D':
              // For 1D, show all intraday data (already filtered by API)
              filteredHistoricalData = historicalData;
              break;
            case '5D':
              // Show last 5 trading days
              filteredHistoricalData = historicalData.slice(-5);
              break;
            case '1M':
              // Show last ~22 trading days (1 month)
              filteredHistoricalData = historicalData.slice(-22);
              break;
            case '1Y':
              // Show last ~252 trading days (1 year)
              filteredHistoricalData = historicalData.slice(-252);
              break;
          }
        }


        if (!quote) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch stock quote data',
          });
        }

        const stockDetails: StockDetailsData = {
          symbol: symbol.toUpperCase(),
          companyName: `${symbol.toUpperCase()} Company`, // This would come from a company name lookup in a real app
          quote,
          historicalData: filteredHistoricalData,
          lastUpdated: new Date().toISOString(),
        };

        return stockDetails;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch stock details. Please try again later.',
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ symbol: z.string().min(1).max(10) }))
    .query(async ({ input, ctx }) => {
      const { symbol } = input;
      
      // This is a placeholder implementation
      // In the actual implementation, this will fetch stock data from database
      return {
        symbol,
        name: 'Apple Inc.',
        price: 150.25,
        change: 2.45,
        changePercent: 1.66,
        marketCap: 2.5e12,
        peRatio: 28.5,
        dividendYield: 0.82,
        volume: 50000000,
        fiftyTwoWeekHigh: 182.94,
        fiftyTwoWeekLow: 124.17,
        lastUpdated: new Date(),
      };
    }),
});