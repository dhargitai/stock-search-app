# Epic 3: Authenticated User Watchlist Features

**Goal**: To build the frontend features for the watchlist and integrate them with the authenticated backend, creating a seamless experience for logged-in users.

## Story 3.1: Implement "Add/Remove from Watchlist" UI
*As an Authenticated User, I want to be able to add or remove stocks from my watchlist directly from the detail page, so that I can easily manage my list.*
* **Acceptance Criteria**:
    1.  On the stock detail page, an authenticated user sees an "Add to Watchlist" button.
    2.  If the stock is already in their watchlist, the button appears as "Remove from Watchlist".
    3.  Clicking the button calls the appropriate `addToWatchlist` or `removeFromWatchlist` tRPC endpoint.
    4.  The UI updates optimistically via React Query and re-fetches to confirm the state.
    5.  Guest users see a "Login to Add to Watchlist" button that directs them to the login page.

## Story 3.2: Implement Watchlist Page UI
*As an Authenticated User, I want a dedicated page to view all my saved stocks, so that I can monitor them in one place.*
* **Acceptance Criteria**:
    1.  A protected route `/watchlist` is created, accessible only to authenticated users.
    2.  The page displays a list or grid of the stocks from the user's watchlist.
    3.  Each item in the list displays key information (e.g., symbol, name, current price).
    4.  Clicking on a stock in the watchlist navigates to its detail page.
    5.  A "Remove" button is present for each stock in the list.

## Story 3.3: Connect Watchlist Page to tRPC API
*As an Authenticated User, I want my watchlist page to display my saved stocks from the database, so that my list is always up-to-date.*
* **Acceptance Criteria**:
    1.  The watchlist page calls the `getWatchlist` tRPC endpoint on load.
    2.  The list of stocks returned from the API is displayed on the page.
    3.  A loading state is shown while the data is being fetched.
    4.  An empty state is shown if the user's watchlist is empty.
    5.  Clicking the "Remove" button calls the `removeFromWatchlist` endpoint and updates the UI.
