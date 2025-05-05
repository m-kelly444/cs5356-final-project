import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { 
  fetchVulnerabilities, 
  fetchRecentVulnerabilities,
  fetchCriticalVulnerabilities 
} from '@/lib/api/nvd';
import { db } from '@/lib/db';
import { vulnerabilities } from '@/lib/db/schema';
import { NvdVulnerabilityParams, NvdVulnerabilityResponse } from '@/types/api';

// Add this line to tell Next.js this is a dynamic route
export const dynamic = 'force-dynamic';

/**
 * GET /api/threat-data/nvd
 * 
 * Fetches vulnerability data from the National Vulnerability Database (NVD)
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
    const cveId = searchParams.get('cveId');
    const keywordSearch = searchParams.get('keywordSearch');
    const isRecent = searchParams.get('recent') === 'true';
    const isCritical = searchParams.get('critical') === 'true';
    const days = parseInt(searchParams.get('days') || '30', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Parse date parameters
    const pubStartDate = searchParams.get('pubStartDate')
      ? new Date(searchParams.get('pubStartDate')!)
      : undefined;
      
    const pubEndDate = searchParams.get('pubEndDate')
      ? new Date(searchParams.get('pubEndDate')!)
      : undefined;
      
    const lastModStartDate = searchParams.get('lastModStartDate')
      ? new Date(searchParams.get('lastModStartDate')!)
      : undefined;
      
    const lastModEndDate = searchParams.get('lastModEndDate')
      ? new Date(searchParams.get('lastModEndDate')!)
      : undefined;
    
    // Parse severity
    const cvssV3Severity = searchParams.get('cvssV3Severity') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | undefined;
    const cvssV2Severity = searchParams.get('cvssV2Severity') as 'HIGH' | 'MEDIUM' | 'LOW' | undefined;
    
    // Parse pagination
    const resultPerPage = parseInt(searchParams.get('resultPerPage') || '50', 10);
    const startIndex = parseInt(searchParams.get('startIndex') || '0', 10);
    
    // Other parameters
    const cpeName = searchParams.get('cpeName');
    const isExploitable = searchParams.get('isExploitable') === 'true' ? true : undefined;
    
    let nvdVulnerabilities;
    
    // Handle different types of requests
    if (isRecent) {
      // Fetch recent vulnerabilities
      nvdVulnerabilities = await fetchRecentVulnerabilities(days, limit);
    } else if (isCritical) {
      // Fetch critical vulnerabilities
      nvdVulnerabilities = await fetchCriticalVulnerabilities(limit);
    } else if (cveId) {
      // Fetch specific CVE
      const result = await fetchVulnerabilities({ cveId });
      nvdVulnerabilities = result.vulnerabilities;
    } else {
      // Fetch vulnerabilities with filters
      const params: NvdVulnerabilityParams = {
        keywordSearch,
        pubStartDate,
        pubEndDate,
        lastModStartDate,
        lastModEndDate,
        cvssV3Severity,
        cvssV2Severity,
        cpeName,
        isExploitable,
        resultPerPage,
        startIndex,
      };
      
      const result = await fetchVulnerabilities(params);
      nvdVulnerabilities = result.vulnerabilities;
    }
    
    // Log the API request
    console.log(`[API] NVD data fetched: ${nvdVulnerabilities.length} vulnerabilities`);
    
    // Store vulnerabilities in the database (could be implemented as a background task)
    storeNvdVulnerabilities(nvdVulnerabilities);
    
    // Return response
    const response: NvdVulnerabilityResponse = {
      success: true,
      data: nvdVulnerabilities,
      totalResults: nvdVulnerabilities.length,
      resultsPerPage: limit,
      startIndex: 0,
      timestamp: Date.now(),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] Error fetching NVD data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch NVD data',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * Store NVD vulnerabilities in the database
 * This could be implemented as a background job
 */
async function storeNvdVulnerabilities(nvdVulnerabilities: any[]) {
  try {
    // For each vulnerability, upsert into the database
    for (const item of nvdVulnerabilities) {
      const cve = item.cve;
      const cvssV3 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
      const cvssV2 = cve.metrics?.cvssMetricV2?.[0]?.cvssData;
      
      // Extract English description
      const description = cve.descriptions.find((d: any) => d.lang === 'en')?.value || '';
      
      // Get references
      const references = cve.references.map((ref: any) => ref.url);
      
      // Get severity score
      const severity = cvssV3?.baseScore || cvssV2?.baseScore || 0;
      
      // Convert to our database format
      const vulnData = {
        id: cve.id,
        title: description.substring(0, 100),
        description,
        severity,
        exploitedInWild: 0, // Set to 0 unless we know it's exploited
        publishedDate: new Date(cve.published).getTime(),
        lastModified: new Date(cve.lastModified).getTime(),
        cisaKevDate: null,
        remediationDate: null,
        affectedSystems: JSON.stringify([]),
        attackVector: cvssV3?.attackVector || cvssV2?.accessVector || '',
        references: JSON.stringify(references),
        sourceData: JSON.stringify(cve),
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
            lastModified: vulnData.lastModified,
            attackVector: vulnData.attackVector,
            references: vulnData.references,
            sourceData: vulnData.sourceData,
          },
        });
    }
    
    console.log(`[DB] Stored ${nvdVulnerabilities.length} NVD vulnerabilities`);
  } catch (error) {
    console.error('[DB] Error storing NVD vulnerabilities:', error);
  }
}