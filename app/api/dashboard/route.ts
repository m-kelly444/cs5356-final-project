import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';
import { vulnerabilities, cyberAttacks, predictions } from '@/lib/db/schema';
import { count, desc, and, gte } from 'drizzle-orm';
export const dynamic = 'force-dynamic';

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
    
    // Get time range for recent data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get dashboard statistics
    const [
      vulnerabilityCount,
      criticalVulnCount,
      recentAttackCount,
      activePredictionsCount
    ] = await Promise.all([
      // Total vulnerabilities
      db
        .select({ count: count() })
        .from(vulnerabilities)
        .then(result => result[0]?.count || 0),
      
      // Critical vulnerabilities
      db
        .select({ count: count() })
        .from(vulnerabilities)
        .where(gte(vulnerabilities.severity, 9.0))
        .then(result => result[0]?.count || 0),
      
      // Recent attacks
      db
        .select({ count: count() })
        .from(cyberAttacks)
        .where(gte(cyberAttacks.attackDate, thirtyDaysAgo.getTime()))
        .then(result => result[0]?.count || 0),
      
      // Active predictions
      db
        .select({ count: count() })
        .from(predictions)
        .where(
          and(
            gte(predictions.generatedDate, thirtyDaysAgo.getTime()),
            gte(predictions.probability, 0.7)
          )
        )
        .then(result => result[0]?.count || 0)
    ]);
    
    // Calculate global threat level (simplified algorithm)
    const threatLevel = Math.min(
      100,
      (
        (criticalVulnCount * 5) +
        (recentAttackCount * 3) +
        (activePredictionsCount * 2)
      ) / 3
    );
    
    return NextResponse.json({
      success: true,
      data: {
        threatLevel,
        stats: {
          vulnerabilityCount: {
            total: vulnerabilityCount,
            critical: criticalVulnCount
          },
          attackStats: {
            recentCount: recentAttackCount,
            predictedCount: activePredictionsCount
          }
        },
        updatedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('[DASHBOARD_API_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}