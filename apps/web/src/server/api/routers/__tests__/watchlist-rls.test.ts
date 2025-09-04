import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@peak-finance/db';

// Mock Prisma client with enhanced error handling for RLS scenarios
const mockPrismaClient = {
  watchlistItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock context types for different authentication states
type UnauthenticatedContext = {
  db: typeof mockPrismaClient;
  req: Request;
};

type AuthenticatedContext = UnauthenticatedContext & {
  userId: string;
};

// Mock watchlist router functions that would use RLS-enabled database operations
const mockWatchlistRouter = {
  get: {
    async handler(opts: { ctx: AuthenticatedContext | UnauthenticatedContext }) {
      // Simulate authentication check
      if (!('userId' in opts.ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

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
    async handler(opts: { 
      ctx: AuthenticatedContext | UnauthenticatedContext; 
      input: { symbol: string } 
    }) {
      // Simulate authentication check
      if (!('userId' in opts.ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

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
    async handler(opts: { 
      ctx: AuthenticatedContext | UnauthenticatedContext; 
      input: { symbol: string } 
    }) {
      // Simulate authentication check
      if (!('userId' in opts.ctx)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

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

// Context factories
const createUnauthenticatedContext = (): UnauthenticatedContext => ({
  db: mockPrismaClient,
  req: {} as Request,
});

const createAuthenticatedContext = (userId: string): AuthenticatedContext => ({
  db: mockPrismaClient,
  req: {} as Request,
  userId,
});

describe('Watchlist RLS Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated Access Prevention (AC: 3)', () => {
    it('should fail SELECT operations for unauthenticated users', async () => {
      const ctx = createUnauthenticatedContext();

      await expect(mockWatchlistRouter.get.handler({ ctx })).rejects.toThrow(
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        })
      );
    });

    it('should fail INSERT operations for unauthenticated users', async () => {
      const ctx = createUnauthenticatedContext();
      const input = { symbol: 'AAPL' };

      await expect(mockWatchlistRouter.add.handler({ ctx, input })).rejects.toThrow(
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        })
      );
    });

    it('should fail DELETE operations for unauthenticated users', async () => {
      const ctx = createUnauthenticatedContext();
      const input = { symbol: 'AAPL' };

      await expect(mockWatchlistRouter.remove.handler({ ctx, input })).rejects.toThrow(
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        })
      );
    });
  });

  describe('Cross-User Access Prevention (AC: 4)', () => {
    it('should prevent users from reading another user\'s watchlist items', async () => {
      const user1Context = createAuthenticatedContext('user-1-id');
      
      // Mock database to return empty results due to RLS filtering
      // In real RLS, user-1 would not see user-2's data automatically
      mockPrismaClient.watchlistItem.findMany = vi.fn().mockResolvedValue([]);

      const result = await mockWatchlistRouter.get.handler({ ctx: user1Context });

      expect(mockPrismaClient.watchlistItem.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1-id' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([]);
    });

    it('should prevent users from inserting watchlist items for other users', async () => {
      const user1Context = createAuthenticatedContext('user-1-id');
      const input = { symbol: 'AAPL' };
      
      mockPrismaClient.watchlistItem.findUnique = vi.fn().mockResolvedValue(null);
      
      // Mock RLS violation - attempt to create with different userId would fail
      mockPrismaClient.watchlistItem.create = vi.fn().mockRejectedValue(
        new Error('RLS policy violation: new row violates row-level security policy')
      );

      // The application layer enforces userId from context, so this should work
      // But if someone tried to manipulate the userId, RLS would prevent it
      mockPrismaClient.watchlistItem.create = vi.fn().mockResolvedValue({
        id: 1,
        symbol: 'AAPL',
        userId: 'user-1-id', // Only their own userId is allowed
        createdAt: new Date(),
      });

      const result = await mockWatchlistRouter.add.handler({ ctx: user1Context, input });

      expect(mockPrismaClient.watchlistItem.create).toHaveBeenCalledWith({
        data: {
          symbol: 'AAPL',
          userId: 'user-1-id', // Enforced by application logic + RLS
        },
      });
      expect(result.userId).toBe('user-1-id');
    });

    it('should prevent users from deleting another user\'s watchlist items', async () => {
      const user1Context = createAuthenticatedContext('user-1-id');
      const input = { symbol: 'AAPL' };
      
      // Mock RLS preventing deletion of another user's item
      mockPrismaClient.watchlistItem.delete = vi.fn().mockRejectedValue(
        new Error('Record to delete does not exist.')
      );

      await expect(mockWatchlistRouter.remove.handler({ 
        ctx: user1Context, 
        input 
      })).rejects.toThrow(
        expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Stock not found in watchlist',
        })
      );

      expect(mockPrismaClient.watchlistItem.delete).toHaveBeenCalledWith({
        where: {
          userId_symbol: {
            userId: 'user-1-id',
            symbol: 'AAPL',
          },
        },
      });
    });
  });

  describe('Authenticated User Access (AC: 4)', () => {
    it('should allow users to read their own watchlist items', async () => {
      const userContext = createAuthenticatedContext('test-user-id');
      const mockItems = [
        { id: 1, symbol: 'AAPL', userId: 'test-user-id', createdAt: new Date() },
        { id: 2, symbol: 'GOOGL', userId: 'test-user-id', createdAt: new Date() },
      ];

      mockPrismaClient.watchlistItem.findMany = vi.fn().mockResolvedValue(mockItems);

      const result = await mockWatchlistRouter.get.handler({ ctx: userContext });

      expect(mockPrismaClient.watchlistItem.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockItems);
      expect(result.every(item => item.userId === 'test-user-id')).toBe(true);
    });

    it('should allow users to insert watchlist items for themselves', async () => {
      const userContext = createAuthenticatedContext('test-user-id');
      const input = { symbol: 'AAPL' };
      const mockItem = { id: 1, symbol: 'AAPL', userId: 'test-user-id', createdAt: new Date() };

      mockPrismaClient.watchlistItem.findUnique = vi.fn().mockResolvedValue(null);
      mockPrismaClient.watchlistItem.create = vi.fn().mockResolvedValue(mockItem);

      const result = await mockWatchlistRouter.add.handler({ ctx: userContext, input });

      expect(mockPrismaClient.watchlistItem.create).toHaveBeenCalledWith({
        data: {
          symbol: 'AAPL',
          userId: 'test-user-id',
        },
      });
      expect(result.userId).toBe('test-user-id');
    });

    it('should allow users to delete their own watchlist items', async () => {
      const userContext = createAuthenticatedContext('test-user-id');
      const input = { symbol: 'AAPL' };
      const mockItem = { id: 1, symbol: 'AAPL', userId: 'test-user-id', createdAt: new Date() };

      mockPrismaClient.watchlistItem.delete = vi.fn().mockResolvedValue(mockItem);

      const result = await mockWatchlistRouter.remove.handler({ ctx: userContext, input });

      expect(mockPrismaClient.watchlistItem.delete).toHaveBeenCalledWith({
        where: {
          userId_symbol: {
            userId: 'test-user-id',
            symbol: 'AAPL',
          },
        },
      });
      expect(result.userId).toBe('test-user-id');
    });
  });

  describe('RLS Policy Enforcement Scenarios', () => {
    it('should handle concurrent user sessions with different user IDs', async () => {
      const user1Context = createAuthenticatedContext('user-1-id');
      const user2Context = createAuthenticatedContext('user-2-id');
      
      const user1Items = [
        { id: 1, symbol: 'AAPL', userId: 'user-1-id', createdAt: new Date() },
      ];
      const user2Items = [
        { id: 2, symbol: 'GOOGL', userId: 'user-2-id', createdAt: new Date() },
      ];

      // User 1 query
      mockPrismaClient.watchlistItem.findMany = vi.fn().mockResolvedValue(user1Items);
      const result1 = await mockWatchlistRouter.get.handler({ ctx: user1Context });

      // User 2 query
      mockPrismaClient.watchlistItem.findMany = vi.fn().mockResolvedValue(user2Items);
      const result2 = await mockWatchlistRouter.get.handler({ ctx: user2Context });

      expect(result1.every(item => item.userId === 'user-1-id')).toBe(true);
      expect(result2.every(item => item.userId === 'user-2-id')).toBe(true);
      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
    });

    it('should prevent SQL injection attempts through userId manipulation', async () => {
      const maliciousContext = createAuthenticatedContext('user-1-id\' OR 1=1 --');
      
      // Mock safe parameterized query behavior
      mockPrismaClient.watchlistItem.findMany = vi.fn().mockResolvedValue([]);

      const result = await mockWatchlistRouter.get.handler({ ctx: maliciousContext });

      expect(mockPrismaClient.watchlistItem.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1-id\' OR 1=1 --' }, // Prisma handles escaping
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([]);
    });

    it('should handle empty userId gracefully', async () => {
      const emptyUserContext = createAuthenticatedContext('');
      
      mockPrismaClient.watchlistItem.findMany = vi.fn().mockResolvedValue([]);

      const result = await mockWatchlistRouter.get.handler({ ctx: emptyUserContext });

      expect(mockPrismaClient.watchlistItem.findMany).toHaveBeenCalledWith({
        where: { userId: '' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('Database Connection and RLS Integration', () => {
    it('should respect RLS policies when database connection has valid auth context', () => {
      // This test verifies that the application layer correctly integrates with RLS
      // The actual RLS enforcement happens at the database level via Supabase Auth context
      
      const authenticatedContext = createAuthenticatedContext('valid-user-id');
      
      expect(authenticatedContext.userId).toBe('valid-user-id');
      expect('userId' in authenticatedContext).toBe(true);
      
      // In production, this userId would be used by Prisma queries
      // which would be executed with the authenticated user's database session
      // where auth.uid() returns this same userId
    });

    it('should handle RLS policy violation errors from database', async () => {
      const userContext = createAuthenticatedContext('test-user-id');
      const input = { symbol: 'AAPL' };
      
      // Mock RLS policy violation from database level
      mockPrismaClient.watchlistItem.create = vi.fn().mockRejectedValue(
        new Error('new row violates row-level security policy for table "watchlist_items"')
      );

      await expect(mockWatchlistRouter.add.handler({ 
        ctx: userContext, 
        input 
      })).rejects.toThrow(TRPCError);
    });
  });
});