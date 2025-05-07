import { Metadata } from 'next';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';

// Data fetching
import { fetchCisaKevData, fetchNvdData } from '@/lib/utils/fetcher';

// Database and models
import { db } from '@/lib/db';
import { vulnerabilities } from '@/lib/db/schema';
import { desc, eq, gte } from 'drizzle-orm';

// UI Components
import VulnerabilityTable from '@/components/dashboard/vulnerability-table';
import ThreatCard from '@/components/dashboard/threat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Loader from '@/components/ui/loader';

export const metadata: Metadata = {
  title: 'Vulnerabilities | CyberPulse',
  description: 'Critical vulnerability intelligence and analysis',
};

export default async function VulnerabilitiesPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/vulnerabilities');
  }
  
  // Get recent critical vulnerabilities
  const criticalVulnerabilities = await db.select()
    .from(vulnerabilities)
    .where(gte(vulnerabilities.severity, 9.0))
    .orderBy(desc(vulnerabilities.publishedDate))
    .limit(10);
  
  // Get exploited vulnerabilities
  const exploitedVulnerabilities = await db.select()
    .from(vulnerabilities)
    .where(eq(vulnerabilities.exploitedInWild, 1))
    .orderBy(desc(vulnerabilities.publishedDate))
    .limit(10);
  
  // Format vulnerabilities for the UI
  const formattedCriticalVulns = criticalVulnerabilities.map(vuln => ({
    id: vuln.id,
    title: vuln.title,
    severity: getSeverityLabel(vuln.severity),
    score: vuln.severity,
    published: new Date(vuln.publishedDate).toLocaleDateString(),
    vector: JSON.parse(vuln.sourceData)?.metrics?.cvssMetricV31?.[0]?.cvssData?.vectorString || '',
  }));
  
  const formattedExploitedVulns = exploitedVulnerabilities.map(vuln => ({
    id: vuln.id,
    title: vuln.title,
    severity: getSeverityLabel(vuln.severity),
    score: vuln.severity,
    published: new Date(vuln.publishedDate).toLocaleDateString(),
    vector: JSON.parse(vuln.sourceData)?.metrics?.cvssMetricV31?.[0]?.cvssData?.vectorString || '',
  }));
  
  // Create featured vulnerabilities for cards
  const featuredVulnerabilities = exploitedVulnerabilities.slice(0, 3).map(vuln => {
    const sourceData = JSON.parse(vuln.sourceData);
    return {
      id: vuln.id,
      title: vuln.title,
      type: 'vulnerability' as const,
      severity: vuln.severity,
      description: vuln.description,
      date: vuln.(publishedDate instanceof Date && !isNaN(publishedDate.getTime()) ? safeToISOString(publishedDate) : null),
      source: 'CISA KEV',
      tags: ['Exploited', 'Critical'],
      details: {
        cveId: vuln.id,
        cvssScore: vuln.severity,
        affectedSystems: JSON.parse(vuln.affectedSystems || '[]'),
        attackVector: vuln.attackVector,
      },
    };
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 neon-text">Vulnerability Intelligence</h1>
          <p className="text-gray-400">
            Critical vulnerabilities from CISA KEV and the National Vulnerability Database
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">Critical (9.0-10.0)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <span className="text-sm">High (7.0-8.9)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm">Medium (4.0-6.9)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm">Low (0.1-3.9)</span>
          </div>
        </div>
      </div>
      
      {/* Featured vulnerability cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredVulnerabilities.map((vuln) => (
          <Suspense key={vuln.id} fallback={<Loader />}>
            <ThreatCard threat={vuln} />
          </Suspense>
        ))}
      </div>
      
      {/* Critical vulnerabilities */}
      <Card variant="cyber" className="mt-6">
        <CardHeader>
          <CardTitle>Critical Vulnerabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Loader text="Loading critical vulnerabilities..." />}>
            <VulnerabilityTable vulnerabilities={formattedCriticalVulns} />
          </Suspense>
        </CardContent>
      </Card>
      
      {/* Exploited vulnerabilities */}
      <Card variant="cyber" className="mt-6">
        <CardHeader>
          <CardTitle>Actively Exploited Vulnerabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Loader text="Loading exploited vulnerabilities..." />}>
            <VulnerabilityTable vulnerabilities={formattedExploitedVulns} />
          </Suspense>
        </CardContent>
      </Card>
      
      {/* Vulnerability statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card variant="cyber" hover="glow">
          <CardHeader>
            <CardTitle>CISA KEV Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Loader />}>
              <KevStats />
            </Suspense>
          </CardContent>
        </Card>
        
        <Card variant="cyber" hover="glow">
          <CardHeader>
            <CardTitle>Top Affected Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Loader />}>
              <VendorStats />
            </Suspense>
          </CardContent>
        </Card>
        
        <Card variant="cyber" hover="glow">
          <CardHeader>
            <CardTitle>Remediation Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Loader />}>
              <RemediationStats />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get severity label
function getSeverityLabel(score: number): string {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MEDIUM';
  return 'LOW';
}

// KEV Stats Component
async function KevStats() {
  const cisaData = await fetchCisaKevData({ stats: 'true' });
  const stats = cisaData.data;
  
  return (
    <ul className="space-y-2">
      <li className="flex justify-between items-center">
        <span className="text-gray-300">Total Vulnerabilities</span>
        <span className="text-cyan-400 font-mono">{stats.totalVulnerabilities}</span>
      </li>
      <li className="flex justify-between items-center">
        <span className="text-gray-300">Added Last 30 Days</span>
        <span className="text-cyan-400 font-mono">{stats.addedLast30Days}</span>
      </li>
      <li className="flex justify-between items-center">
        <span className="text-gray-300">Added Last 90 Days</span>
        <span className="text-cyan-400 font-mono">{stats.addedLast90Days}</span>
      </li>
      <li className="flex justify-between items-center">
        <span className="text-gray-300">Remediation Due Soon</span>
        <span className="text-cyan-400 font-mono">{stats.remediationDueSoon}</span>
      </li>
    </ul>
  );
}

// Vendor Stats Component
async function VendorStats() {
  const cisaData = await fetchCisaKevData({ stats: 'true' });
  const vendors = cisaData.data.byVendor || {};
  
  // Sort vendors by vulnerability count
  const sortedVendors = Object.entries(vendors)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);
  
  return (
    <ul className="space-y-2">
      {sortedVendors.map(([vendor, count]) => (
        <li key={vendor} className="flex justify-between items-center">
          <span className="text-gray-300 truncate">{vendor}</span>
          <span className="text-cyan-400 font-mono">{count as number}</span>
        </li>
      ))}
    </ul>
  );
}

// Remediation Stats Component
interface Vulnerability {
  cveID: string;
  dueDate: string;
}

async function RemediationStats() {
  const cisaData = await fetchCisaKevData();
  const now = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
  
  // Filter vulnerabilities with remediation due in the next 14 days
  const dueVulnerabilities = cisaData.vulnerabilities.filter((vuln: Vulnerability) => {
    const dueDate = new Date(vuln.dueDate);
    return dueDate >= now && dueDate <= twoWeeksFromNow;
  });
  
  if (dueVulnerabilities.length === 0) {
    return <p className="text-gray-400">No vulnerabilities due for remediation in the next 14 days.</p>;
  }
  
  return (
    <ul className="space-y-2">
      {dueVulnerabilities.slice(0, 5).map((vuln: Vulnerability) => (
        <li key={vuln.cveID} className="flex justify-between items-center">
          <span className="text-gray-300 truncate">{vuln.cveID}</span>
          <span className="text-cyan-400 font-mono">
            {new Date(vuln.dueDate).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
}