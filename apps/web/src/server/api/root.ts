import { createTRPCRouter } from '../trpc';
import { stockRouter } from './routers/stock';
import { userRouter } from './routers/user';

export const appRouter = createTRPCRouter({
  stock: stockRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;