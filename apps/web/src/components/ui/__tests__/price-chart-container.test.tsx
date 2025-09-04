import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { PriceChartContainer } from '../price-chart-container';
import type { ChartDataPoint } from '@/lib/types/stock';

// Mock echarts-for-react
vi.mock('echarts-for-react', () => ({
  default: React.forwardRef<any, { option?: any; style?: any; className?: string }>(
    function MockedECharts({ option, style, className }, ref) {
      return (
        <div 
          ref={ref}
          data-testid="echarts-mock"
          data-option={JSON.stringify(option)}
          style={style}
          className={className}
        >
          Mocked ECharts Component
        </div>
      );
    }
  )
}));

// Mock data for testing
const mockHistoricalData: ChartDataPoint[] = [
  {
    date: '2023-12-01',
    open: 150.0,
    high: 155.0,
    low: 149.0,
    close: 152.5,
    volume: 1000000
  },
  {
    date: '2023-12-02',
    open: 152.5,
    high: 157.0,
    low: 151.0,
    close: 156.2,
    volume: 1200000
  },
  {
    date: '2023-12-03',
    open: 156.2,
    high: 158.5,
    low: 154.0,
    close: 157.8,
    volume: 900000
  },
  {
    date: '2023-12-04',
    open: 157.8,
    high: 160.0,
    low: 157.0,
    close: 159.3,
    volume: 1100000
  },
  {
    date: '2023-12-05',
    open: 159.3,
    high: 162.0,
    low: 158.5,
    close: 161.7,
    volume: 1300000
  }
];

