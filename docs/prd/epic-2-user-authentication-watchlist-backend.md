# Epic 2: User Authentication & Watchlist Backend

**Goal**: To implement the complete backend functionality for user accounts and the watchlist feature, including the database schema, secure authentication, and a full set of APIs.

## Story 2.1: Setup Supabase Project & Database Schema
*As a Developer, I want the Supabase project and database schema configured, so that user and watchlist data can be stored.*
* **Acceptance Criteria**:
    1.  A new Supabase project is created.
    2.  Prisma is connected to the Supabase PostgreSQL database.
    3.  A Prisma schema is defined for a `Watchlist` table, linking stocks to a `userId`.
    4.  The initial database migration is created and applied using `prisma migrate`.

## Story 2.2: Implement User Sign-Up/Login Flow
*As a User, I want a simple and secure way to log in with my email, so that I can access features like the watchlist.*
* **Acceptance Criteria**:
    1.  A login page/modal is created.
    2.  Users can enter their email to receive a one-time login code from Supabase Auth.
    3.  Users can enter the received code to complete the login process.
    4.  Client-side session management is handled using the Supabase client library.
    5.  A "Logout" button is available for authenticated users.

## Story 2.3: Create tRPC API Endpoints for Watchlist
*As a Developer, I want a secure, type-safe API for managing watchlist items, so that the frontend can interact with the database.*
* **Acceptance Criteria**:
    1.  A protected tRPC router is created that requires user authentication.
    2.  An endpoint `getWatchlist` is created to fetch all stocks for the logged-in user.
    3.  An endpoint `addToWatchlist` is created to add a stock symbol to the user's watchlist.
    4.  An endpoint `removeFromWatchlist` is created to remove a stock symbol from the user's watchlist.
    5.  The endpoints use Prisma to interact with the database.

## Story 2.4: Implement Row-Level Security (RLS)
*As a Developer, I want RLS enabled on the watchlist table, so that users are strictly prevented from accessing anyone's data but their own.*
* **Acceptance Criteria**:
    1.  RLS is enabled on the `Watchlist` table in Supabase.
    2.  A security policy is written and applied that ensures users can only perform SELECT, INSERT, UPDATE, and DELETE operations on rows that match their own `user.id`.
    3.  Tests are written to confirm that unauthenticated requests fail.
    4.  Tests are written to confirm that users cannot access another user's data.

---
