'use client';

import React from 'react';
import StatsGrid from './stats-grid'; // Using your original component

// Mock data for statistics
const mockKevStats = {
  totalVulnerabilities: 912,
  addedLast30Days: 24,
  addedLast90Days: 76,
  remediationDueSoon: 18,
  byVendor: {
    "Microsoft": 187,
    "Adobe": 84,
    "Oracle": 79,
    "Apple": 65,
    "Google": 52
  }
};

const mockVulnStats = {
  total: 347,
  critical: 48
};

const mockAttackStats = {
  recentCount: 128,
  predictedCount: 173
};

// Component that uses the StatsGrid with mock data
const StatsGridWithMockData: React.FC = () => {
  return (
    <div className="p-6 w-full">
      <h2 className="text-xl font-bold mb-2">Cybersecurity Statistics</h2>
      <p className="text-gray-400 text-sm mb-4">
        Key metrics from threat intelligence, vulnerability tracking, and attack monitoring.
      </p>
      
      {/* Render the StatsGrid with mock data */}
      <StatsGrid 
        kevStats={mockKevStats}
        vulnerabilityCount={mockVulnStats}
        attackStats={mockAttackStats}
      />
      
      {/* Additional context section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800/50 p-4 rounded-md border border-gray-700">
          <h3 className="text-sm font-bold mb-3">CISA KEV Distribution by Vendor</h3>
          <div className="space-y-2">
            {Object.entries(mockKevStats.byVendor || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([vendor, count], index) => (
                <div key={index}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{vendor}</span>
                    <span className="text-cyan-400">{count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-cyan-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / mockKevStats.totalVulnerabilities) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 text-xs text-gray-400">
            <p>Top 5 vendors account for 51% of all vulnerabilities in the CISA KEV catalog.</p>
          </div>
        </div>
        
        <div className="bg-gray-800/50 p-4 rounded-md border border-gray-700">
          <h3 className="text-sm font-bold mb-3">Trend Analysis</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="text-red-500 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <p className="text-gray-300">35% increase in critical vulnerabilities compared to previous quarter</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="text-red-500 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <p className="text-gray-300">28% increase in ransomware attacks targeting financial sector</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="text-green-500 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-gray-300">12% improvement in average remediation time for critical vulnerabilities</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="text-yellow-500 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              </div>
              <div>
                <p className="text-gray-300">Supply chain attacks remain consistent with previous quarter</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsGridWithMockData;