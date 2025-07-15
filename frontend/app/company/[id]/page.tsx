'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { companiesApi } from '@/lib/api';
import { Company, FinancialData } from '@/types';
import MetricCard from '@/components/MetricCard';
import { ArrowLeft, RefreshCw, Building2, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function CompanyPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = Number(params.id);

  const [company, setCompany] = useState<Company | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const companyData = await companiesApi.getById(companyId);
      setCompany(companyData);
      
      // Try to fetch financial data, but don't fail if none exists
      try {
        const financialDataList = await companiesApi.getFinancialData(companyId);
        console.log('Financial data received:', financialDataList);
        setFinancialData(financialDataList);
      } catch (financialError) {
        console.error('Error fetching financial data:', financialError);
        setFinancialData([]);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load company data');
      console.error('Error fetching company data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Loading company data...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Company not found'}</p>
          <Link 
            href="/"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const latestData = financialData[0]?.data;
  const metrics = company.metricsToTrack;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center space-x-3 mb-2">
          <Building2 className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.ticker}</h1>
            <p className="text-gray-600">{company.name}</p>
          </div>
        </div>

        {/* Company Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <div className="text-2xl font-bold text-primary-600">{metrics.length}</div>
            <div className="text-sm text-gray-600">Metrics Tracked</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-green-600">
              {company.isActive ? 'Active' : 'Inactive'}
            </div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-blue-600">
              {financialData.length}
            </div>
            <div className="text-sm text-gray-600">Data Points</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-purple-600">
              {latestData ? new Date(latestData.lastUpdated).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Last Updated</div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {latestData && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Financial Metrics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {metrics.map((metric) => {
              const value = latestData.quoteData[metric] || latestData.financialData[metric];
              return (
                <MetricCard
                  key={metric}
                  metric={metric}
                  value={value}
                  lastUpdated={latestData.lastUpdated}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!latestData && (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No financial data available</h3>
          <p className="text-gray-600">
            Financial data for {company.ticker} will appear here once it's fetched by the system.
          </p>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center mt-8">
        <button
          onClick={fetchCompanyData}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center mx-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </button>
      </div>
    </div>
  );
} 