import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PriceChartContainer } from '../price-chart-container';

describe('PriceChartContainer', () => {
  const defaultProps = {
    symbol: 'AAPL',
  };

  describe('Loading State', () => {
    it('displays loading skeleton when isLoading is true', () => {
      render(<PriceChartContainer {...defaultProps} isLoading={true} />);
      
      const skeletons = screen.getAllByRole('generic');
      const loadingElements = skeletons.filter(element => 
        element.className.includes('skeleton')
      );
      
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('shows multiple skeleton elements for chart structure', () => {
      render(<PriceChartContainer {...defaultProps} isLoading={true} />);
      
      // Check for different skeleton sizes representing different chart parts
      const skeletons = screen.getAllByRole('generic');
      const chartSkeleton = skeletons.find(element => 
        element.className.includes('skeleton') && element.className.includes('h-64')
      );
      
      expect(chartSkeleton).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when error prop is provided', () => {
      const errorMessage = 'Failed to load chart data';
      render(<PriceChartContainer {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText('Chart Unavailable')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('applies error styling correctly', () => {
      render(<PriceChartContainer {...defaultProps} error="Network error" />);
      
      const errorCard = screen.getByText('Chart Unavailable').closest('.card');
      expect(errorCard).toHaveClass('bg-error/10');
      expect(errorCard).toHaveClass('border-error/20');
    });
  });

  describe('Placeholder Display', () => {
    it('displays chart placeholder with symbol', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      expect(screen.getByText('Price Chart')).toBeInTheDocument();
      expect(screen.getByText(`Historical price data for ${defaultProps.symbol}`)).toBeInTheDocument();
    });

    it('shows Apache ECharts ready badge', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      expect(screen.getByText('Apache ECharts Ready')).toBeInTheDocument();
    });

    it('displays interactive chart message', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      expect(screen.getByText('Interactive Chart Coming Soon')).toBeInTheDocument();
      expect(screen.getByText(/This container is prepared for Apache ECharts integration/)).toBeInTheDocument();
    });

    it('shows timeframe buttons', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5D' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1Y' })).toBeInTheDocument();
    });

    it('shows active state for default timeframe', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      const oneDayButton = screen.getByRole('button', { name: '1D' });
      expect(oneDayButton).toHaveClass('btn-active');
    });

    it('displays chart control badges', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      expect(screen.getByText('Candlestick')).toBeInTheDocument();
      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByText('Moving Averages')).toBeInTheDocument();
    });

    it('shows last updated timestamp', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('renders chart placeholder visual elements', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      // Check for SVG chart placeholder (SVG doesn't have img role by default)
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      
      // Check for chart emoji
      expect(screen.getByText('📈')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive container classes', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      const chartContainer = screen.getByText('Interactive Chart Coming Soon').closest('.card-body');
      const chart = chartContainer?.querySelector('.h-80');
      expect(chart).toHaveClass('lg:h-96');
    });

    it('uses responsive flex layout for header', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      const header = screen.getByText('Price Chart').closest('div');
      const parentDiv = header?.parentElement;
      expect(parentDiv).toHaveClass('sm:flex-row');
      expect(parentDiv).toHaveClass('sm:items-center');
      expect(parentDiv).toHaveClass('sm:justify-between');
    });

    it('applies responsive controls layout', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      // Find the timestamp text to locate the chart controls container
      const timestampDiv = screen.getByText(/Last updated:/).closest('div');
      const controlsSection = timestampDiv?.parentElement;
      
      // Check for responsive flex classes in the chart controls container
      expect(controlsSection).toHaveClass('flex');
      expect(controlsSection).toHaveClass('flex-col');
      expect(controlsSection).toHaveClass('sm:flex-row');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to wrapper', () => {
      const customClass = 'custom-chart-class';
      const { container } = render(
        <PriceChartContainer {...defaultProps} className={customClass} />
      );
      
      expect(container.firstChild).toHaveClass(customClass);
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles and labels', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check timeframe buttons are accessible
      expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5D' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1Y' })).toBeInTheDocument();
    });

    it('provides accessible error recovery', () => {
      render(<PriceChartContainer {...defaultProps} error="Network error" />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('has descriptive text for screen readers', () => {
      render(<PriceChartContainer {...defaultProps} />);
      
      expect(screen.getByText(`Historical price data for ${defaultProps.symbol}`)).toBeInTheDocument();
      expect(screen.getByText(/This container is prepared for Apache ECharts integration/)).toBeInTheDocument();
    });
  });
});