# Product Requirements Document: Peak Finance

## 1. Goals and Background Context

### Goals
* To deliver a high-performance, mobile-friendly stock search and analysis platform.
* To provide a secure and seamless authentication experience for users wishing to save their data.
* To ensure data accuracy by reliably integrating with the Alphavantage public data source.

### Background Context
Investors and market enthusiasts require quick, reliable access to stock market data. This project aims to create a streamlined, responsive, and performant application that allows users to effortlessly search for stock information, visualize historical performance, and maintain a personalized watchlist. The application will solve the problem of existing solutions being cluttered, slow, or lacking intuitive features for tracking specific stocks.

### Change Log
| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-09-02 | 1.0 | Initial draft of the PRD. | David Hargitai, dev |

---

## 2. Requirements

### Functional Requirements
* **FR1**: Users shall be able to search for stocks by symbol or company name from a search input.
* **FR2**: The search input shall provide real-time, type-ahead suggestions of matching stocks.
* **FR3**: Users shall be able to navigate to a dedicated detail page for any selected stock.
* **FR4**: The stock detail page shall display current quote information, including price, open, high, low, volume, and change percent.
* **FR5**: The stock detail page shall display a historical price chart based on daily adjusted data.
* **FR6**: Unauthenticated (guest) users shall have full access to search for and view stock details.
* **FR7**: Users shall be able to sign up or log in using an email-based one-time code flow.
* **FR8**: Authenticated users shall be able to add a stock to their personal watchlist from the stock detail page.
* **FR9**: Authenticated users shall be able to remove a stock from their personal watchlist.
* **FR10**: Authenticated users shall be able to view all stocks in their watchlist on a dedicated page.

### Non-Functional Requirements
* **NFR1**: The application must be fully responsive and provide an optimized experience on mobile, tablet, and desktop screens.
* **NFR2**: The application must be highly performant, utilizing Next.js SSR and server-state caching to ensure fast page loads and data retrieval.
* **NFR3**: The codebase must be well-organized, modular, and maintainable, following industry best practices.
* **NFR4**: All user-specific watchlist data must be secured using Supabase's Row-Level Security (RLS) to ensure users can only access their own data.
* **NFR5**: The application must gracefully handle potential API errors or rate-limiting from the Alphavantage service.

---

## 3. User Interface Design Goals

* **Overall UX Vision**: A clean, modern, and data-centric interface that is intuitive to navigate. The design should prioritize clarity and speed, allowing users to find information quickly.
* **Key Interaction Paradigms**:
    * Real-time, asynchronous feedback in the search bar.
    * Interactive charts that allow users to hover over data points for more detail.
    * Clear visual cues to distinguish between guest and authenticated states.
* **Core Screens and Views**:
    * Search Page (Homepage)
    * Stock Detail Page
    * Login / Authentication Page
    * Watchlist Page (for authenticated users)
* **Accessibility**: The application should adhere to WCAG 2.1 AA standards.
* **Branding**: The visual design will utilize a theme from the DaisyUI component library to ensure a consistent and professional look and feel.
* **Target Device and Platforms**: Web Responsive, supporting all modern browsers.

---

## 4. Technical Assumptions

* **Repository Structure**: **Monorepo**. This structure will be used to manage the full-stack application, facilitating easy sharing of types and code between the frontend and the tRPC backend.
* **Service Architecture**: **Serverless**. The architecture will leverage the native serverless capabilities of Vercel for deploying Next.js API routes and Supabase for database and authentication.
* **Testing Requirements**: The project will require **Unit and Integration tests**. Unit tests for individual components and utilities, and integration tests for the tRPC endpoints and database interactions.
* **Additional Technical Assumptions**:
    * The tech stack defined in the Project Brief is confirmed: Next.js 15, TypeScript, tRPC, Prisma 6.15, Supabase (PostgreSQL), TailwindCSS, DaisyUI 5.1, React Query, and Apache ECharts v6.
    * Prisma Migrate will be used for all database schema migrations.

