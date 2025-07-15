export interface Company {
  id: number;
  ticker: string;
  name: string;
  metricsToTrack: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialData {
  id: number;
  companyId: number;
  quoteData: Record<string, any>;
  financialData: Record<string, any>;
  lastUpdated: string;
  createdAt: string;
}

export interface Signal {
  id: number;
  name: string;
  description: string;
  leftMetric: string;
  operator: string;
  rightMetric: string;
  isActive: boolean;
  isTriggered: boolean;
  lastTriggeredAt?: string;
  companyTicker: string;
  companyName: string;
}

export interface MetricField {
  field: string;
  value: number;
  formattedValue: string;
}

export interface AvailableMetrics {
  marketData: MetricField[];
  financialMetrics: MetricField[];
  incomeStatement: MetricField[];
  balanceSheet: MetricField[];
  cashFlow: MetricField[];
}

export interface MetricCard {
  label: string;
  value: string | number;
  category: 'quote' | 'financial';
  formattedValue?: string;
} 