import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getKevCatalogStats } from '@/lib/api/cisa';
import { db } from '@/lib/db';
import { vulnerabilities, cyberAttacks, predictions } from '@/lib/db/schema';
import { count, gt, gte, eq, and, desc } from 'drizzle-orm';
import { StatsResponse } from '@/types/api';

/**
 * GET /api/threat-data/stats
 * 
 * Get aggregated statistics for the dashboard
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
    
    // Get CISA KEV statistics
    const kevStats = await getKevCatalogStats();
    
    // Get vulnerability statistics
    const vulnerabilityStats = await getVulnerabilityStats();
    
    // Get attack statistics
    const attackStats = await getAttackStats();
    
    // Prepare response
    const response: StatsResponse = {
      success: true,
      data: {
        kevStats,
        vulnerabilityCount: vulnerabilityStats,
        attackStats,
      },
      timestamp: Date.now(),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] Error fetching stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * Get vulnerability statistics from the database
 */
async function getVulnerabilityStats() {
  // Calculate dates
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Count total vulnerabilities
  const totalResult = await db
    .select({ count: count() })
    .from(vulnerabilities);
  
  // Count critical vulnerabilities (CVSS score >= 9.0)
  const criticalResult = await db
    .select({ count: count() })
    .from(vulnerabilities)
    .where(gte(vulnerabilities.severity, 9.0));
  
  // Count vulnerabilities exploited in the wild
  const exploitedResult = await db
    .select({ count: count() })
    .from(vulnerabilities)
    .where(eq(vulnerabilities.exploitedInWild, 1));
  
  // Count recent vulnerabilities (published in the last 30 days)
  const recentResult = await db
    .select({ count: count() })
    .from(vulnerabilities)
    .where(gte(vulnerabilities.publishedDate, thirtyDaysAgo.getTime()));
  
  return {
    total: totalResult[0]?.count || 0,
    critical: criticalResult[0]?.count || 0,
    exploitedInWild: exploitedResult[0]?.count || 0,
  };
}

/**
 * Get attack statistics from the database
 */
async function getAttackStats() {
  // Calculate dates
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Count recent attacks (in the last 30 days)
  const recentResult = await db
    .select({ count: count() })
    .from(cyberAttacks)
    .where(gte(cyberAttacks.attackDate, thirtyDaysAgo.getTime()));
  
  // Count recent predictions
  const predictionsResult = await db
    .select({ count: count() })
    .from(predictions)
    .where(
      and(
        gte(predictions.generatedDate, thirtyDaysAgo.getTime()),
        gte(predictions.probability, 0.7) // Only high-probability predictions
      )
    );
  
  // Get attack type distribution
  const attacksByType = await db
    .select({
      attackType: cyberAttacks.attackType,
      count: count(),
    })
    .from(cyberAttacks)
    .where(gte(cyberAttacks.attackDate, thirtyDaysAgo.getTime()))
    .groupBy(cyberAttacks.attackType);
  
  // Get attack region distribution
  const attacksByRegion = await db
    .select({
      region: cyberAttacks.targetedRegion,
      count: count(),
    })
    .from(cyberAttacks)
    .where(gte(cyberAttacks.attackDate, thirtyDaysAgo.getTime()))
    .groupBy(cyberAttacks.targetedRegion);
  
  // Convert to record objects
  const byType: Record<string, number> = {};
  attacksByType.forEach(item => {
    byType[item.attackType] = item.count;
  });
  
  const byRegion: Record<string, number> = {};
  attacksByRegion.forEach(item => {
    byRegion[item.region] = item.count;
  });
  
  return {
    recentCount: recentResult[0]?.count || 0,
    predictedCount: predictionsResult[0]?.count || 0,
    byType,
    byRegion,
  };
}