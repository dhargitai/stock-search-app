# 6. API Specification (tRPC)

The API will be structured into routers, separating public and protected procedures.

**File: `apps/web/src/server/api/routers/stock.ts` (Public)**

```typescript
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
// ... alphavantage fetch logic

export const stockRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      // Logic to call Alphavantage SYMBOL_SEARCH API
      // Return type: { symbol: string, name: string }[]
    }),
  getDetails: publicProcedure
    .input(z.object({ symbol: z.string().min(1) }))
    .query(async ({ input }) => {
      // Logic to call GLOBAL_QUOTE and TIME_SERIES_DAILY_ADJUSTED
      // Return combined data
    }),
});

```

**File: `apps/web/src/server/api/routers/watchlist.ts` (Protected)**

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const watchlistRouter = createTRPCRouter({
  get: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.watchlistItem.findMany({
      where: { userId: ctx.session.user.id },
    });
  }),
  add: protectedProcedure
    .input(z.object({ symbol: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Logic to add a symbol to the user's watchlist
    }),
  remove: protectedProcedure
    .input(z.object({ symbol: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Logic to remove a symbol
    }),
});

```
