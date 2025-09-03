import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { env } from '@/lib/env';

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