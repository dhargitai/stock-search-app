# Take-home assignment

## **Stock Search App**

### **Objective**

Your task is to create a simple Next.js application that allows users to search for stock quotes and display their data using the Alphavantage public data source. The application should have two views: a search view and a detail view. The search view should allow users to search for a stock by entering its symbol or name. The detail view should display information about the selected stock, including its name, symbol, current price, and any other relevant data you can obtain from the https://www.alphavantage.co/. Additionally, the search view should include a stock suggestion feature that displays a list of suggested stocks as the user types.

### **Requirements**

- The application should be built using Next.js and styled using CSS or TailwindCSS.

- https://www.alphavantage.co/ should be used to obtain the data for the stocks.

- The application should have two views: a search view and a detail view. Both of these should be NextJS pages.

- The search view should allow users to search for a stock by entering its symbol or name.

- The detail view should display information about the selected stock, including its name, symbol, current price, and any other relevant data you can obtain from Alphavantage. Display the data with CSS Flex or Grid system.

- The application should be responsive and mobile-friendly.

- The code should be well-organized, modular, and easy to maintain.

- The application should be deployed to a publicly accessible URL, such as Vercel.

- The code should be hosted on a public Git repository, such as GitHub. Try to maintain a clear and concise commit history.

### **Bonus Points**

- NextJS SSR.

- The search view should include a stock suggestion feature that displays a list of suggested stocks as the user types.

- Add a chart to the detail view that shows the stock's price history over time.

- Implement a caching mechanism to improve performance and reduce the number of API requests.

- Add a feature that allows users to save their favourite stocks and view them in a separate view.

---

## 🚀 Local Development Setup

This guide will help you set up the Peak Finance stock search application on your local machine from a fresh clone of the repository.

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **pnpm** (v9 or later) - Install with `npm install -g pnpm`
- **Docker** - Required for Supabase local development - [Download here](https://docker.com/)
- **Git** - For cloning the repository

### 📥 Installation Steps

#### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd stock-search-app
```

#### 2. Install Dependencies

```bash
# Install all dependencies for the monorepo
pnpm install
```

#### 3. Install Supabase CLI

```bash
# Install Supabase CLI globally
npm install -g supabase

# Verify installation
supabase --version
```

#### 4. Set Up Environment Variables

```bash
# Copy the example environment file
cp apps/web/.env.example apps/web/.env.local
```

Open the `apps/web/.env.local` file and configure the following variables:

```env
# Database - These will be updated after starting Supabase
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase - These will be filled after starting Supabase
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# External APIs
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"  # Get from https://www.alphavantage.co/support/#api-key
FINNHUB_API_KEY="your-finnhub-key"  # Optional - Get from https://finnhub.io/

# Node Environment
NODE_ENV="development"
```

#### 5. Start Supabase Local Development

```bash
# Initialize Supabase in the project (if not already done)
supabase init

# Start all Supabase services (Database, Auth, API, etc.)
supabase start
```

**Important**: After running `supabase start`, you'll see output similar to this:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: your-jwt-secret
       anon key: your-anon-key
service_role key: your-service-role-key
   S3 Access Key: your-s3-access-key
   S3 Secret Key: your-s3-secret-key
       S3 Region: local
```

**Copy these values and update your `apps/web/.env.local` file**:
- Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the `anon key`
- Update `SUPABASE_SERVICE_ROLE_KEY` with the `service_role key`

#### 6. Set Up the Database

The database schema and Row Level Security policies are already defined in the Supabase migration. Run the following to ensure everything is set up:

```bash
# Generate Prisma client
pnpm --filter @peak-finance/db db:generate

# Push any additional schema changes (if needed)
pnpm --filter @peak-finance/db db:push

# Optional: Seed the database with test data
pnpm --filter @peak-finance/db db:seed
```

#### 7. Start the Development Server

```bash
# Start all development servers (web app and any other services)
pnpm dev
```

This will start:
- **Web App**: http://localhost:3000
- **Supabase Studio**: http://127.0.0.1:54323 (Database management interface)

### 🔐 Getting API Keys

#### Alpha Vantage API Key (Required)
1. Visit https://www.alphavantage.co/support/#api-key
2. Sign up for a free account
3. Copy your API key
4. Add it to your `apps/web/.env.local` file as `ALPHA_VANTAGE_API_KEY`

### ✅ Verify Your Setup

1. **Check Web Application**:
   - Visit http://localhost:3000
   - You should see the stock search interface

2. **Check Supabase Studio**:
   - Visit http://127.0.0.1:54323
   - Navigate to the "Table Editor"
   - You should see `users` and `watchlist_items` tables

3. **Test Authentication**:
   - Try signing up/signing in through the web interface
   - Check that user data appears in Supabase Studio

4. **Test Stock Search**:
   - Search for a stock symbol (e.g., "AAPL")
   - Verify data is returned from Alpha Vantage API

### 🧪 Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @peak-finance/web test
pnpm --filter @peak-finance/db test

# Run tests in watch mode
pnpm --filter @peak-finance/web test:watch
```

### 🔧 Common Commands

```bash
# Development
pnpm dev                    # Start all development servers
pnpm build                  # Build all packages
pnpm lint                   # Run linting
pnpm type-check            # Run TypeScript checks
pnpm format                # Format code with Prettier

# Database Management
pnpm --filter @peak-finance/db db:studio     # Open Prisma Studio
pnpm --filter @peak-finance/db db:migrate    # Run database migrations
pnpm --filter @peak-finance/db db:reset      # Reset database
pnpm --filter @peak-finance/db db:seed       # Seed database

# Supabase Management
supabase status            # Check status of services
supabase stop             # Stop all services
supabase db reset         # Reset Supabase database
supabase studio           # Open Supabase Studio
```

### 🚨 Troubleshooting

#### Issue: Supabase services won't start
**Solution**: 
- Ensure Docker is running
- Check if ports 54321-54324 are available
- Try `supabase stop` then `supabase start`

#### Issue: Database connection errors
**Solution**:
- Verify your `DATABASE_URL` matches the Supabase local database URL
- Check that Supabase is running with `supabase status`
- Ensure the database port (54322) is not blocked

#### Issue: Authentication not working
**Solution**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that the Supabase Auth service is running
- Ensure your domain is in the Supabase allowed origins

#### Issue: API keys not working
**Solution**:
- Verify your Alpha Vantage API key is valid and has quota remaining
- Check that environment variables are loaded correctly
- Restart the development server after changing environment variables

#### Issue: Prisma client errors
**Solution**:
```bash
# Regenerate Prisma client
pnpm --filter @peak-finance/db db:generate

# If schema changes, push them
pnpm --filter @peak-finance/db db:push
```

### 📚 Additional Resources

- [Supabase Local Development Guide](https://supabase.com/docs/guides/cli/local-development)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/)

### 🏗️ Architecture Overview

This application uses:
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: tRPC for type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with Row Level Security
- **Testing**: Vitest with Testing Library
- **Build System**: Turbo for monorepo management
