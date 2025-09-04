import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '../src/generated/index.js';
import { randomUUID } from 'crypto';

describe('Database Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toEqual([{ test: 1 }]);
    });

    it('should have all required tables', async () => {
      const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      
      const tableNames = tables.map(t => t.tablename);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('watchlist_items');
    });
  });

  describe('User Model', () => {
    const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01';

    afterEach(async () => {
      // Cleanup
      try {
        await prisma.user.delete({ where: { id: testUserId } });
      } catch {}
    });

    it('should create user with UUID', async () => {
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      expect(user.id).toBe(testUserId);
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should find user by ID', async () => {
      await prisma.user.create({
        data: {
          id: testUserId,
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      const found = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(found).not.toBeNull();
      expect(found!.email).toBe('test@example.com');
    });

    it('should update user', async () => {
      await prisma.user.create({
        data: {
          id: testUserId,
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      const updated = await prisma.user.update({
        where: { id: testUserId },
        data: { name: 'Updated User' }
      });

      expect(updated.name).toBe('Updated User');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(updated.createdAt.getTime());
    });

    it('should delete user', async () => {
      await prisma.user.create({
        data: {
          id: testUserId,
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      await prisma.user.delete({ where: { id: testUserId } });

      const found = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(found).toBeNull();
    });
  });

  describe('WatchlistItem Model', () => {
    const testUserId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02';
    let watchlistItemId: number;

    beforeEach(async () => {
      // Create test user
      await prisma.user.create({
        data: {
          id: testUserId,
          email: 'watchlist-test@example.com',
          name: 'Watchlist Test User'
        }
      });
    });

    afterEach(async () => {
      // Cleanup
      try {
        if (watchlistItemId) {
          await prisma.watchlistItem.delete({ where: { id: watchlistItemId } });
        }
        await prisma.user.delete({ where: { id: testUserId } });
      } catch {}
    });

    it('should create watchlist item for user', async () => {
      const watchlistItem = await prisma.watchlistItem.create({
        data: {
          symbol: 'AAPL',
          userId: testUserId
        }
      });

      watchlistItemId = watchlistItem.id;
      expect(watchlistItem.symbol).toBe('AAPL');
      expect(watchlistItem.userId).toBe(testUserId);
      expect(watchlistItem.createdAt).toBeInstanceOf(Date);
    });

    it('should cascade delete watchlist items when user is deleted', async () => {
      const watchlistItem = await prisma.watchlistItem.create({
        data: {
          symbol: 'AAPL',
          userId: testUserId
        }
      });

      watchlistItemId = watchlistItem.id;

      // Delete user should cascade delete watchlist items
      await prisma.user.delete({ where: { id: testUserId } });

      const foundItem = await prisma.watchlistItem.findUnique({
        where: { id: watchlistItemId }
      });

      expect(foundItem).toBeNull();
      watchlistItemId = 0; // Reset so cleanup doesn't try to delete
    });

    it('should enforce unique constraint on userId + symbol', async () => {
      await prisma.watchlistItem.create({
        data: {
          symbol: 'AAPL',
          userId: testUserId
        }
      });

      await expect(
        prisma.watchlistItem.create({
          data: {
            symbol: 'AAPL',
            userId: testUserId
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('User-WatchlistItem Relationships', () => {
    let testUserId: string;
    let watchlistItemIds: number[] = [];

    beforeEach(async () => {
      testUserId = randomUUID();
      await prisma.user.create({
        data: {
          id: testUserId,
          email: `relationship-test-${testUserId}@example.com`,
          name: 'Relationship Test User'
        }
      });
    });

    afterEach(async () => {
      try {
        // Cleanup watchlist items first
        for (const itemId of watchlistItemIds) {
          await prisma.watchlistItem.delete({ where: { id: itemId } });
        }
        watchlistItemIds = [];
        await prisma.user.delete({ where: { id: testUserId } });
      } catch (e) {
        console.log('Cleanup error:', e);
      }
    });

    it('should load user with watchlist items', async () => {
      const item1 = await prisma.watchlistItem.create({
        data: {
          symbol: 'AAPL',
          userId: testUserId
        }
      });

      const item2 = await prisma.watchlistItem.create({
        data: {
          symbol: 'GOOGL',
          userId: testUserId
        }
      });

      watchlistItemIds = [item1.id, item2.id];

      const userWithData = await prisma.user.findUnique({
        where: { id: testUserId },
        include: {
          watchlistItems: true
        }
      });

      expect(userWithData).not.toBeNull();
      expect(userWithData!.watchlistItems).toHaveLength(2);
      const symbols = userWithData!.watchlistItems.map(item => item.symbol);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('GOOGL');
    });
  });

  describe('Database Trigger', () => {
    const testAuthUserId = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a04';

    afterEach(async () => {
      try {
        await prisma.user.delete({ where: { id: testAuthUserId } });
        await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${testAuthUserId}::uuid`;
      } catch {}
    });

    it('should auto-create user record when auth.users record is created', async () => {
      // Insert into auth.users to trigger the function
      await prisma.$executeRaw`
        INSERT INTO auth.users (
          id, 
          instance_id, 
          aud, 
          role, 
          email, 
          encrypted_password,
          email_confirmed_at,
          raw_user_meta_data,
          created_at, 
          updated_at,
          is_sso_user,
          is_anonymous
        ) VALUES (
          ${testAuthUserId}::uuid,
          gen_random_uuid(),
          'authenticated',
          'authenticated', 
          'trigger-integration@example.com',
          crypt('testpassword', gen_salt('bf')),
          now(),
          '{"name": "Trigger Integration User"}'::jsonb,
          now(),
          now(),
          false,
          false
        )
      `;

      // Check if user was auto-created
      const user = await prisma.user.findUnique({
        where: { id: testAuthUserId }
      });

      expect(user).not.toBeNull();
      expect(user!.email).toBe('trigger-integration@example.com');
      expect(user!.name).toBe('Trigger Integration User');
    });
  });
});