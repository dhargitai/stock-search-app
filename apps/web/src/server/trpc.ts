import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@peak-finance/db';

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  return {
    db,
    req,
    res,
  };
};

// For App Router (fetch API)
export const createTRPCContextFetch = async (opts: { req: Request }) => {
  return {
    db,
    req: opts.req,
    res: undefined,
  };
};

// Define context type for App Router
type TRPCContextFetch = {
  db: typeof db;
  req: Request;
  res: undefined;
};

// Context creator for Pages Router  
const t = initTRPC.context<typeof createTRPCContext>().create({
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

// Context creator for App Router
const tFetch = initTRPC.context<TRPCContextFetch>().create({
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

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

// App Router specific exports
export const createCallerFactoryFetch = tFetch.createCallerFactory;
export const createTRPCRouterFetch = tFetch.router;
export const publicProcedureFetch = tFetch.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  // For now, we'll skip authentication and add it later
  // This middleware will be enhanced when we add authentication
  if (!ctx.req) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      // user: ctx.user, // Will be added when authentication is implemented
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);