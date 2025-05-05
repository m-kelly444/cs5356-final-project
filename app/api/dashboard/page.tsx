import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';

// API clients
import { getKevCatalogStats } from '@/lib/api/cisa';
import { fetchRecentVulnerabilities, fetchCriticalVulnerabilities } from '@/lib/api/nvd';

// Database and models
import { db } from '@/lib/db';
import { vulnerabilities, cyberAttacks, predictions } from '@/lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

// ML prediction
import { getPredictionsForCommonSectors } from '@/lib/ml/prediction';

// UI Components
import ThreatMeter from '@/components/dashboard/threat-meter';
import AttackMap from '@/components/dashboard/attack-map';
import PredictionCard from '@/components/dashboard/prediction-card';
import StatsGrid from '@/components/dashboard/stats-grid';
import VulnerabilityTable from '@/components/dashboard/vulnerability-table';
import ThreatCard from '@/components/dashboard/threat-card';
import { CyberLoader } from '@/components/ui/loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Dashboard page server component
export default async function DashboardPage() {
  // Authentication check
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login?callbackUrl=/dashboard');
  }
  
  // Fetch data
  const [
    kevStats,
    recentVulnerabilities,
    criticalVulnerabilities,
    sectorPredictions,
    recentAttacks,
    activePredictions
  ] = await Promise.all([
    fetchKevStats(),
    fetchRecentVulns(),
    fetchCriticalVulns(),
    fetchSectorPredictions(),
    fetchRecentAttacks(),
    fetchActivePredictions(),
  ]);
  
  // Calculate global threat level
  const threatLevel = calculateGlobalThreatLevel(
    kevStats,
    recentVulnerabilities,
    criticalVulnerabilities,
    sectorPredictions
  );
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <h1 className="text-3xl font-bold neon-text">Cyber Threat Dashboard</h1>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Global threat level gauge */}
      <Card variant="cyber">
        <CardHeader>
          <CardTitle>Global Threat Level</CardTitle>
        </CardHeader>
        <CardContent>
          <ThreatMeter level={threatLevel} />
        </CardContent>
      </Card>
      
      {/* Key statistics */}
      <Card variant="cyber">
        <CardHeader>
          <CardTitle>Threat Intelligence Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<CyberLoader text="Loading statistics..." />}>
            <StatsGrid 
              kevStats={kevStats}
              vulnerabilityCount={{
                total: recentVulnerabilities.length,
                critical: criticalVulnerabilities.length
              }}
              attackStats={{
                recentCount: recentAttacks.length,
                predictedCount: activePredictions.length
              }}
            />
          </Suspense>
        </CardContent>
      </Card>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attack map */}
          <Card variant="cyber">
            <CardHeader>
              <CardTitle>Global Attack Map</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <Suspense fallback={<CyberLoader text="Generating attack map..." />}>
                <AttackMap attacks={recentAttacks} />
              </Suspense>
            </CardContent>
          </Card>
          
          {/* Recent threats */}
          <Card variant="cyber">
            <CardHeader>
              <CardTitle>Recent Threats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAttacks.slice(0, 5).map((attack) => (
                  <ThreatCard
                    key={attack.id}
                    threat={{
                      id: attack.id,
                      title: attack.title,
                      type: 'attack',
                      severity: attack.impactLevel,
                      description: attack.description,
                      date: attack.attackDate,
                      source: attack.source,
                      tags: [attack.attackType, attack.targetedSector, attack.targetedRegion],
                      details: {
                        attackType: attack.attackType,
                        targetedSector: attack.targetedSector,
                        targetedRegion: attack.targetedRegion,
                        threatActor: attack.threatActorId ? 'Known Threat Actor' : 'Unknown Actor'
                      }
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Sector risk analysis */}
          <Card variant="cyber">
            <CardHeader>
              <CardTitle>Sector Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-2 text-left">Sector</th>
                      <th className="px-4 py-2 text-left">Threat Level</th>
                      <th className="px-4 py-2 text-left">Likely Attack</th>
                      <th className="px-4 py-2 text-left">Probability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorPredictions.map((prediction, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="px-4 py-2">{prediction.sector}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block rounded-full h-3 w-12 ${getThreatLevelClass(prediction.threatLevel)}`}></span>
                          <span className="ml-2">{formatThreatLevel(prediction.threatLevel)}</span>
                        </td>
                        <td className="px-4 py-2">{formatAttackType(prediction.topAttackType)}</td>
                        <td className="px-4 py-2">{formatProbability(prediction.probability)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - 1/3 width on large screens */}
        <div className="space-y-6">
          {/* Predictions */}
          <Card variant="cyber">
            <CardHeader>
              <CardTitle>Threat Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activePredictions.map((prediction) => (
                  <PredictionCard 
                    key={prediction.id} 
                    prediction={{
                      id: prediction.id,
                      targetType: prediction.targetType,
                      targetValue: prediction.targetValue,
                      attackType: prediction.attackType || undefined,
                      probability: prediction.probability,
                      severity: prediction.severity || 0,
                      confidence: prediction.confidence,
                      generatedDate: prediction.generatedDate,
                      explanation: prediction.explanation || 'No explanation available'
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Critical vulnerabilities */}
          <Card variant="cyber">
            <CardHeader>
              <CardTitle>Critical Vulnerabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <VulnerabilityTable 
                vulnerabilities={formatVulnerabilities(criticalVulnerabilities)} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Data fetching functions
async function fetchKevStats() {
  try {
    // Get CISA KEV statistics
    return await getKevCatalogStats();
  } catch (error) {
    console.error('Error fetching KEV stats:', error);
    return {
      totalVulnerabilities: 0,
      addedLast30Days: 0,
      addedLast90Days: 0,
      byVendor: {},
      remediationDueSoon: 0,
    };
  }
}

async function fetchRecentVulns(days = 30, limit = 10) {
  try {
    // Get recent vulnerabilities from NVD
    return await fetchRecentVulnerabilities(days, limit);
  } catch (error) {
    console.error('Error fetching recent vulnerabilities:', error);
    return [];
  }
}

async function fetchCriticalVulns(limit = 5) {
  try {
    // Get critical vulnerabilities from NVD
    return await fetchCriticalVulnerabilities(limit);
  } catch (error) {
    console.error('Error fetching critical vulnerabilities:', error);
    return [];
  }
}

async function fetchSectorPredictions() {
  try {
    // Get predictions for common sectors
    return await getPredictionsForCommonSectors();
  } catch (error) {
    console.error('Error fetching sector predictions:', error);
    return [];
  }
}

async function fetchRecentAttacks(limit = 10) {
  try {
    // Get recent cyber attacks from the database
    return await db.select().from(cyberAttacks)
      .orderBy(desc(cyberAttacks.attackDate))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching recent attacks:', error);
    return [];
  }
}

async function fetchActivePredictions(limit = 5) {
  try {
    // Get active predictions from the database
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return await db.select().from(predictions)
      .where(
        and(
          gte(predictions.generatedDate, thirtyDaysAgo.getTime()),
          gte(predictions.probability, 0.6)
        )
      )
      .orderBy(desc(predictions.probability))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching active predictions:', error);
    return [];
  }
}

// Helper functions
function calculateGlobalThreatLevel(
  kevStats: any, 
  recentVulns: any[], 
  criticalVulns: any[],
  sectorPredictions: any[]
): number {
  // Factor 1: Recent vulnerabilities in KEV catalog
  const kevFactor = Math.min(100, kevStats.addedLast30Days * 5);
  
  // Factor 2: Number of critical vulnerabilities
  const criticalFactor = Math.min(100, criticalVulns.length * 20);
  
  // Factor 3: Average sector threat level
  const avgSectorThreat = sectorPredictions.reduce(
    (sum, pred) => sum + pred.threatLevel, 
    0
  ) / (sectorPredictions.length || 1);
  
  // Calculate weighted average
  const weightedSum = (
    (kevFactor * 0.3) + 
    (criticalFactor * 0.3) + 
    (avgSectorThreat * 0.4)
  );
  
  return Math.round(weightedSum);
}

function formatVulnerabilities(vulns: any[]) {
  return vulns.map(vuln => {
    const cve = vuln.cve;
    const cvssV3 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
    
    return {
      id: cve.id,
      title: cve.descriptions.find((d: any) => d.lang === 'en')?.value || '',
      severity: cvssV3?.baseSeverity || 'UNKNOWN',
      score: cvssV3?.baseScore || 0,
      published: new Date(cve.published).toLocaleDateString(),
      vector: cvssV3?.vectorString || '',
    };
  });
}

function getThreatLevelClass(level: number): string {
  if (level >= 75) return 'bg-gradient-to-r from-red-700 to-red-500';
  if (level >= 50) return 'bg-gradient-to-r from-orange-700 to-orange-500';
  if (level >= 25) return 'bg-gradient-to-r from-yellow-700 to-yellow-500';
  return 'bg-gradient-to-r from-green-700 to-green-500';
}

function formatThreatLevel(level: number): string {
  if (level >= 75) return 'Critical';
  if (level >= 50) return 'High';
  if (level >= 25) return 'Medium';
  return 'Low';
}

function formatAttackType(type: string): string {
  switch (type) {
    case 'ransomware': return 'Ransomware';
    case 'dataBreach': return 'Data Breach';
    case 'ddos': return 'DDoS Attack';
    case 'zeroDay': return 'Zero-Day Exploit';
    case 'phishing': return 'Phishing Campaign';
    case 'supplyChain': return 'Supply Chain Attack';
    case 'insiderThreat': return 'Insider Threat';
    default: return type || 'Unknown';
  }
}

function formatProbability(prob: number): string {
  return prob ? `${Math.round(prob * 100)}%` : 'N/A';
}