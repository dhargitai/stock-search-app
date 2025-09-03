import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import { api } from '@/components/providers/trpc-provider';
import { type AppRouter } from '@/server/api/app-root';

export { api };

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;