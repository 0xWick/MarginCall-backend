'use client';

import { Company } from '@/types';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface CompanyCardProps {
  company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link href={`/company/${company.id}`}>
      <div className="card p-6 cursor-pointer group">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
              {company.ticker}
            </h3>
            <p className="text-sm text-gray-600">{company.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
              {company.metricsToTrack.length} metrics
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Active</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              company.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {company.isActive ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Last Updated</span>
            <span className="text-gray-900">
              {new Date(company.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
} 