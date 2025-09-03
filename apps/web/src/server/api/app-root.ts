import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@peak-finance/db';

// App Router context type
type TRPCContext = {
  db: typeof db;
  req: Request;
};

export const createTRPCContext = (opts: { req: Request }) => {
  return {
    db,
    req: opts.req,
  };
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Import existing routers and re-export with App Router compatibility
import { stockRouter } from './routers/stock';
import { userRouter } from './routers/user';

export const appRouter = createTRPCRouter({
  stock: stockRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;