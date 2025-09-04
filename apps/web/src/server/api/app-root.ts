import { db } from '@peak-finance/db';
import { createTRPCRouter } from './trpc';

// Context creation for App Router
export const createTRPCContext = (opts: { req: Request }) => {
  return {
    db,
    req: opts.req,
  };
};

// Import existing routers and re-export with App Router compatibility
import { stockRouter } from './routers/stock';
import { userRouter } from './routers/user';
import { watchlistRouter } from './routers/watchlist';

export const appRouter = createTRPCRouter({
  stock: stockRouter,
  user: userRouter,
  watchlist: watchlistRouter,
});

export type AppRouter = typeof appRouter;