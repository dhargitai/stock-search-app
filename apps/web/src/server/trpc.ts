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

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

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