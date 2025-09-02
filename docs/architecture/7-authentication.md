# 7. Authentication

Authentication will be managed entirely by Supabase Auth, using a one-time code via email.

## 7.1. Client vs. Server Supabase Interaction **(Critical Distinction)**

- **Client-Side (Frontend)**: The Next.js application will use the `@supabase/ssr` package. This client is cookie-based and designed to manage user sessions securely within the browser. It handles login, logout, and provides session information to both client and server components.
- **Server-Side (Backend/tRPC)**: The backend logic within our tRPC API routes will **NOT** use the cookie-based client. Instead, it will interact with the database via the **Prisma client**. Prisma is configured with a direct, secure database connection string (containing the database password) stored in server-side environment variables. This is a trusted, **service-based connection**. The tRPC `protectedProcedure` will authorize actions by verifying the user's session (provided by the client), but the database operations themselves are executed by Prisma with its own secure credentials.

## 7.2. Login Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant NextClient as "Next.js (Client)"
    participant Supabase
    participant NextServer as "tRPC API (Server)"
    participant Prisma
    participant DB

    User->>NextClient: Enters email for login
    NextClient->>Supabase: supabase.auth.signInWithOtp()
    Supabase->>User: Sends login code via email
    User->>NextClient: Enters code
    NextClient->>Supabase: supabase.auth.verifyOtp()
    Supabase-->>NextClient: Returns session, sets auth cookie

    User->>NextClient: Adds stock to watchlist
    NextClient->>NextServer: tRPC call: watchlist.add({ symbol: 'XYZ' })
    NextServer->>NextServer: Middleware verifies auth cookie
    NextServer->>Prisma: prisma.watchlistItem.create(...)
    Prisma->>DB: Executes INSERT query
    DB-->>Prisma: Success
    Prisma-->>NextServer: Success
    NextServer-->>NextClient: Success

```
