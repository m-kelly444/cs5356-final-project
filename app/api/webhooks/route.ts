import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { vulnerabilities, cyberAttacks, indicators } from '@/lib/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { WebhookPayload, WebhookResponse } from '@/types/api';

/**
 * Webhook signature verification secret
 * Would typically be stored in environment variables
 */
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

/**
 * POST /api/webhooks
 * 
 * Receive data from external sources via webhooks
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body: WebhookPayload = await request.json();
    
    // Get request headers
    const signature = request.headers.get('x-webhook-signature');
    
    // Verify signature if provided
    if (signature) {
      // Simple signature verification example
      // In production, implement more secure verification methods
      const isValid = verifySignature(JSON.stringify(body), signature);
      
      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid webhook signature',
            timestamp: Date.now(),
          },
          { status: 401 }
        );
      }
    }
    
    // Process webhook data based on type
    let processed = false;
    
    switch (body.type) {
      case 'vulnerability':
        await processVulnerabilityWebhook(body.data);
        processed = true;
        break;
        
      case 'attack':
        await processAttackWebhook(body.data);
        processed = true;
        break;
        
      case 'indicator':
        await processIndicatorWebhook(body.data);
        processed = true;
        break;
        
      default:
        // Unknown webhook type
        return NextResponse.json(
          {
            success: false,
            error: 'Unknown webhook type',
            timestamp: Date.now(),
          },
          { status: 400 }
        );
    }
    
    // Return response
    const response: WebhookResponse = {
      success: true,
      data: {
        received: true,
        processed,
      },
      timestamp: Date.now(),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] Error processing webhook:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * Verify webhook signature
 * 
 * This is a simple example. In production, implement more secure verification methods.
 */
function verifySignature(payload: string, signature: string): boolean {
  // Simple verification example
  // In production, use crypto to create and verify HMAC signatures
  return signature === `sha256=${WEBHOOK_SECRET}`;
}

/**
 * Process vulnerability webhook data
 */
async function processVulnerabilityWebhook(data: any) {
  // Validate data
  if (!data.id || !data.title || !data.description || data.severity === undefined) {
    throw new Error('Invalid vulnerability data');
  }
  
  // Convert to database format
  const vulnData = {
    id: data.id,
    title: data.title,
    description: data.description,
    severity: data.severity,
    exploitedInWild: data.exploitedInWild ? 1 : 0,
    publishedDate: new Date(data.publishedDate).getTime(),
    lastModified: new Date(data.lastModified || data.publishedDate).getTime(),
    cisaKevDate: data.cisaKevDate ? new Date(data.cisaKevDate).getTime() : null,
    remediationDate: data.remediationDate ? new Date(data.remediationDate).getTime() : null,
    affectedSystems: JSON.stringify(data.affectedSystems || []),
    attackVector: data.attackVector || '',
    references: JSON.stringify(data.references || []),
    sourceData: JSON.stringify(data),
  };
  
  // Upsert into database
  await db
    .insert(vulnerabilities)
    .values(vulnData)
    .onConflictDoUpdate({
      target: vulnerabilities.id,
      set: {
        title: vulnData.title,
        description: vulnData.description,
        severity: vulnData.severity,
        exploitedInWild: vulnData.exploitedInWild,
        lastModified: vulnData.lastModified,
        cisaKevDate: vulnData.cisaKevDate,
        remediationDate: vulnData.remediationDate,
        affectedSystems: vulnData.affectedSystems,
        attackVector: vulnData.attackVector,
        references: vulnData.references,
        sourceData: vulnData.sourceData,
      },
    });
  
  console.log(`[Webhook] Processed vulnerability: ${data.id}`);
}

/**
 * Process cyber attack webhook data
 */
async function processAttackWebhook(data: any) {
  // Validate data
  if (!data.title || !data.description || !data.attackDate || !data.targetedSector || !data.targetedRegion) {
    throw new Error('Invalid attack data');
  }
  
  // Convert to database format
  const attackData = {
    id: data.id || createId(),
    title: data.title,
    description: data.description,
    attackDate: new Date(data.attackDate).getTime(),
    discoveredDate: data.discoveredDate ? new Date(data.discoveredDate).getTime() : new Date().getTime(),
    attackType: data.attackType || 'unknown',
    threatActorId: data.threatActorId || null,
    vulnerabilitiesExploited: JSON.stringify(data.vulnerabilitiesExploited || []),
    targetedSector: data.targetedSector,
    targetedRegion: data.targetedRegion,
    impactLevel: data.impactLevel || 5,
    techniquesUsed: JSON.stringify(data.techniquesUsed || []),
    indicators: JSON.stringify(data.indicators || []),
    source: data.source || 'webhook',
    sourceUrl: data.sourceUrl || '',
    sourceData: JSON.stringify(data),
  };
  
  // Upsert into database
  await db
    .insert(cyberAttacks)
    .values(attackData)
    .onConflictDoUpdate({
      target: cyberAttacks.id,
      set: {
        title: attackData.title,
        description: attackData.description,
        attackDate: attackData.attackDate,
        discoveredDate: attackData.discoveredDate,
        attackType: attackData.attackType,
        threatActorId: attackData.threatActorId,
        vulnerabilitiesExploited: attackData.vulnerabilitiesExploited,
        targetedSector: attackData.targetedSector,
        targetedRegion: attackData.targetedRegion,
        impactLevel: attackData.impactLevel,
        techniquesUsed: attackData.techniquesUsed,
        indicators: attackData.indicators,
        source: attackData.source,
        sourceUrl: attackData.sourceUrl,
        sourceData: attackData.sourceData,
      },
    });
  
  console.log(`[Webhook] Processed attack: ${attackData.id}`);
}

/**
 * Process indicator webhook data
 */
async function processIndicatorWebhook(data: any) {
  // Validate data
  if (!data.type || !data.value || data.maliciousScore === undefined) {
    throw new Error('Invalid indicator data');
  }
  
  // Convert to database format
  const indicatorData = {
    id: data.id || createId(),
    type: data.type,
    value: data.value,
    maliciousScore: data.maliciousScore,
    firstSeen: data.firstSeen ? new Date(data.firstSeen).getTime() : new Date().getTime(),
    lastSeen: data.lastSeen ? new Date(data.lastSeen).getTime() : new Date().getTime(),
    source: data.source || 'webhook',
    associatedAttackTypes: JSON.stringify(data.associatedAttackTypes || []),
    tags: JSON.stringify(data.tags || []),
    sourceData: JSON.stringify(data),
  };
  
  // Upsert into database
  await db
    .insert(indicators)
    .values(indicatorData)
    .onConflictDoUpdate({
      target: indicators.id,
      set: {
        maliciousScore: indicatorData.maliciousScore,
        lastSeen: indicatorData.lastSeen,
        associatedAttackTypes: indicatorData.associatedAttackTypes,
        tags: indicatorData.tags,
        sourceData: indicatorData.sourceData,
      },
    });
  
  console.log(`[Webhook] Processed indicator: ${indicatorData.id}`);
}