describe('PriceChartContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading skeleton when isLoading is true', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          isLoading={true}
        />
      );

      // Check for skeleton elements rather than specific text during loading
      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should render error display when error is provided', () => {
      const errorMessage = 'Failed to fetch stock data';
      
      render(
        <PriceChartContainer
          symbol="AAPL"
          error={errorMessage}
        />
      );

      expect(screen.getByText('Chart Unavailable')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('No Data State', () => {
    it('should render no data message when historicalData is empty', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={[]}
        />
      );

      expect(screen.getByText('No Chart Data Available')).toBeInTheDocument();
      expect(screen.getByText('Historical price data for AAPL is not available at this time')).toBeInTheDocument();
      expect(screen.getByText('Awaiting Data')).toBeInTheDocument();
    });

    it('should render no data message when historicalData is undefined', () => {
      render(
        <PriceChartContainer
          symbol="TSLA"
        />
      );

      expect(screen.getByText('No Chart Data Available')).toBeInTheDocument();
      expect(screen.getByText('Historical price data for TSLA is not available at this time')).toBeInTheDocument();
    });
  });

  describe('Chart Rendering with Data', () => {
    it('should render chart component with valid data', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
        />
      );

      expect(screen.getByText('Price Chart')).toBeInTheDocument();
      expect(screen.getByText('Historical price data for AAPL')).toBeInTheDocument();
      expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
    });

    it('should render time period selector buttons', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
        />
      );

      expect(screen.getByText('1D')).toBeInTheDocument();
      expect(screen.getByText('5D')).toBeInTheDocument();
      expect(screen.getByText('1M')).toBeInTheDocument();
      expect(screen.getByText('1Y')).toBeInTheDocument();
    });

    it('should have default selected period as 1M', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
        />
      );

      const button1M = screen.getByText('1M');
      expect(button1M).toHaveClass('btn-active');
    });

    it('should change active period when button is clicked', () => {
      const mockOnPeriodChange = vi.fn();
      
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
          period="1M"
          onPeriodChange={mockOnPeriodChange}
        />
      );

      const button1D = screen.getByText('1D');
      const button1M = screen.getByText('1M');

      expect(button1M).toHaveClass('btn-active');
      expect(button1D).not.toHaveClass('btn-active');

      fireEvent.click(button1D);

      expect(mockOnPeriodChange).toHaveBeenCalledWith('1D');
    });

    it('should render chart info badges', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
        />
      );

      expect(screen.getByText('Live Data')).toBeInTheDocument();
      expect(screen.getByText('Close Price')).toBeInTheDocument();
      expect(screen.getByText('5 data points')).toBeInTheDocument();
    });

    it('should display price range information', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
        />
      );

      // The range should show min and max close prices from the data
      expect(screen.getByText('Range: $152.50 - $161.70')).toBeInTheDocument();
    });
  });

  describe('Period Display and Interaction', () => {
    it('should display correct data count for provided data', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
          period="1M"
        />
      );

      // Should show the actual data count provided (5 data points from mockHistoricalData)
      expect(screen.getByText('5 data points')).toBeInTheDocument();
    });

    it('should highlight the correct period button', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
          period="1Y"
        />
      );

      const button1Y = screen.getByText('1Y');
      const button1M = screen.getByText('1M');

      expect(button1Y).toHaveClass('btn-active');
      expect(button1M).not.toHaveClass('btn-active');
    });

    it('should call onPeriodChange when period button is clicked', () => {
      const mockOnPeriodChange = vi.fn();
      
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
          period="1M"
          onPeriodChange={mockOnPeriodChange}
        />
      );

      const button5D = screen.getByText('5D');
      fireEvent.click(button5D);

      expect(mockOnPeriodChange).toHaveBeenCalledWith('5D');
    });
  });

  describe('Chart Configuration', () => {
    it('should pass correct options to ECharts component', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
        />
      );

      const echartsElement = screen.getByTestId('echarts-mock');
      const optionData = echartsElement.getAttribute('data-option');
      const option = JSON.parse(optionData!);

      expect(option).toHaveProperty('xAxis');
      expect(option).toHaveProperty('yAxis');
      expect(option).toHaveProperty('series');
      expect(option).toHaveProperty('tooltip');
      expect(option).toHaveProperty('grid');

      // Check if series data contains close prices
      expect(option.series[0].data).toEqual([152.5, 156.2, 157.8, 159.3, 161.7]);
      
      // Check if xAxis data contains dates
      expect(option.xAxis.data).toEqual(['2023-12-01', '2023-12-02', '2023-12-03', '2023-12-04', '2023-12-05']);
    });

    it('should have correct chart styling', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
        />
      );

      const echartsElement = screen.getByTestId('echarts-mock');
      const style = echartsElement.getAttribute('style');
      
      expect(style).toContain('height: 400px');
      expect(style).toContain('width: 100%');
    });
  });

  describe('Component Props', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-chart-class';
      const { container } = render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
          className={customClass}
        />
      );

      expect(container.firstChild).toHaveClass(customClass);
    });

    it('should display correct symbol in chart header', () => {
      const symbol = 'MSFT';
      
      render(
        <PriceChartContainer
          symbol={symbol}
          historicalData={mockHistoricalData}
        />
      );

      expect(screen.getByText(`Historical price data for ${symbol}`)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point correctly', () => {
      const singleDataPoint = [mockHistoricalData[0]];
      
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={singleDataPoint}
        />
      );

      expect(screen.getByText('1 data points')).toBeInTheDocument();
      expect(screen.getByText('Range: $152.50 - $152.50')).toBeInTheDocument();
    });

    it('should handle data with same close prices', () => {
      const sameCloseData = mockHistoricalData.map(item => ({
        ...item,
        close: 150.0
      }));
      
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={sameCloseData}
        />
      );

      expect(screen.getByText('Range: $150.00 - $150.00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles for period selectors', () => {
      render(
        <PriceChartContainer
          symbol="AAPL"
          historicalData={mockHistoricalData}
        />
      );

      const buttons = screen.getAllByRole('button');
      const periodButtons = buttons.filter(btn => 
        ['1D', '5D', '1M', '1Y'].includes(btn.textContent || '')
      );

      expect(periodButtons).toHaveLength(4);
      // Check that buttons are actually clickable
      periodButtons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });
});