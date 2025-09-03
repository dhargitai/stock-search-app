/**
 * Server-side tRPC caller for SSR data fetching
 * This allows us to call tRPC procedures on the server during SSR
 */

import { appRouter } from '@/server/api/app-root';
import { db } from '@peak-finance/db';

/**
 * Create a server-side tRPC caller
 * This can be used in Server Components and API routes
 */
export function createServerCaller() {
  return appRouter.createCaller({
    db,
    req: new Request('http://localhost') // Mock request for server-side calls
  });
}

/**
 * Export a singleton instance for convenience
 */
export const serverApi = createServerCaller();