---

## 5. Epic List

* **Epic 1**: Foundation & Core Public Experience
* **Epic 2**: User Authentication & Watchlist Backend
* **Epic 3**: Authenticated User Watchlist Features

---

## Epic 1: Foundation & Core Public Experience

**Goal**: To set up the project foundation and implement all publicly accessible, core features of the application. This epic delivers immediate value to guest users by providing the full stock search and data visualization experience.

### Story 1.1: Project Setup & Tooling Integration
*As a Developer, I want a new Next.js 15 project initialized with all core dependencies and tooling, so that I can begin development efficiently.*
* **Acceptance Criteria**:
    1.  A new Next.js 15 project is created using the App Router.
    2.  TypeScript is configured.
    3.  TailwindCSS and DaisyUI are installed and configured.
    4.  Prisma, tRPC, React Query, and Apache ECharts are installed.
    5.  ESLint and Prettier are configured for code quality.

### Story 1.2: Implement Stock Search Page UI
*As a User, I want a clean and simple search page, so that I can easily begin searching for stocks.*
* **Acceptance Criteria**:
    1.  A homepage is created that serves as the search view.
    2.  The page contains a prominent search input field.
    3.  A container is present to display search suggestions.
    4.  The layout is responsive and mobile-friendly.

### Story 1.3: Integrate Alphavantage API for Type-Ahead Suggestions
*As a User, I want to see a list of matching stocks as I type in the search bar, so that I can quickly find the symbol I'm looking for.*
* **Acceptance Criteria**:
    1.  As the user types (after a debounce interval), a tRPC endpoint is called.
    2.  The tRPC endpoint fetches data from the Alphavantage `SYMBOL_SEARCH` API.
    3.  The fetched suggestions (symbol and name) are displayed in a list below the search input.
    4.  Clicking a suggestion navigates the user to the stock detail page for that symbol.
    5.  API requests are cached using React Query to prevent redundant calls.

### Story 1.4: Implement Stock Detail Page UI Layout
*As a User, I want a well-organized detail page, so that I can easily read all the relevant information about a stock.*
* **Acceptance Criteria**:
    1.  A dynamic route `/[symbol]` is created for the detail view.
    2.  The page displays the stock's name and symbol prominently.
    3.  A section is laid out using CSS Flex or Grid to display key quote data (e.g., price, change, open, high, low, volume).
    4.  A container is prepared for the historical price chart.
    5.  The layout is responsive and mobile-friendly.

### Story 1.5: Integrate Alphavantage APIs for Stock Details
*As a User, I want to see the latest price and historical data for a stock, so that I can make informed decisions.*
* **Acceptance Criteria**:
    1.  When the detail page loads, it uses SSR to fetch data for the given symbol.
    2.  tRPC endpoints are created to fetch data from the Alphavantage `GLOBAL_QUOTE` and `TIME_SERIES_DAILY_ADJUSTED` APIs.
    3.  The key quote data section is populated with the results from `GLOBAL_QUOTE`.
    4.  The historical data is passed to the chart component.

### Story 1.6: Implement Interactive Price History Chart
*As a User, I want to see a visual chart of a stock's historical performance, so that I can understand its trends over time.*
* **Acceptance Criteria**:
    1.  The Apache ECharts component is integrated into the detail page.
    2.  The chart is populated with the `TIME_SERIES_DAILY_ADJUSTED` data.
    3.  The chart displays the adjusted close price over time.
    4.  The chart is interactive (e.g., tooltips on hover).
    5.  The chart is responsive.

---

## Epic 2: User Authentication & Watchlist Backend

**Goal**: To implement the complete backend functionality for user accounts and the watchlist feature, including the database schema, secure authentication, and a full set of APIs.

