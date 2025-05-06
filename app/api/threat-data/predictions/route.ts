import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { predictAttacks, getPredictionsForCommonSectors } from '@/lib/ml/prediction';
import { db } from '@/lib/db';
import { predictions } from '@/lib/db/schema';
import { desc, gte, lte } from 'drizzle-orm';
import { PredictionRequestBody, PredictionResponse } from '@/types/api';

// Add this line to tell Next.js this is a dynamic route
export const dynamic = 'force-dynamic';

/**
 * GET /api/threat-data/predictions
 * 
 * Get predictions based on query parameters
 */
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sectorsOnly = searchParams.get('sectors') === 'true';
    const recentOnly = searchParams.get('recent') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const minProbability = parseFloat(searchParams.get('minProbability') || '0.6');
    
    if (sectorsOnly) {
      // Get predictions for common sectors
      const sectorPredictions = await getPredictionsForCommonSectors();
      
      return NextResponse.json({
        success: true,
        data: sectorPredictions,
        timestamp: new Date(),
      });
    }
    
    if (recentOnly) {
      // Get recent predictions from the database
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentPredictions = await db.select()
        .from(predictions)
        .where(
          gte(predictions.generatedDate, thirtyDaysAgo.getTime())
        )
        .orderBy(desc(predictions.probability))
        .limit(limit);
      
      return NextResponse.json({
        success: true,
        data: recentPredictions,
        timestamp: new Date(),
      });
    }
    
    // If no specific request, return a 400 error
    return NextResponse.json(
      {
        success: false,
        error: 'Please specify a prediction type (sectors=true or recent=true)',
        timestamp: new Date(),
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[API] Error fetching predictions:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch predictions',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/threat-data/predictions
 * 
 * Create a new prediction
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only allow analysts and admins to create predictions
    if (session.user.role !== 'analyst' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body: PredictionRequestBody = await request.json();
    
    // Validate required fields
    if (!body.targetType || !body.targetValue) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }
    
    // Generate prediction
    const predictionResult = await predictAttacks({
      targetType: body.targetType,
      targetValue: body.targetValue,
      recentVulnerabilities: body.recentVulnerabilities,
      avgVulnSeverity: body.avgVulnSeverity,
      historicalAttackFrequency: body.historicalAttackFrequency,
      daysSinceLastAttack: body.daysSinceLastAttack,
      region: body.region,
      sector: body.sector,
    });
    
    // Return response
    const response: PredictionResponse = {
      success: true,
      data: predictionResult,
      timestamp: new Date(),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] Error creating prediction:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create prediction',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}