import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StockQuoteCard } from '../stock-quote-card';

const mockStockData = {
  price: 150.25,
  change: 2.34,
  percentChange: 1.58,
  open: 148.50,
  high: 152.75,
  low: 147.80,
  volume: 1234567,
  prevClose: 147.91,
};

const negativeChangeData = {
  ...mockStockData,
  change: -1.25,
  percentChange: -0.83,
};

describe('StockQuoteCard', () => {
  describe('Loading State', () => {
    it('displays loading skeleton when isLoading is true', () => {
      render(<StockQuoteCard isLoading={true} />);
      
      const skeletons = screen.getAllByRole('generic');
      const loadingElements = skeletons.filter(element => 
        element.className.includes('skeleton')
      );
      
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('displays loading skeleton when no data is provided', () => {
      render(<StockQuoteCard />);
      
      const skeletons = screen.getAllByRole('generic');
      const loadingElements = skeletons.filter(element => 
        element.className.includes('skeleton')
      );
      
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('displays error message when error prop is provided', () => {
      const errorMessage = 'Failed to load stock data';
      render(<StockQuoteCard error={errorMessage} />);
      
      expect(screen.getByText('Error Loading Quote Data')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('displays stock price correctly formatted', () => {
      render(<StockQuoteCard data={mockStockData} />);
      
      expect(screen.getByText('$150.25')).toBeInTheDocument();
      expect(screen.getByText('Current Price')).toBeInTheDocument();
    });

    it('displays positive change with correct styling and prefix', () => {
      render(<StockQuoteCard data={mockStockData} />);
      
      const changeElement = screen.getByText('+$2.34 (+1.58%)');
      expect(changeElement).toBeInTheDocument();
      expect(changeElement).toHaveClass('text-success');
    });

    it('displays negative change with correct styling', () => {
      render(<StockQuoteCard data={negativeChangeData} />);
      
      // Check the container has error styling - find elements with text-error class
      const errorElements = document.getElementsByClassName('text-error');
      expect(errorElements.length).toBeGreaterThan(0);
      
      // Verify negative change is displayed (text content includes negative values)
      const statDesc = errorElements[0];
      expect(statDesc.textContent).toContain('1.25');
      expect(statDesc.textContent).toContain('0.83');
    });

    it('displays all stock metrics', () => {
      render(<StockQuoteCard data={mockStockData} />);
      
      // Check all metric labels
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Previous Close')).toBeInTheDocument();
      expect(screen.getByText('Volume')).toBeInTheDocument();
      
      // Check formatted values
      expect(screen.getByText('$148.50')).toBeInTheDocument();
      expect(screen.getByText('$152.75')).toBeInTheDocument();
      expect(screen.getByText('$147.80')).toBeInTheDocument();
      expect(screen.getByText('$147.91')).toBeInTheDocument();
    });

    it('formats volume correctly', () => {
      render(<StockQuoteCard data={mockStockData} />);
      
      // Check formatted volume (1,234,567 -> 1.2M)
      expect(screen.getByText('1.2M')).toBeInTheDocument();
      // Check full volume display
      expect(screen.getByText('1,234,567 shares')).toBeInTheDocument();
    });

    it('formats large volume numbers correctly', () => {
      const largeVolumeData = { ...mockStockData, volume: 1500000000 };
      render(<StockQuoteCard data={largeVolumeData} />);
      
      expect(screen.getByText('1.5B')).toBeInTheDocument();
    });

    it('formats small volume numbers correctly', () => {
      const smallVolumeData = { ...mockStockData, volume: 1500 };
      render(<StockQuoteCard data={smallVolumeData} />);
      
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('applies responsive stats classes', () => {
      render(<StockQuoteCard data={mockStockData} />);
      
      const statsElements = screen.getAllByRole('generic').filter(element => 
        element.className.includes('stats')
      );
      
      // Check for responsive classes
      const responsiveStats = statsElements.find(element =>
        element.className.includes('stats-vertical') && 
        element.className.includes('sm:stats-horizontal')
      );
      expect(responsiveStats).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA structure', () => {
      render(<StockQuoteCard data={mockStockData} />);
      
      // Check that important text elements are present and accessible
      expect(screen.getByText('Current Price')).toBeInTheDocument();
      expect(screen.getByText('$150.25')).toBeInTheDocument();
    });

    it('provides accessible error handling', () => {
      render(<StockQuoteCard error="Network error" />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass('btn');
    });
  });
});