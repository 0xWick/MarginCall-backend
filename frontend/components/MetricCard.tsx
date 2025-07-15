'use client';

import { formatMetricValue, getMetricCategory } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3 } from 'lucide-react';

interface MetricCardProps {
  metric: string;
  value: any;
  lastUpdated?: string;
}

export default function MetricCard({ metric, value, lastUpdated }: MetricCardProps) {
  const formattedValue = formatMetricValue(value, metric);
  const category = getMetricCategory(metric);
  
  const getIcon = () => {
    if (metric.includes('Price') || metric.includes('Cap') || metric.includes('Cash')) {
      return <DollarSign className="w-5 h-5 text-green-600" />;
    } else if (metric.includes('Ratio') || metric.includes('Margin') || metric.includes('Growth')) {
      return <Percent className="w-5 h-5 text-blue-600" />;
    } else {
      return <BarChart3 className="w-5 h-5 text-purple-600" />;
    }
  };

  const getCategoryColor = () => {
    return category === 'quote' 
      ? 'from-blue-50 to-indigo-50 border-blue-200' 
      : 'from-green-50 to-emerald-50 border-green-200';
  };

  return (
    <div className={`metric-card ${getCategoryColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className="metric-label">{metric}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          category === 'quote' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {category}
        </span>
      </div>
      
      <div className="metric-value mb-2">
        {formattedValue}
      </div>
      
      {lastUpdated && (
        <div className="text-xs text-gray-500">
          Updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
} 