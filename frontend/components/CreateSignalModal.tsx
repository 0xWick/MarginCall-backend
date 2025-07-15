'use client';

import { useState, useEffect } from 'react';
import { signalsApi } from '@/lib/api';
import { AvailableMetrics, MetricField } from '@/types';
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3, Calculator } from 'lucide-react';

interface CreateSignalModalProps {
  onClose: () => void;
  onSignalCreated: () => void;
}

type Step = 'ticker' | 'metrics' | 'criteria' | 'confirm';

export default function CreateSignalModal({ onClose, onSignalCreated }: CreateSignalModalProps) {
  const [step, setStep] = useState<Step>('ticker');
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [availableMetrics, setAvailableMetrics] = useState<AvailableMetrics | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricField | null>(null);
  const [criteria, setCriteria] = useState({
    leftMetric: '',
    operator: '>',
    rightMetric: '',
    signalType: 'metric_to_metric' as 'metric_to_metric' | 'metric_to_value' | 'metric_to_percentage',
    customValue: '',
  });
  const [signalName, setSignalName] = useState('');
  const [signalDescription, setSignalDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const operators = [
    { value: '>', label: 'Greater Than', icon: TrendingUp },
    { value: '<', label: 'Less Than', icon: TrendingDown },
    { value: '=', label: 'Equal To', icon: BarChart3 },
    { value: '>=', label: 'Greater Than or Equal', icon: TrendingUp },
    { value: '<=', label: 'Less Than or Equal', icon: TrendingDown },
  ];

  const handleTickerSubmit = async () => {
    if (!ticker.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Get available metrics for the ticker
      const metrics = await signalsApi.getAvailableMetrics(ticker.toUpperCase());
      setAvailableMetrics(metrics);
      setCompanyName(ticker.toUpperCase()); // In a real app, you'd get the company name from the API
      setStep('metrics');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid ticker. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetricSelection = (metric: MetricField) => {
    setSelectedMetric(metric);
    setCriteria(prev => ({ ...prev, leftMetric: metric.field }));
  };

  const handleMetricsNext = () => {
    if (selectedMetric) {
      setStep('criteria');
    }
  };

  const handleCriteriaNext = () => {
    if (criteria.signalType === 'metric_to_metric') {
      if (!criteria.rightMetric) return;
    } else {
      if (!criteria.customValue) return;
    }
    setStep('confirm');
  };

  const handleCreateSignal = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Create signal with company - backend will fetch initial values automatically
      const signalData = {
        ticker: ticker.toUpperCase(),
        companyName: companyName,
        name: signalName,
        description: signalDescription,
        leftMetric: criteria.leftMetric,
        operator: criteria.operator,
        rightMetric: criteria.signalType === 'metric_to_metric' ? criteria.rightMetric : criteria.customValue,
        signalType: criteria.signalType,
      };

      await signalsApi.create(signalData);
      onSignalCreated();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create signal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getOperatorIcon = (operator: string) => {
    const op = operators.find(o => o.value === operator);
    return op ? op.icon : BarChart3;
  };

  const getMetricIcon = (field: string) => {
    if (field.includes('Price') || field.includes('Cap') || field.includes('Cash') || field.includes('Revenue')) {
      return <DollarSign className="w-4 h-4 text-green-600" />;
    } else if (field.includes('Ratio') || field.includes('Margin') || field.includes('Growth')) {
      return <Percent className="w-4 h-4 text-blue-600" />;
    } else {
      return <BarChart3 className="w-4 h-4 text-purple-600" />;
    }
  };

  const renderTickerStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Enter Company Ticker</h3>
      <p className="text-sm text-gray-600">Enter the stock ticker symbol to get started.</p>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ticker Symbol
        </label>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="e.g., AAPL, MSFT, GOOGL"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={handleTickerSubmit}
          disabled={!ticker.trim() || isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Validating...' : 'Next'}
        </button>
      </div>
    </div>
  );

  const renderMetricsStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select a Metric to Track</h3>
      <p className="text-sm text-gray-600">Choose one metric for {ticker.toUpperCase()} to monitor</p>
      
      {availableMetrics && (
        <div className="space-y-6">
          {Object.entries(availableMetrics).map(([category, metrics]) => (
            <div key={category}>
              <h4 className="font-medium text-gray-900 mb-3 capitalize">
                {category.replace(/([A-Z])/g, ' $1').trim()}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metrics.map((metric: MetricField) => (
                  <div
                    key={metric.field}
                    onClick={() => handleMetricSelection(metric)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedMetric?.field === metric.field
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getMetricIcon(metric.field)}
                        <span className="font-medium text-gray-900">{metric.field}</span>
                      </div>
                      {selectedMetric?.field === metric.field && (
                        <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {metric.formattedValue}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Current Value
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-between">
        <button
          onClick={() => setStep('ticker')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleMetricsNext}
          disabled={!selectedMetric}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderCriteriaStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Set Up Signal Criteria</h3>
      <p className="text-sm text-gray-600">Define when this signal should trigger.</p>
      
      {/* Selected Metric Display */}
      {selectedMetric && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getMetricIcon(selectedMetric.field)}
              <span className="font-medium text-gray-900">{selectedMetric.field}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{selectedMetric.formattedValue}</div>
              <div className="text-xs text-gray-500">Current Value</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signal Type
          </label>
          <select
            value={criteria.signalType}
            onChange={(e) => setCriteria(prev => ({ ...prev, signalType: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="metric_to_value">Metric vs Fixed Value</option>
            <option value="metric_to_percentage">Metric vs Percentage Change</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comparison Operator
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {operators.map((op) => {
              const Icon = op.icon;
              return (
                <button
                  key={op.value}
                  onClick={() => setCriteria(prev => ({ ...prev, operator: op.value }))}
                  className={`p-3 border-2 rounded-lg flex items-center space-x-2 transition-all ${
                    criteria.operator === op.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{op.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {criteria.signalType === 'metric_to_percentage' ? 'Percentage Change (%)' : 'Target Value'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={criteria.customValue}
              onChange={(e) => setCriteria(prev => ({ ...prev, customValue: e.target.value }))}
              placeholder={criteria.signalType === 'metric_to_percentage' ? '5' : '1000000'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {criteria.signalType === 'metric_to_percentage' && (
              <div className="absolute right-3 top-2.5 text-gray-400">%</div>
            )}
          </div>
          
          {/* Show calculation preview */}
          {selectedMetric && criteria.customValue && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calculator className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Calculation Preview</span>
              </div>
              <div className="text-sm text-gray-600">
                {criteria.signalType === 'metric_to_percentage' ? (
                  <>
                    <div>Current: {selectedMetric.formattedValue}</div>
                    <div>Target: {selectedMetric.value * (1 + parseFloat(criteria.customValue) / 100)}</div>
                    <div>Change: {criteria.customValue}%</div>
                  </>
                ) : (
                  <>
                    <div>Current: {selectedMetric.formattedValue}</div>
                    <div>Target: {criteria.customValue}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => setStep('metrics')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleCriteriaNext}
          disabled={!criteria.customValue}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Confirm Signal Details</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signal Name
          </label>
          <input
            type="text"
            value={signalName}
            onChange={(e) => setSignalName(e.target.value)}
            placeholder="e.g., Apple Cash Alert"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={signalDescription}
            onChange={(e) => setSignalDescription(e.target.value)}
            placeholder="Describe what this signal monitors..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Signal Summary</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Company:</strong> {ticker.toUpperCase()} ({companyName})</p>
            <p><strong>Metric:</strong> {selectedMetric?.field}</p>
            <p><strong>Current Value:</strong> {selectedMetric?.formattedValue}</p>
            <p><strong>Condition:</strong> {selectedMetric?.field} {criteria.operator} {criteria.customValue}{criteria.signalType === 'metric_to_percentage' ? '%' : ''}</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <div className="flex justify-between">
        <button
          onClick={() => setStep('criteria')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleCreateSignal}
          disabled={!signalName.trim() || !signalDescription.trim() || isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Signal'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Signal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {step === 'ticker' && renderTickerStep()}
        {step === 'metrics' && renderMetricsStep()}
        {step === 'criteria' && renderCriteriaStep()}
        {step === 'confirm' && renderConfirmStep()}
      </div>
    </div>
  );
} 