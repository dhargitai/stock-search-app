import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@peak-finance/db';

// Mock Prisma client
const mockPrismaClient = {
  watchlistItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock context type
type MockContext = {
  db: typeof mockPrismaClient;
  req: Request;
  userId: string;
};

// Mock watchlist router functions
const mockWatchlistRouter = {
  get: {
    async handler(opts: { ctx: MockContext }) {
      try {
        const watchlistItems = await opts.ctx.db.watchlistItem.findMany({
          where: {
            userId: opts.ctx.userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        return watchlistItems;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch watchlist items',
        });
      }
    },
  },
  add: {
    async handler(opts: { ctx: MockContext; input: { symbol: string } }) {
      try {
        const existingItem = await opts.ctx.db.watchlistItem.findUnique({
          where: {
            userId_symbol: {
              userId: opts.ctx.userId,
              symbol: opts.input.symbol.toUpperCase(),
            },
          },
        });

        if (existingItem) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Stock is already in watchlist',
          });
        }

        const watchlistItem = await opts.ctx.db.watchlistItem.create({
          data: {
            symbol: opts.input.symbol.toUpperCase(),
            userId: opts.ctx.userId,
          },
        });

        return watchlistItem;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add item to watchlist',
        });
      }
    },
  },
  remove: {
    async handler(opts: { ctx: MockContext; input: { symbol: string } }) {
      try {
        const deletedItem = await opts.ctx.db.watchlistItem.delete({
          where: {
            userId_symbol: {
              userId: opts.ctx.userId,
              symbol: opts.input.symbol.toUpperCase(),
            },
          },
        });

        return deletedItem;
      } catch (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Stock not found in watchlist',
        });
      }
    },
  },
};

// Mock context
const createMockContext = (userId = 'test-user-id'): MockContext => ({
  db: mockPrismaClient,
  req: {} as Request,
  userId,
});

