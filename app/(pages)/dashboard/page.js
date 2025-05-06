import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';

// Database and models
import { db } from '@/lib/db';
import { cyberAttacks, threatActors, predictions } from '@/lib/db/schema';
import { desc, and, gte, eq } from 'drizzle-orm';

// Components
import ThreatCard from '@/components/dashboard/threat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

export const metadata = {
  title: 'Threats | CyberPulse',
  description: 'Cybersecurity threat overview',
};

export default async function ThreatsPage() {
  // Authentication check
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login?callbackUrl=/dashboard/threats');
  }
  
  // Get recent attacks
  const recentAttacks = await db.select()
    .from(cyberAttacks)
    .orderBy(desc(cyberAttacks.attackDate))
    .limit(5);
  
  // Get threat actors
  const threatActorsData = await db.select()
    .from(threatActors)
    .limit(10);
  
  // Build a map of threat actors by ID for quick lookup
  const threatActorsMap = new Map();
  threatActorsData.forEach(actor => {
    threatActorsMap.set(actor.id, actor);
  });
  
  // Get active predictions
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activePredictions = await db.select()
    .from(predictions)
    .where(
      and(
        gte(predictions.generatedDate, thirtyDaysAgo.getTime()),
        gte(predictions.probability, 0.7)
      )
    )
    .orderBy(desc(predictions.probability))
    .limit(5);
  
  // Process attacks into threat format
  const attackThreats = recentAttacks.map(attack => ({
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
      threatActor: attack.threatActorId 
        ? threatActorsMap.get(attack.threatActorId)?.name 
        : undefined,
    },
  }));
  
  // Process predictions into threat format
  const predictionThreats = activePredictions.map(prediction => ({
    id: prediction.id,
    title: `Predicted ${prediction.attackType} targeting ${prediction.targetValue}`,
    type: 'prediction',
    severity: prediction.severity || (prediction.probability * 10),
    description: prediction.explanation || `High probability of ${prediction.attackType} attack on ${prediction.targetValue} in the near future.`,
    date: prediction.generatedDate,
    source: 'Machine Learning Model',
    tags: [prediction.attackType || 'unknown', prediction.targetType, prediction.targetValue],
    details: {
      probability: prediction.probability,
      confidence: prediction.confidence,
      timeframe: prediction.predictedTimeframe,
    },
  }));
  
  // Combine all threats and sort by date (newest first)
  const threats = [...attackThreats, ...predictionThreats].sort((a, b) => {
    const dateA = typeof a.date === 'number' ? a.date : new Date(a.date).getTime();
    const dateB = typeof b.date === 'number' ? b.date : new Date(b.date).getTime();
    return dateB - dateA;
  });
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold neon-text">Threats Dashboard</h1>
        <Button variant="cyber" size="sm">
          Filter Threats
        </Button>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="cyberOutline">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-cyan-400">{recentAttacks.length}</div>
            <div className="text-sm text-gray-400">Recent Attacks</div>
          </CardContent>
        </Card>
        
        <Card variant="cyberOutline">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-fuchsia-400">{activePredictions.length}</div>
            <div className="text-sm text-gray-400">Active Predictions</div>
          </CardContent>
        </Card>
        
        <Card variant="cyberOutline">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-yellow-400">{threatActorsData.length}</div>
            <div className="text-sm text-gray-400">Threat Actors</div>
          </CardContent>
        </Card>
        
        <Card variant="cyberOutline">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-red-400">75%</div>
            <div className="text-sm text-gray-400">Global Threat Level</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Threat cards */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Recent Threats</h2>
          <Button variant="cyberGhost" size="sm">
            View All
          </Button>
        </div>
        
        <Suspense fallback={<Loader text="Loading threats..." />}>
          {threats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {threats.map((threat) => (
                <ThreatCard key={threat.id} threat={threat} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No threats found.</p>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </div>
    </div>
  );
}