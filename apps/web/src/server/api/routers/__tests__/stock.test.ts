/**
 * Unit tests for stock router tRPC procedures
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { stockRouter } from '../stock';
import type { 
  AlphaVantageGlobalQuoteResponse,
  AlphaVantageTimeSeriesResponse 
} from '@/lib/types/stock';

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    ALPHA_VANTAGE_API_KEY: 'test-api-key'
  }
}));

// Mock Prisma db
vi.mock('@peak-finance/db', () => ({
  db: {
    // Mock any db methods if needed
  }
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockGlobalQuoteResponse: AlphaVantageGlobalQuoteResponse = {
  'Global Quote': {
    '01. symbol': 'AAPL',
    '02. open': '150.00',
    '03. high': '155.50',
    '04. low': '149.00',
    '05. price': '152.25',
    '06. volume': '50000000',
    '07. latest trading day': '2023-12-01',
    '08. previous close': '151.00',
    '09. change': '1.25',
    '10. change percent': '0.83%'
  }
};

const mockTimeSeriesResponse: AlphaVantageTimeSeriesResponse = {
  'Meta Data': {
    '1. Information': 'Daily Time Series with Splits and Dividend Events',
    '2. Symbol': 'AAPL',
    '3. Last Refreshed': '2023-12-01',
    '4. Output Size': 'Compact',
    '5. Time Zone': 'US/Eastern'
  },
  'Time Series (Daily)': {
    '2023-12-01': {
      '1. open': '150.00',
      '2. high': '155.50',
      '3. low': '149.00',
      '4. close': '152.25',
      '5. volume': '50000000'
    },
    '2023-11-30': {
      '1. open': '151.00',
      '2. high': '153.00',
      '3. low': '150.00',
      '4. close': '151.00',
      '5. volume': '45000000'
    }
  }
};

describe('Stock Router', () => {
  const ctx = {
    db: null as any, // Mock db as any type for tests
    req: new Request('http://localhost') as any
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('search procedure', () => {
    it('should return stock search suggestions', async () => {
      const mockSearchResponse = {
        bestMatches: [
          {
            '1. symbol': 'AAPL',
            '2. name': 'Apple Inc.',
            '3. type': 'Equity',
            '4. region': 'United States',
            '5. marketOpen': '09:30',
            '6. marketClose': '16:00',
            '7. timezone': 'UTC-04',
            '8. currency': 'USD',
            '9. matchScore': '1.0000'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse)
      });

      const caller = stockRouter.createCaller(ctx);
      const result = await caller.search({ query: 'AAPL' });

      expect(result).toEqual([
        {
          symbol: 'AAPL',
          name: 'Apple Inc.'
        }
      ]);
    });

    it('should handle API rate limit error', async () => {
      const mockResponse = {
        Note: 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day.'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const caller = stockRouter.createCaller(ctx);
      
      await expect(caller.search({ query: 'AAPL' }))
        .rejects.toThrow(TRPCError);
    });
  });

  describe('getGlobalQuote procedure', () => {
    it('should return formatted stock quote data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGlobalQuoteResponse)
      });

      const caller = stockRouter.createCaller(ctx);
      const result = await caller.getGlobalQuote({ symbol: 'AAPL' });

      expect(result).toEqual({
        price: 152.25,
        change: 1.25,
        percentChange: 0.83,
        open: 150.00,
        high: 155.50,
        low: 149.00,
        volume: 50000000,
        prevClose: 151.00,
        lastUpdated: '2023-12-01'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('function=GLOBAL_QUOTE')
      );
    });

    it('should handle invalid symbol error', async () => {
      const errorResponse = {
        'Error Message': 'Invalid API call. Please retry or visit the documentation (https://www.alphavantage.co/documentation/) for GLOBAL_QUOTE.'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(errorResponse)
      });

      const caller = stockRouter.createCaller(ctx);
      
      await expect(caller.getGlobalQuote({ symbol: 'INVALID' }))
        .rejects.toThrow(TRPCError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const caller = stockRouter.createCaller(ctx);
      
      await expect(caller.getGlobalQuote({ symbol: 'AAPL' }))
        .rejects.toThrow(TRPCError);
    });

    it('should handle missing Global Quote data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const caller = stockRouter.createCaller(ctx);
      
      await expect(caller.getGlobalQuote({ symbol: 'AAPL' }))
        .rejects.toThrow(TRPCError);
    });
  });

  describe('getTimeSeriesDaily procedure', () => {
    it('should return formatted historical data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTimeSeriesResponse)
      });

      const caller = stockRouter.createCaller(ctx);
      const result = await caller.getTimeSeriesDaily({ symbol: 'AAPL' });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2023-11-30',
        open: 151.00,
        high: 153.00,
        low: 150.00,
        close: 151.00,
        volume: 45000000
      });
      expect(result[1]).toEqual({
        date: '2023-12-01',
        open: 150.00,
        high: 155.50,
        low: 149.00,
        close: 152.25,
        volume: 50000000
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('function=TIME_SERIES_DAILY')
      );
    });

    it('should handle missing time series data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'Meta Data': mockTimeSeriesResponse['Meta Data']
        })
      });

      const caller = stockRouter.createCaller(ctx);
      
      await expect(caller.getTimeSeriesDaily({ symbol: 'AAPL' }))
        .rejects.toThrow(TRPCError);
    });

    it('should limit results to 30 days and sort chronologically', async () => {
      const timeSeriesData: { [key: string]: any } = {};
      
      // Create 40 days of data
      for (let i = 0; i < 40; i++) {
        const date = new Date(2023, 11, i + 1).toISOString().split('T')[0];
        timeSeriesData[date] = {
          '1. open': '150.00',
          '2. high': '155.50',
          '3. low': '149.00',
          '4. close': '152.25',
          '5. volume': '50000000'
        };
      }

      const largeTimeSeriesResponse = {
        ...mockTimeSeriesResponse,
        'Time Series (Daily)': timeSeriesData
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largeTimeSeriesResponse)
      });

      const caller = stockRouter.createCaller(ctx);
      const result = await caller.getTimeSeriesDaily({ symbol: 'AAPL' });

      expect(result).toHaveLength(30);
      
      // Check chronological order
      for (let i = 1; i < result.length; i++) {
        expect(new Date(result[i].date).getTime())
          .toBeGreaterThan(new Date(result[i-1].date).getTime());
      }
    });
  });

  describe('getDetails procedure', () => {
    it('should return combined stock details', async () => {
      // Reset mocks before this test
      mockFetch.mockClear();
      
      // Mock both fetch calls for the getDetails procedure
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGlobalQuoteResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTimeSeriesResponse)
        });

      const caller = stockRouter.createCaller(ctx);
      const result = await caller.getDetails({ symbol: 'AAPL' });

      expect(result.symbol).toBe('AAPL');
      expect(result.companyName).toBe('AAPL Company');
      expect(result.quote.price).toBe(152.25);
      expect(result.historicalData).toHaveLength(2);
      expect(result.lastUpdated).toBeTruthy();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTimeSeriesResponse)
        });

      const caller = stockRouter.createCaller(ctx);
      
      await expect(caller.getDetails({ symbol: 'AAPL' }))
        .rejects.toThrow(TRPCError);
    });
  });
});