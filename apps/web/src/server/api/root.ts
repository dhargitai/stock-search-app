import { createTRPCRouter } from '../trpc';
import { stockRouter } from './routers/stock';
import { userRouter } from './routers/user';
import { watchlistRouter } from './routers/watchlist';

export const appRouter = createTRPCRouter({
  stock: stockRouter,
  user: userRouter,
  watchlist: watchlistRouter,
});

export type AppRouter = typeof appRouter;