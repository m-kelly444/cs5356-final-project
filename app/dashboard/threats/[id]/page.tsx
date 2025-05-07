import { useState, useEffect } from 'react';import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import Link from 'next/link';

// Database and models
import { db } from '@/lib/db';
import { cyberAttacks, threatActors, predictions, vulnerabilities } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Components
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Target, AlertTriangle, Shield, Globe, ExternalLink } from 'lucide-react';

// Helper function to format date
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }) {
  const id = params.id;
  
  // Try to find this threat in different tables
  const attack = await db.query.cyberAttacks.findFirst({
    where: eq(cyberAttacks.id, id),
  });
  
  const prediction = await db.query.predictions.findFirst({
    where: eq(predictions.id, id),
  });
  
  const vulnerability = await db.query.vulnerabilities.findFirst({
    where: eq(vulnerabilities.id, id),
  });
  
  // Get the title from whichever entity was found
  const title = attack?.title || prediction?.targetValue || vulnerability?.title || 'Threat Details';
  
  return {
    title: `${title} | CyberPulse`,
    description: 'Detailed threat information',
  };
}

export default async function ThreatDetailPage({ params }: { params: { id: string } }) {
  // Authentication check
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return notFound();
  }
  
  const id = params.id;
  
  // Try to find this threat in different tables
  const attack = await db.query.cyberAttacks.findFirst({
    where: eq(cyberAttacks.id, id),
    with: {
      threatActor: true,
    },
  });
  
  const prediction = await db.query.predictions.findFirst({
    where: eq(predictions.id, id),
    with: {
      model: true,
    },
  });
  
  const vulnerability = await db.query.vulnerabilities.findFirst({
    where: eq(vulnerabilities.id, id),
  });
  
  // If not found in any table, return 404
  if (!attack && !prediction && !vulnerability) {
    return notFound();
  }
  
  // Determine the type of threat
  const threatType = attack ? 'attack' : prediction ? 'prediction' : 'vulnerability';
  
  // Get related vulnerabilities if this is an attack
  let relatedVulnerabilities = [];
  if (attack?.vulnerabilitiesExploited) {
    try {
      const vulnIds = JSON.parse(attack.vulnerabilitiesExploited);
      if (Array.isArray(vulnIds) && vulnIds.length > 0) {
        relatedVulnerabilities = await db
          .select()
          .from(vulnerabilities)
          .where(vulnIds.map(id => eq(vulnerabilities.id, id)))
          .limit(5);
      }
    } catch (error) {
      console.error('Error parsing vulnerabilities:', error);
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/threats">
          <Button variant="cyberGhost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Threats
          </Button>
        </Link>
        <h1 className="text-3xl font-bold neon-text">
          {threatType === 'attack' ? 'Cyber Attack Details' : 
           threatType === 'prediction' ? 'Threat Prediction Details' : 
           'Vulnerability Details'}
        </h1>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main information card */}
          <Card variant="cyber">
            <CardHeader>
              <CardTitle className="text-2xl">
                {attack?.title || 
                 prediction ? `Predicted ${prediction.attackType || 'Attack'} on ${prediction.targetValue}` : 
                 vulnerability?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metadata grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Date */}
                <div className="flex items-start space-x-2">
                  <Calendar className="h-5 w-5 text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold">Date</div>
                    <div className="text-sm text-gray-400">
                      {attack ? formatDate(attack.attackDate) : 
                       prediction ? formatDate(prediction.generatedDate) : 
                       vulnerability ? formatDate(vulnerability.publishedDate) : ''}
                    </div>
                  </div>
                </div>
                
                {/* Type-specific metadata */}
                {attack && (
                  <>
                    {/* Threat Actor */}
                    <div className="flex items-start space-x-2">
                      <User className="h-5 w-5 text-fuchsia-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Threat Actor</div>
                        <div className="text-sm text-gray-400">
                          {attack.threatActor?.name || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Attack Type */}
                    <div className="flex items-start space-x-2">
                      <Shield className="h-5 w-5 text-red-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Attack Type</div>
                        <div className="text-sm text-gray-400">{attack.attackType}</div>
                      </div>
                    </div>
                    
                    {/* Target Sector */}
                    <div className="flex items-start space-x-2">
                      <Target className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Target Sector</div>
                        <div className="text-sm text-gray-400">{attack.targetedSector}</div>
                      </div>
                    </div>
                    
                    {/* Target Region */}
                    <div className="flex items-start space-x-2">
                      <Globe className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Target Region</div>
                        <div className="text-sm text-gray-400">{attack.targetedRegion}</div>
                      </div>
                    </div>
                    
                    {/* Impact Level */}
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Impact Level</div>
                        <div className="text-sm text-gray-400">{attack.impactLevel.toFixed(1)}/10</div>
                      </div>
                    </div>
                  </>
                )}
                
                {prediction && (
                  <>
                    {/* Probability */}
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Probability</div>
                        <div className="text-sm text-gray-400">{(prediction.probability * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    {/* Confidence */}
                    <div className="flex items-start space-x-2">
                      <Shield className="h-5 w-5 text-cyan-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Confidence</div>
                        <div className="text-sm text-gray-400">{(prediction.confidence * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    {/* Target Type */}
                    <div className="flex items-start space-x-2">
                      <Target className="h-5 w-5 text-fuchsia-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Target Type</div>
                        <div className="text-sm text-gray-400">{prediction.targetType}</div>
                      </div>
                    </div>
                    
                    {/* Attack Type */}
                    <div className="flex items-start space-x-2">
                      <Shield className="h-5 w-5 text-red-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Attack Type</div>
                        <div className="text-sm text-gray-400">{prediction.attackType || 'Unknown'}</div>
                      </div>
                    </div>
                    
                    {/* Severity */}
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Severity</div>
                        <div className="text-sm text-gray-400">{prediction.severity?.toFixed(1) || 'N/A'}/10</div>
                      </div>
                    </div>
                  </>
                )}
                
                {vulnerability && (
                  <>
                    {/* CVE ID */}
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">CVE ID</div>
                        <div className="text-sm text-gray-400 font-mono">{vulnerability.id}</div>
                      </div>
                    </div>
                    
                    {/* Severity */}
                    <div className="flex items-start space-x-2">
                      <Shield className="h-5 w-5 text-red-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Severity</div>
                        <div className="text-sm text-gray-400">{vulnerability.severity.toFixed(1)}/10</div>
                      </div>
                    </div>
                    
                    {/* Exploited in Wild */}
                    <div className="flex items-start space-x-2">
                      <Target className="h-5 w-5 text-orange-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Exploited</div>
                        <div className="text-sm text-gray-400">
                          {vulnerability.exploitedInWild ? 'Yes (Known Exploitation)' : 'No Known Exploitation'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Last Modified */}
                    <div className="flex items-start space-x-2">
                      <Calendar className="h-5 w-5 text-cyan-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">Last Modified</div>
                        <div className="text-sm text-gray-400">{formatDate(vulnerability.lastModified)}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-300">
                  {attack?.description || 
                   prediction?.explanation || 
                   vulnerability?.description}
                </p>
              </div>
              
              {/* Type-specific additional content */}
              {attack && attack.techniquesUsed && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Techniques Used</h3>
                  <div className="bg-gray-800/50 p-4 rounded-md">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {typeof attack.techniquesUsed === 'string' 
                        ? attack.techniquesUsed 
                        : JSON.stringify(attack.techniquesUsed, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {prediction && prediction.potentialVulnerabilities && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Potential Vulnerabilities</h3>
                  <div className="bg-gray-800/50 p-4 rounded-md">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {typeof prediction.potentialVulnerabilities === 'string' 
                        ? prediction.potentialVulnerabilities 
                        : JSON.stringify(prediction.potentialVulnerabilities, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {vulnerability && vulnerability.affectedSystems && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Affected Systems</h3>
                  <div className="bg-gray-800/50 p-4 rounded-md">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {typeof vulnerability.affectedSystems === 'string' 
                        ? JSON.parse(vulnerability.affectedSystems).join('\n') 
                        : vulnerability.affectedSystems}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex items-center text-sm text-gray-400">
                Source: {attack?.source || 
                         prediction?.model?.name || 'ML Prediction' || 
                         'National Vulnerability Database'}
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right column - Additional info and related items */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card variant="cyberOutline">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="cyberPrimary" className="w-full">
                {threatType === 'attack' ? 'Report Similar Attack' : 
                 threatType === 'prediction' ? 'Run Updated Prediction' : 
                 'Check Patch Status'}
              </Button>
              
              <Button variant="cyber" className="w-full">
                Add to Watchlist
              </Button>
              
              <Button variant="cyberGhost" className="w-full">
                Export Report
              </Button>
            </CardContent>
          </Card>
          
          {/* Related Items */}
          {threatType === 'attack' && relatedVulnerabilities.length > 0 && (
            <Card variant="cyberOutline">
              <CardHeader>
                <CardTitle>Related Vulnerabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedVulnerabilities.map(vuln => (
                  <div key={vuln.id} className="p-3 border border-gray-700 rounded-md hover:border-cyan-500/30 transition-colors">
                    <div className="flex justify-between">
                      <div className="font-mono text-sm text-cyan-400">{vuln.id}</div>
                      <div className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-0.5 rounded-full">
                        {vuln.severity.toFixed(1)}
                      </div>
                    </div>
                    <div className="mt-1 text-sm line-clamp-2">{vuln.title}</div>
                    <div className="mt-2 flex justify-end">
                      <Link href={`/dashboard/vulnerabilities/${vuln.id}`}>
                        <Button variant="cyberGhost" size="sm">
                          Details
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* External References */}
          <Card variant="cyberOutline">
            <CardHeader>
              <CardTitle>External References</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {threatType === 'vulnerability' && (
                <>
                  <a 
                    href={`https://nvd.nist.gov/vuln/detail/${vulnerability?.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-3 border border-gray-700 rounded-md hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">National Vulnerability Database</div>
                      <div className="text-sm text-gray-400">View on NVD</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-cyan-400" />
                  </a>
                  
                  <a 
                    href={`https://www.cisa.gov/known-exploited-vulnerabilities-catalog`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-3 border border-gray-700 rounded-md hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">CISA KEV Catalog</div>
                      <div className="text-sm text-gray-400">Check if vulnerability is in KEV catalog</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-cyan-400" />
                  </a>
                </>
              )}
              
              {threatType === 'attack' && attack?.sourceUrl && (
                <a 
                  href={attack.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border border-gray-700 rounded-md hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold">Original Source</div>
                    <div className="text-sm text-gray-400">{attack.source}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-cyan-400" />
                </a>
              )}
              
              {threatType === 'prediction' && (
                <a 
                  href="https://attack.mitre.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border border-gray-700 rounded-md hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold">MITRE ATT&CK</div>
                    <div className="text-sm text-gray-400">Explore attack techniques</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-cyan-400" />
                </a>
              )}
              
              <a 
                href="https://www.cisa.gov/topics/cyber-threats-and-advisories" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-3 border border-gray-700 rounded-md hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold">CISA Advisories</div>
                  <div className="text-sm text-gray-400">Latest cybersecurity threats</div>
                </div>
                <ExternalLink className="h-4 w-4 text-cyan-400" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}