### Story 2.1: Setup Supabase Project & Database Schema
*As a Developer, I want the Supabase project and database schema configured, so that user and watchlist data can be stored.*
* **Acceptance Criteria**:
    1.  A new Supabase project is created.
    2.  Prisma is connected to the Supabase PostgreSQL database.
    3.  A Prisma schema is defined for a `Watchlist` table, linking stocks to a `userId`.
    4.  The initial database migration is created and applied using `prisma migrate`.

### Story 2.2: Implement User Sign-Up/Login Flow
*As a User, I want a simple and secure way to log in with my email, so that I can access features like the watchlist.*
* **Acceptance Criteria**:
    1.  A login page/modal is created.
    2.  Users can enter their email to receive a one-time login code from Supabase Auth.
    3.  Users can enter the received code to complete the login process.
    4.  Client-side session management is handled using the Supabase client library.
    5.  A "Logout" button is available for authenticated users.

### Story 2.3: Create tRPC API Endpoints for Watchlist
*As a Developer, I want a secure, type-safe API for managing watchlist items, so that the frontend can interact with the database.*
* **Acceptance Criteria**:
    1.  A protected tRPC router is created that requires user authentication.
    2.  An endpoint `getWatchlist` is created to fetch all stocks for the logged-in user.
    3.  An endpoint `addToWatchlist` is created to add a stock symbol to the user's watchlist.
    4.  An endpoint `removeFromWatchlist` is created to remove a stock symbol from the user's watchlist.
    5.  The endpoints use Prisma to interact with the database.

### Story 2.4: Implement Row-Level Security (RLS)
*As a Developer, I want RLS enabled on the watchlist table, so that users are strictly prevented from accessing anyone's data but their own.*
* **Acceptance Criteria**:
    1.  RLS is enabled on the `Watchlist` table in Supabase.
    2.  A security policy is written and applied that ensures users can only perform SELECT, INSERT, UPDATE, and DELETE operations on rows that match their own `user.id`.
    3.  Tests are written to confirm that unauthenticated requests fail.
    4.  Tests are written to confirm that users cannot access another user's data.

---

## Epic 3: Authenticated User Watchlist Features

**Goal**: To build the frontend features for the watchlist and integrate them with the authenticated backend, creating a seamless experience for logged-in users.

### Story 3.1: Implement "Add/Remove from Watchlist" UI
*As an Authenticated User, I want to be able to add or remove stocks from my watchlist directly from the detail page, so that I can easily manage my list.*
* **Acceptance Criteria**:
    1.  On the stock detail page, an authenticated user sees an "Add to Watchlist" button.
    2.  If the stock is already in their watchlist, the button appears as "Remove from Watchlist".
    3.  Clicking the button calls the appropriate `addToWatchlist` or `removeFromWatchlist` tRPC endpoint.
    4.  The UI updates optimistically via React Query and re-fetches to confirm the state.
    5.  Guest users see a "Login to Add to Watchlist" button that directs them to the login page.

### Story 3.2: Implement Watchlist Page UI
*As an Authenticated User, I want a dedicated page to view all my saved stocks, so that I can monitor them in one place.*
* **Acceptance Criteria**:
    1.  A protected route `/watchlist` is created, accessible only to authenticated users.
    2.  The page displays a list or grid of the stocks from the user's watchlist.
    3.  Each item in the list displays key information (e.g., symbol, name, current price).
    4.  Clicking on a stock in the watchlist navigates to its detail page.
    5.  A "Remove" button is present for each stock in the list.

### Story 3.3: Connect Watchlist Page to tRPC API
*As an Authenticated User, I want my watchlist page to display my saved stocks from the database, so that my list is always up-to-date.*
* **Acceptance Criteria**:
    1.  The watchlist page calls the `getWatchlist` tRPC endpoint on load.
    2.  The list of stocks returned from the API is displayed on the page.
    3.  A loading state is shown while the data is being fetched.
    4.  An empty state is shown if the user's watchlist is empty.
    5.  Clicking the "Remove" button calls the `removeFromWatchlist` endpoint and updates the UI.
