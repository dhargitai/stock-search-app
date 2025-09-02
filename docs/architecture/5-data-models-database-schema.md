# 5. Data Models & Database Schema

The database schema will be managed by Prisma. The core model is the `WatchlistItem`, which connects a user to a stock symbol.

**File: `packages/db/prisma/schema.prisma`**

```toml

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Corresponds to Supabase's auth.users table
model User {
  id            String          @id @default(uuid())
  email         String?         @unique
  watchlistItems WatchlistItem[]
}

model WatchlistItem {
  id        Int      @id @default(autoincrement())
  symbol    String
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, symbol])
}

```

**Note on Supabase Auth Integration**: A database trigger will be set up in Supabase to automatically create a `User` record in our public schema whenever a new user signs up via Supabase Auth.
