'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signalsApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface Signal {
  id: number;
  name: string;
  description: string;
  leftMetric: string;
  operator: string;
  rightMetric: string;
  signalType: string;
  isActive: boolean;
  isTriggered: boolean;
  lastTriggeredAt?: string;
  lastUpdated?: string;
  companyTicker: string;
  companyName: string;
  initialValues?: Record<string, any>;
}

interface SignalHistory {
  id: number;
  signalId: number;
  triggerData: Record<string, any>;
  triggeredAt: string;
}

export default function SignalDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [history, setHistory] = useState<SignalHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSignalDetails();
    }
  }, [id]);

  const fetchSignalDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get user's signals and find the specific one
      const signals = await signalsApi.getMySignals();
      const foundSignal = signals.find((s: Signal) => s.id === parseInt(id as string));
      
      if (!foundSignal) {
        setError('Signal not found');
        return;
      }
      
      setSignal(foundSignal);
      
      // Get signal history
      const historyData = await signalsApi.getHistory(parseInt(id as string));
      setHistory(historyData);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load signal details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSignal = async () => {
    if (!signal) return;
    
    try {
      await signalsApi.toggle(signal.id);
      fetchSignalDetails(); // Refresh the data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to toggle signal');
    }
  };

  const formatMetricValue = (value: any): string => {
    if (typeof value === 'number') {
      if (value >= 1e9) {
        return `$${(value / 1e9).toFixed(2)}B`;
      } else if (value >= 1e6) {
        return `$${(value / 1e6).toFixed(2)}M`;
      } else if (value >= 1e3) {
        return `$${(value / 1e3).toFixed(2)}K`;
      }
      return `$${value.toFixed(2)}`;
    }
    return String(value);
  };

  const getSignalTypeLabel = (type: string): string => {
    switch (type) {
      case 'metric_to_metric':
        return 'Metric vs Metric';
      case 'metric_to_value':
        return 'Metric vs Value';
      case 'metric_to_percentage':
        return 'Metric vs Percentage';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-4 text-lg font-medium text-gray-900">Error</h2>
              <p className="mt-2 text-gray-600">{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!signal) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900">Signal not found</h2>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{signal.name}</h1>
                <p className="text-gray-600">{signal.companyName} ({signal.companyTicker})</p>
              </div>
              <button
                onClick={handleToggleSignal}
                className={`px-4 py-2 rounded-md font-medium ${
                  signal.isActive
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {signal.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Signal Details Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Signal Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="text-sm text-gray-900">{signal.description}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Signal Type</dt>
                      <dd className="text-sm text-gray-900">{getSignalTypeLabel(signal.signalType)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          signal.isTriggered 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {signal.isTriggered ? (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Triggered
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Normal
                            </>
                          )}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Criteria</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Left Metric</dt>
                      <dd className="text-sm text-gray-900">{signal.leftMetric}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Operator</dt>
                      <dd className="text-sm text-gray-900">{signal.operator}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Right Metric/Value</dt>
                      <dd className="text-sm text-gray-900">{signal.rightMetric}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {signal.lastUpdated && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    Last updated: {new Date(signal.lastUpdated).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Trigger History */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Trigger History</h2>
              </div>
              
              {history.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No triggers yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This signal hasn't been triggered yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Triggered At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Metric Values
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((trigger) => (
                        <tr key={trigger.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(trigger.triggeredAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {trigger.triggerData.metrics && (
                              <div className="space-y-1">
                                {Object.entries(trigger.triggerData.metrics).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium">{key}:</span>
                                    <span>{formatMetricValue(value)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <div><strong>Ticker:</strong> {trigger.triggerData.ticker}</div>
                              <div><strong>Company:</strong> {trigger.triggerData.companyName}</div>
                              <div><strong>Last Updated:</strong> {new Date(trigger.triggerData.lastUpdated).toLocaleString()}</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 