/**
 * tRPC server initialization
 * Should be done only once per backend!
 */
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@peak-finance/db';
import { createClient } from '../../lib/supabase/server';

// Define the context type that will be available in procedures
type Context = {
  db: typeof db;
  req: Request;
};

// Define authenticated context type
type AuthContext = Context & {
  userId: string;
};

const t = initTRPC.context<Context>().create({
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

/**
 * Authentication middleware that verifies Supabase session
 */
const enforceUserIsAuthenticated = t.middleware(async ({ ctx, next }) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    return next({
      ctx: {
        ...ctx,
        userId: user.id,
      },
    });
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Failed to authenticate user',
    });
  }
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthenticated);