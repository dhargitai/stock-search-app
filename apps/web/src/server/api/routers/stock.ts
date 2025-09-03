import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { env } from '@/lib/env';
import type {
  AlphaVantageGlobalQuoteResponse,
  AlphaVantageTimeSeriesResponse,
  StockQuoteData,
  ChartDataPoint,
  StockDetailsData
} from '@/lib/types/stock';

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
      const { query } = input;

      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
            query
          )}&apikey=${env.ALPHA_VANTAGE_API_KEY}`
        );

        if (!response.ok) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch stock data from Alpha Vantage',
          });
        }

        const data = (await response.json()) as AlphaVantageSearchResponse;

        // Handle API error responses
        if (data['Error Message']) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: data['Error Message'],
          });
        }

        // Handle API rate limit
        if (data['Note']) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'API rate limit exceeded. Please try again later.',
          });
        }

        // Handle premium endpoint error
        if (data['Information'] && data['Information'].includes('premium')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This endpoint requires a premium subscription.',
          });
        }

        // Transform the response to match our expected format
        const suggestions = (data.bestMatches || []).map((match) => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
        }));

        return suggestions;
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
      const { symbol } = input;

      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
            symbol
          )}&apikey=${env.ALPHA_VANTAGE_API_KEY}`
        );

        if (!response.ok) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch stock quote from Alpha Vantage',
          });
        }

        const data = (await response.json()) as AlphaVantageGlobalQuoteResponse;

        // Handle API error responses
        if (data['Error Message']) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: data['Error Message'],
          });
        }

        // Handle API rate limit
        if (data['Note']) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'API rate limit exceeded. Please try again later.',
          });
        }

        // Handle premium endpoint error
        if (data['Information'] && data['Information'].includes('premium')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This endpoint requires a premium subscription.',
          });
        }

        const globalQuote = data['Global Quote'];
        
        if (!globalQuote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No quote data found for symbol: ${symbol}`,
          });
        }

        // Transform API response to our StockQuoteData interface
        const quoteData: StockQuoteData = {
          price: parseFloat(globalQuote['05. price']),
          change: parseFloat(globalQuote['09. change']),
          percentChange: parseFloat(globalQuote['10. change percent'].replace('%', '')),
          open: parseFloat(globalQuote['02. open']),
          high: parseFloat(globalQuote['03. high']),
          low: parseFloat(globalQuote['04. low']),
          volume: parseInt(globalQuote['06. volume']),
          prevClose: parseFloat(globalQuote['08. previous close']),
          lastUpdated: globalQuote['07. latest trading day'],
        };

        return quoteData;
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
      const { symbol } = input;

      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(
            symbol
          )}&outputsize=compact&apikey=${env.ALPHA_VANTAGE_API_KEY}`
        );

        if (!response.ok) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch time series data from Alpha Vantage',
          });
        }

        const data = (await response.json()) as AlphaVantageTimeSeriesResponse;

        // Handle API error responses
        if (data['Error Message']) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: data['Error Message'],
          });
        }

        // Handle API rate limit
        if (data['Note']) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'API rate limit exceeded. Please try again later.',
          });
        }

        // Handle premium endpoint error
        if (data['Information'] && data['Information'].includes('premium')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This endpoint requires a premium subscription.',
          });
        }

        const timeSeries = data['Time Series (Daily)'];
        
        if (!timeSeries) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No time series data found for symbol: ${symbol}`,
          });
        }

        // Transform time series data to chart format (last 30 days)
        const chartData: ChartDataPoint[] = Object.entries(timeSeries)
          .slice(0, 30)
          .map(([date, values]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume']),
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort chronologically

        return chartData;
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
    .input(z.object({ symbol: z.string().min(1).max(10) }))
    .query(async ({ input, ctx }) => {
      const { symbol } = input;

      try {
        // Use the existing procedures to get both quote and historical data
        const [quote, historicalData] = await Promise.all([
          (() => {
            return fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
                symbol
              )}&apikey=${env.ALPHA_VANTAGE_API_KEY}`
            );
          })().then(async (response) => {
            if (!response.ok) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to fetch stock quote from Alpha Vantage',
              });
            }
            const data = (await response.json()) as AlphaVantageGlobalQuoteResponse;
            
            if (data['Error Message']) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: data['Error Message'],
              });
            }

            if (data['Note']) {
              throw new TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: 'API rate limit exceeded. Please try again later.',
              });
            }

            const globalQuote = data['Global Quote'];
            if (!globalQuote || Object.keys(globalQuote).length === 0) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: `No quote data found for symbol: ${symbol}. This may be due to an invalid symbol or API rate limits.`,
              });
            }

            // Helper function to safely parse values with fallbacks
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

            return {
              price: safeParseFloat(globalQuote['05. price']),
              change: safeParseFloat(globalQuote['09. change']),
              percentChange: safeParsePercentage(globalQuote['10. change percent']),
              open: safeParseFloat(globalQuote['02. open']),
              high: safeParseFloat(globalQuote['03. high']),
              low: safeParseFloat(globalQuote['04. low']),
              volume: safeParseInt(globalQuote['06. volume']),
              prevClose: safeParseFloat(globalQuote['08. previous close']),
              lastUpdated: globalQuote['07. latest trading day'] || '',
            } as StockQuoteData;
          }),
          
          (() => {
            return fetch(
              `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(
                symbol
              )}&outputsize=compact&apikey=${env.ALPHA_VANTAGE_API_KEY}`
            );
          })().then(async (response) => {
            if (!response.ok) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to fetch time series data from Alpha Vantage',
              });
            }
            const data = (await response.json()) as AlphaVantageTimeSeriesResponse;
            
            if (data['Error Message']) {
              return [] as ChartDataPoint[];
            }

            if (data['Note']) {
              return [] as ChartDataPoint[];
            }

            const timeSeries = data['Time Series (Daily)'];
            if (!timeSeries) {
              return [] as ChartDataPoint[];
            }

            return Object.entries(timeSeries)
              .slice(0, 30)
              .map(([date, values]) => ({
                date,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume']),
              }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) as ChartDataPoint[];
          })
        ]);


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
          historicalData,
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