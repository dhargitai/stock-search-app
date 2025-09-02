# Epic 1: Foundation & Core Public Experience

**Goal**: To set up the project foundation and implement all publicly accessible, core features of the application. This epic delivers immediate value to guest users by providing the full stock search and data visualization experience.

## Story 1.1: Project Setup & Tooling Integration
*As a Developer, I want a new Next.js 15 project initialized with all core dependencies and tooling, so that I can begin development efficiently.*
* **Acceptance Criteria**:
    1.  A new Next.js 15 project is created using the App Router.
    2.  TypeScript is configured.
    3.  TailwindCSS and DaisyUI are installed and configured.
    4.  Prisma, tRPC, React Query, and Apache ECharts are installed.
    5.  ESLint and Prettier are configured for code quality.

## Story 1.2: Implement Stock Search Page UI
*As a User, I want a clean and simple search page, so that I can easily begin searching for stocks.*
* **Acceptance Criteria**:
    1.  A homepage is created that serves as the search view.
    2.  The page contains a prominent search input field.
    3.  A container is present to display search suggestions.
    4.  The layout is responsive and mobile-friendly.

## Story 1.3: Integrate Alphavantage API for Type-Ahead Suggestions
*As a User, I want to see a list of matching stocks as I type in the search bar, so that I can quickly find the symbol I'm looking for.*
* **Acceptance Criteria**:
    1.  As the user types (after a debounce interval), a tRPC endpoint is called.
    2.  The tRPC endpoint fetches data from the Alphavantage `SYMBOL_SEARCH` API.
    3.  The fetched suggestions (symbol and name) are displayed in a list below the search input.
    4.  Clicking a suggestion navigates the user to the stock detail page for that symbol.
    5.  API requests are cached using React Query to prevent redundant calls.

## Story 1.4: Implement Stock Detail Page UI Layout
*As a User, I want a well-organized detail page, so that I can easily read all the relevant information about a stock.*
* **Acceptance Criteria**:
    1.  A dynamic route `/[symbol]` is created for the detail view.
    2.  The page displays the stock's name and symbol prominently.
    3.  A section is laid out using CSS Flex or Grid to display key quote data (e.g., price, change, open, high, low, volume).
    4.  A container is prepared for the historical price chart.
    5.  The layout is responsive and mobile-friendly.

## Story 1.5: Integrate Alphavantage APIs for Stock Details
*As a User, I want to see the latest price and historical data for a stock, so that I can make informed decisions.*
* **Acceptance Criteria**:
    1.  When the detail page loads, it uses SSR to fetch data for the given symbol.
    2.  tRPC endpoints are created to fetch data from the Alphavantage `GLOBAL_QUOTE` and `TIME_SERIES_DAILY_ADJUSTED` APIs.
    3.  The key quote data section is populated with the results from `GLOBAL_QUOTE`.
    4.  The historical data is passed to the chart component.

## Story 1.6: Implement Interactive Price History Chart
*As a User, I want to see a visual chart of a stock's historical performance, so that I can understand its trends over time.*
* **Acceptance Criteria**:
    1.  The Apache ECharts component is integrated into the detail page.
    2.  The chart is populated with the `TIME_SERIES_DAILY_ADJUSTED` data.
    3.  The chart displays the adjusted close price over time.
    4.  The chart is interactive (e.g., tooltips on hover).
    5.  The chart is responsive.

---
