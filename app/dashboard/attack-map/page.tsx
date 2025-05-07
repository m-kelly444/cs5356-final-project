import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';

// Database and models
import { db } from '@/lib/db';
import { cyberAttacks, threatActors } from '@/lib/db/schema';
import { desc, gte } from 'drizzle-orm';

// UI Components
import AttackMap from '@/components/dashboard/attack-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Loader from '@/components/ui/loader';

export const metadata: Metadata = {
  title: 'Attack Map | CyberPulse',
  description: 'Real-time visualization of cyber attacks',
};

export default async function AttackMapPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/attack-map');
  }
  
  // Get recent attacks
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentAttacks = await db.query.cyberAttacks.findMany({
    where: gte(cyberAttacks.attackDate, thirtyDaysAgo.getTime()),
    orderBy: [desc(cyberAttacks.attackDate)],
    limit: 100,
    with: {
      threatActor: true,
    },
  });
  
  // Get statistics
  const attacksByRegion = recentAttacks.reduce((acc, attack) => {
    const region = attack.targetedRegion;
    if (!acc[region]) {
      acc[region] = 0;
    }
    acc[region]++;
    return acc;
  }, {} as Record<string, number>);
  
  const attacksByType = recentAttacks.reduce((acc, attack) => {
    const type = attack.attackType;
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type]++;
    return acc;
  }, {} as Record<string, number>);
  
  const attacksBySector = recentAttacks.reduce((acc, attack) => {
    const sector = attack.targetedSector;
    if (!acc[sector]) {
      acc[sector] = 0;
    }
    acc[sector]++;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 neon-text">Global Attack Map</h1>
          <p className="text-gray-400">
            Real-time visualization of cyber attacks based on threat intelligence data
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">Critical</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <span className="text-sm">High</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm">Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm">Low</span>
          </div>
        </div>
      </div>
      
      {/* Main attack map visualization */}
      <div className="cyber-card border-cyan-500/30 p-0 h-[500px] overflow-hidden">
        <Suspense fallback={<Loader text="Loading attack data..." />}>
          <AttackMap attacks={recentAttacks} />
        </Suspense>
      </div>
      
      {/* Attack statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Attacks by Region */}
        <Card variant="cyber" hover="glow">
          <CardHeader>
            <CardTitle>Attacks by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(attacksByRegion)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([region, count]) => (
                  <li key={region} className="flex justify-between items-center">
                    <span className="text-gray-300">{region}</span>
                    <span className="text-cyan-400 font-mono">{count}</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
        
        {/* Attacks by Type */}
        <Card variant="cyber" hover="glow">
          <CardHeader>
            <CardTitle>Attacks by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(attacksByType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <li key={type} className="flex justify-between items-center">
                    <span className="text-gray-300">{type}</span>
                    <span className="text-cyan-400 font-mono">{count}</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
        
        {/* Attacks by Sector */}
        <Card variant="cyber" hover="glow">
          <CardHeader>
            <CardTitle>Attacks by Sector</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(attacksBySector)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([sector, count]) => (
                  <li key={sector} className="flex justify-between items-center">
                    <span className="text-gray-300">{sector}</span>
                    <span className="text-cyan-400 font-mono">{count}</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent attacks table */}
      <Card variant="cyber" className="mt-6">
        <CardHeader>
          <CardTitle>Recent Attacks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Target</th>
                  <th className="px-4 py-2 text-left">Attack Type</th>
                  <th className="px-4 py-2 text-left">Threat Actor</th>
                  <th className="px-4 py-2 text-left">Impact</th>
                </tr>
              </thead>
              <tbody>
                {recentAttacks.slice(0, 10).map((attack) => (
                  <tr key={attack.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-2">
                      {new Date(attack.attackDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {attack.targetedSector} ({attack.targetedRegion})
                    </td>
                    <td className="px-4 py-2">{attack.attackType}</td>
                    <td className="px-4 py-2">{attack.threatActor?.name || 'Unknown'}</td>
                    <td className="px-4 py-2">
                      <span 
                        className={`inline-block rounded-full px-2 py-1 text-xs ${getImpactClass(attack.impactLevel)}`}
                      >
                        {formatImpactLevel(attack.impactLevel)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getImpactClass(level: number): string {
  if (level >= 8) return 'bg-red-900/70 text-red-200';
  if (level >= 5) return 'bg-yellow-900/70 text-yellow-200';
  return 'bg-green-900/70 text-green-200';
}

function formatImpactLevel(level: number): string {
  if (level >= 8) return 'Critical';
  if (level >= 5) return 'High';
  if (level >= 3) return 'Medium';
  return 'Low';
}// TODO: Manually add suppressHydrationWarning to elements with dates
// TODO: Manually add suppressHydrationWarning to elements with dates
