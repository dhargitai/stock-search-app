import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../trpc';

export const userRouter = createTRPCRouter({
  getProfile: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      // This is a placeholder implementation
      // In the actual implementation, this will fetch user data from database
      const user = await ctx.db.user.findUnique({
        where: { id },
        include: {
          portfolios: true,
          watchlists: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    }),

  create: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      const { email, name } = input;

      const user = await ctx.db.user.create({
        data: {
          email,
          name,
        },
      });

      return user;
    }),
});