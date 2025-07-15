'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signalsApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import CreateSignalModal from '@/components/CreateSignalModal';
import { useRouter } from 'next/navigation';

interface Signal {
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

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      const data = await signalsApi.getMySignals();
      setSignals(data);
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSignal = async (signalId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation when clicking the toggle button
    try {
      await signalsApi.toggle(signalId);
      fetchSignals(); // Refresh the list
    } catch (error) {
      console.error('Error toggling signal:', error);
    }
  };

  const handleSignalClick = (signalId: number) => {
    router.push(`/signals/${signalId}`);
  };

  const handleSignalCreated = () => {
    setShowCreateModal(false);
    fetchSignals(); // Refresh the list
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Create Signal
                </button>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
              {signals.length === 0 ? (
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No signals yet</h3>
                  <p className="text-gray-600 mb-4">Create your first signal to start monitoring financial metrics.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Create Your First Signal
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Signals</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {signals.map((signal) => (
                      <div
                        key={signal.id}
                        onClick={() => handleSignalClick(signal.id)}
                        className={`bg-white rounded-lg shadow p-6 border-l-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                          signal.isTriggered ? 'border-red-500' : 'border-green-500'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{signal.name}</h3>
                            <p className="text-sm text-gray-600">{signal.description}</p>
                          </div>
                          <button
                            onClick={(e) => handleToggleSignal(signal.id, e)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              signal.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {signal.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">{signal.leftMetric}</span>
                            <span className="mx-2">{signal.operator}</span>
                            <span className="font-medium">{signal.rightMetric}</span>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Company: {signal.companyTicker} ({signal.companyName})
                          </div>
                          
                          {signal.isTriggered && signal.lastTriggeredAt && (
                            <div className="text-xs text-red-600">
                              Last triggered: {new Date(signal.lastTriggeredAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Create Signal Modal */}
        {showCreateModal && (
          <CreateSignalModal
            onClose={() => setShowCreateModal(false)}
            onSignalCreated={handleSignalCreated}
          />
        )}
      </div>
    </ProtectedRoute>
  );
} 