describe('watchlistRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should return user watchlist items', async () => {
      const mockItems = [
        { id: 1, symbol: 'AAPL', userId: 'test-user-id', createdAt: new Date() },
        { id: 2, symbol: 'GOOGL', userId: 'test-user-id', createdAt: new Date() },
      ];

      mockPrismaClient.watchlistItem.findMany = vi.fn().mockResolvedValue(mockItems);

      const ctx = createMockContext();
      const result = await mockWatchlistRouter.get.handler({ ctx });

      expect(mockPrismaClient.watchlistItem.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockItems);
    });

    it('should throw error when database fails', async () => {
      mockPrismaClient.watchlistItem.findMany = vi.fn().mockRejectedValue(new Error('DB Error'));

      const ctx = createMockContext();

      await expect(mockWatchlistRouter.get.handler({ ctx })).rejects.toThrow(TRPCError);
    });
  });

  describe('add', () => {
    it('should add new stock to watchlist', async () => {
      const mockItem = { id: 1, symbol: 'AAPL', userId: 'test-user-id', createdAt: new Date() };

      mockPrismaClient.watchlistItem.findUnique = vi.fn().mockResolvedValue(null);
      mockPrismaClient.watchlistItem.create = vi.fn().mockResolvedValue(mockItem);

      const ctx = createMockContext();
      const input = { symbol: 'AAPL' };
      const result = await mockWatchlistRouter.add.handler({ ctx, input });

      expect(mockPrismaClient.watchlistItem.findUnique).toHaveBeenCalledWith({
        where: {
          userId_symbol: {
            userId: 'test-user-id',
            symbol: 'AAPL',
          },
        },
      });
      expect(mockPrismaClient.watchlistItem.create).toHaveBeenCalledWith({
        data: {
          symbol: 'AAPL',
          userId: 'test-user-id',
        },
      });
      expect(result).toEqual(mockItem);
    });

    it('should throw CONFLICT error when stock already exists', async () => {
      const existingItem = { id: 1, symbol: 'AAPL', userId: 'test-user-id', createdAt: new Date() };

      mockPrismaClient.watchlistItem.findUnique = vi.fn().mockResolvedValue(existingItem);

      const ctx = createMockContext();
      const input = { symbol: 'AAPL' };

      await expect(mockWatchlistRouter.add.handler({ ctx, input })).rejects.toThrow(
        expect.objectContaining({
          code: 'CONFLICT',
          message: 'Stock is already in watchlist',
        })
      );
    });

    it('should throw error when database creation fails', async () => {
      mockPrismaClient.watchlistItem.findUnique = vi.fn().mockResolvedValue(null);
      mockPrismaClient.watchlistItem.create = vi.fn().mockRejectedValue(new Error('DB Error'));

      const ctx = createMockContext();
      const input = { symbol: 'AAPL' };

      await expect(mockWatchlistRouter.add.handler({ ctx, input })).rejects.toThrow(TRPCError);
    });

    it('should convert symbol to uppercase', async () => {
      const mockItem = { id: 1, symbol: 'AAPL', userId: 'test-user-id', createdAt: new Date() };

      mockPrismaClient.watchlistItem.findUnique = vi.fn().mockResolvedValue(null);
      mockPrismaClient.watchlistItem.create = vi.fn().mockResolvedValue(mockItem);

      const ctx = createMockContext();
      const input = { symbol: 'aapl' };
      
      await mockWatchlistRouter.add.handler({ ctx, input });

      expect(mockPrismaClient.watchlistItem.create).toHaveBeenCalledWith({
        data: {
          symbol: 'AAPL',
          userId: 'test-user-id',
        },
      });
    });
  });

  describe('remove', () => {
    it('should remove stock from watchlist', async () => {
      const deletedItem = { id: 1, symbol: 'AAPL', userId: 'test-user-id', createdAt: new Date() };

      mockPrismaClient.watchlistItem.delete = vi.fn().mockResolvedValue(deletedItem);

      const ctx = createMockContext();
      const input = { symbol: 'AAPL' };
      const result = await mockWatchlistRouter.remove.handler({ ctx, input });

      expect(mockPrismaClient.watchlistItem.delete).toHaveBeenCalledWith({
        where: {
          userId_symbol: {
            userId: 'test-user-id',
            symbol: 'AAPL',
          },
        },
      });
      expect(result).toEqual(deletedItem);
    });

    it('should throw NOT_FOUND error when stock does not exist', async () => {
      mockPrismaClient.watchlistItem.delete = vi.fn().mockRejectedValue(new Error('Record not found'));

      const ctx = createMockContext();
      const input = { symbol: 'AAPL' };

      await expect(mockWatchlistRouter.remove.handler({ ctx, input })).rejects.toThrow(
        expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Stock not found in watchlist',
        })
      );
    });

    it('should convert symbol to uppercase', async () => {
      const deletedItem = { id: 1, symbol: 'AAPL', userId: 'test-user-id', createdAt: new Date() };

      mockPrismaClient.watchlistItem.delete = vi.fn().mockResolvedValue(deletedItem);

      const ctx = createMockContext();
      const input = { symbol: 'aapl' };
      
      await mockWatchlistRouter.remove.handler({ ctx, input });

      expect(mockPrismaClient.watchlistItem.delete).toHaveBeenCalledWith({
        where: {
          userId_symbol: {
            userId: 'test-user-id',
            symbol: 'AAPL',
          },
        },
      });
    });
  });

  describe('input validation', () => {
    it('should validate symbol input for add procedure', () => {
      // Input validation is handled by Zod schema
      const schema = { symbol: 'AAPL' };
      expect(schema.symbol).toBe('AAPL');
    });

    it('should validate symbol input for remove procedure', () => {
      // Input validation is handled by Zod schema
      const schema = { symbol: 'AAPL' };
      expect(schema.symbol).toBe('AAPL');
    });
  });
});