"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import StatsGrid from '@/components/dashboard/stats-grid';
import AttackMap from '@/components/dashboard/attack-map';
import ThreatCard from '@/components/dashboard/threat-card';
import PredictionCard from '@/components/dashboard/prediction-card';
import VulnerabilityTable from '@/components/dashboard/vulnerability-table';

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    // Simulate data loading
    const fetchData = async () => {
      try {
        // Replace with your actual API calls
        const response = await fetch('/api/dashboard/data');
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Cleanup function
    return () => {
      // Any cleanup logic here
    };
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Security Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8">
          <StatsGrid />
        </div>
        <div className="lg:col-span-4">
          <PredictionCard />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8">
          <AttackMap />
        </div>
        <div className="lg:col-span-4">
          <ThreatCard />
        </div>
      </div>
      
      <div className="mb-8">
        <VulnerabilityTable />
      </div>
    </div>
  );
}
