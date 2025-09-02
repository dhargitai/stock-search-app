# 2. Requirements

## Functional Requirements
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

## Non-Functional Requirements
* **NFR1**: The application must be fully responsive and provide an optimized experience on mobile, tablet, and desktop screens.
* **NFR2**: The application must be highly performant, utilizing Next.js SSR and server-state caching to ensure fast page loads and data retrieval.
* **NFR3**: The codebase must be well-organized, modular, and maintainable, following industry best practices.
* **NFR4**: All user-specific watchlist data must be secured using Supabase's Row-Level Security (RLS) to ensure users can only access their own data.
* **NFR5**: The application must gracefully handle potential API errors or rate-limiting from the Alphavantage service.

---
