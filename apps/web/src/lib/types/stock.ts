/**
 * TypeScript interfaces for stock data and Alphavantage API responses
 */

// Alphavantage GLOBAL_QUOTE API Response
export interface AlphaVantageGlobalQuoteResponse {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
  'Error Message'?: string;
  'Note'?: string;
  'Information'?: string;
}

// Alphavantage TIME_SERIES_DAILY API Response (Free Tier)
export interface AlphaVantageTimeSeriesResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
  'Error Message'?: string;
  'Note'?: string;
  'Information'?: string; // For premium endpoint errors
}

// Alphavantage TIME_SERIES_INTRADAY API Response
export interface AlphaVantageIntradayResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Interval': string;
    '5. Output Size': string;
    '6. Time Zone': string;
  };
  [key: string]: any; // The time series key varies by interval (e.g., "Time Series (15min)")
  'Error Message'?: string;
  'Note'?: string;
  'Information'?: string;
}

// Processed stock quote data for components
export interface StockQuoteData {
  price: number;
  change: number;
  percentChange: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  prevClose: number;
  lastUpdated: string;
}

// Chart data point for Apache ECharts
export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Combined data for stock detail page
export interface StockDetailsData {
  symbol: string;
  companyName: string;
  quote: StockQuoteData;
  historicalData: ChartDataPoint[];
  lastUpdated: string;
}

// Stock information for page header
export interface StockInfo {
  symbol: string;
  companyName: string;
  lastUpdated: string;
}

// Search suggestion for autocomplete
export interface SearchSuggestion {
  symbol: string;
  name: string;
}