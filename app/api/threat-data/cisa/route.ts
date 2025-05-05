import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { fetchCisaKevCatalog, getKevCatalogStats } from '@/lib/api/cisa';
import { db } from '@/lib/db';
import { vulnerabilities } from '@/lib/db/schema';
import { CisaKevCatalogResponse } from '@/types/api';

// Add this line to tell Next.js this is a dynamic route
export const dynamic = 'force-dynamic';

/**
 * GET /api/threat-data/cisa
 * 
 * Fetches CISA Known Exploited Vulnerabilities (KEV) Catalog data
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
    const statsOnly = searchParams.get('stats') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const days = parseInt(searchParams.get('days') || '0', 10);
    const vendor = searchParams.get('vendor');
    
    if (statsOnly) {
      // Get KEV statistics
      const stats = await getKevCatalogStats();
      
      return NextResponse.json({
        success: true,
        data: stats,
        timestamp: new Date(),
      });
    }
    
    // Fetch the KEV catalog
    const catalog = await fetchCisaKevCatalog();
    
    // Apply filters
    let filteredVulns = catalog.vulnerabilities;
    
    // Filter by days
    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filteredVulns = filteredVulns.filter(vuln => {
        const addedDate = new Date(vuln.dateAdded);
        return addedDate >= cutoffDate;
      });
    }
    
    // Filter by vendor
    if (vendor) {
      const vendorLower = vendor.toLowerCase();
      filteredVulns = filteredVulns.filter(vuln => 
        vuln.vendorProject.toLowerCase().includes(vendorLower)
      );
    }
    
    // Apply limit
    if (limit > 0 && limit < filteredVulns.length) {
      filteredVulns = filteredVulns.slice(0, limit);
    }
    
    // Log the API request
    console.log(`[API] CISA KEV data fetched: ${filteredVulns.length} vulnerabilities`);
    
    // Store in database (could be implemented as a background task)
    storeCisaVulnerabilities(filteredVulns);
    
    // Return response
    const response: CisaKevCatalogResponse = {
      success: true,
      data: {
        ...catalog,
        vulnerabilities: filteredVulns,
      },
      timestamp: new Date(),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] Error fetching CISA KEV data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch CISA KEV data',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

/**
 * Store CISA vulnerabilities in the database
 * This could be implemented as a background job
 */
async function storeCisaVulnerabilities(kevVulnerabilities: any[]) {
  try {
    // For each vulnerability, upsert into the database
    for (const vuln of kevVulnerabilities) {
      // Convert to our database format
      const vulnData = {
        id: vuln.cveID,
        title: vuln.vulnerabilityName,
        description: vuln.shortDescription,
        severity: 10, // CISA KEV vulnerabilities are critical by definition
        exploitedInWild: 1, // KEV vulnerabilities are known to be exploited
        publishedDate: new Date(vuln.dateAdded).getTime(),
        lastModified: new Date(vuln.dateAdded).getTime(),
        cisaKevDate: new Date(vuln.dateAdded).getTime(),
        remediationDate: new Date(vuln.dueDate).getTime(),
        affectedSystems: JSON.stringify([`${vuln.vendorProject} ${vuln.product}`]),
        attackVector: '',
        references: JSON.stringify([]),
        sourceData: JSON.stringify(vuln),
      };
      
      // Upsert into database
      await db
        .insert(vulnerabilities)
        .values(vulnData)
        .onConflictDoUpdate({
          target: vulnerabilities.id,
          set: {
            cisaKevDate: vulnData.cisaKevDate,
            remediationDate: vulnData.remediationDate,
            exploitedInWild: 1,
            sourceData: vulnData.sourceData,
          },
        });
    }
    
    console.log(`[DB] Stored ${kevVulnerabilities.length} CISA KEV vulnerabilities`);
  } catch (error) {
    console.error('[DB] Error storing CISA KEV vulnerabilities:', error);
  }
}