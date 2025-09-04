import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const watchlistRouter = createTRPCRouter({
  /**
   * Get all watchlist items for the authenticated user
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    try {
      const watchlistItems = await ctx.db.watchlistItem.findMany({
        where: {
          userId: ctx.userId,
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
  }),

  /**
   * Add a stock symbol to the user's watchlist
   */
  add: protectedProcedure
    .input(
      z.object({
        symbol: z.string().min(1).max(10).transform(val => val.toUpperCase()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if item already exists in watchlist
        const existingItem = await ctx.db.watchlistItem.findUnique({
          where: {
            userId_symbol: {
              userId: ctx.userId,
              symbol: input.symbol,
            },
          },
        });

        if (existingItem) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Stock is already in watchlist',
          });
        }

        const watchlistItem = await ctx.db.watchlistItem.create({
          data: {
            symbol: input.symbol,
            userId: ctx.userId,
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
    }),

  /**
   * Check if a stock symbol exists in the user's watchlist
   */
  check: protectedProcedure
    .input(
      z.object({
        symbol: z.string().min(1).max(10).transform(val => val.toUpperCase()),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const existingItem = await ctx.db.watchlistItem.findUnique({
          where: {
            userId_symbol: {
              userId: ctx.userId,
              symbol: input.symbol,
            },
          },
        });

        return !!existingItem;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check watchlist status',
        });
      }
    }),

  /**
   * Remove a stock symbol from the user's watchlist
   */
  remove: protectedProcedure
    .input(
      z.object({
        symbol: z.string().min(1).max(10).transform(val => val.toUpperCase()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const deletedItem = await ctx.db.watchlistItem.delete({
          where: {
            userId_symbol: {
              userId: ctx.userId,
              symbol: input.symbol,
            },
          },
        });

        return deletedItem;
      } catch (error) {
        // If item doesn't exist, Prisma will throw an error
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Stock not found in watchlist',
        });
      }
    }),
});