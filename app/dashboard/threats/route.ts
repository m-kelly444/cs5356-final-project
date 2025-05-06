import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';
import { cyberAttacks, threatActors, predictions } from '@/lib/db/schema';
import { desc, and, gte, eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const typeFilter = searchParams.get('type');
    
    // Get recent attacks
    const recentAttacks = await db.select()
      .from(cyberAttacks)
      .orderBy(desc(cyberAttacks.attackDate))
      .limit(limit);
    
    // Get threat actors
    const threatActorsData = await db.select()
      .from(threatActors)
      .limit(50);
    
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
      .limit(limit);
    
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
    
    // Combine all threats and filter if needed
    let threats = [...attackThreats, ...predictionThreats];
    
    // Apply type filter if specified
    if (typeFilter) {
      threats = threats.filter(threat => threat.type === typeFilter);
    }
    
    // Sort by date (newest first)
    threats.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
    
    return NextResponse.json({
      success: true,
      data: threats,
      totalCount: threats.length,
      timestamp: new Date(),
    });
    
  } catch (error) {
    console.error('[THREATS_API_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch threats data' },
      { status: 500 }
    );
  }
}