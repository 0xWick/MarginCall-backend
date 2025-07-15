import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

export function formatMetricValue(value: any, metric: string): string {
  if (value === null || value === undefined) return 'N/A';
  
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);
  
  // Format based on metric type
  if (metric.includes('Price') || metric.includes('Cap') || metric.includes('Cash') || metric.includes('Revenue')) {
    return formatCurrency(numValue);
  } else if (metric.includes('Ratio') || metric.includes('Margin') || metric.includes('Growth')) {
    return formatPercentage(numValue);
  } else if (metric.includes('PE') || metric.includes('Price')) {
    return numValue.toFixed(2);
  }
  
  return formatNumber(numValue);
}

export function getMetricCategory(metric: string): 'quote' | 'financial' {
  const quoteMetrics = ['regularMarketPrice', 'displayName', 'marketCap', 'volume', 'priceChange', 'priceChangePercent'];
  return quoteMetrics.includes(metric) ? 'quote' : 'financial';
} 