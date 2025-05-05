/**
 * PhishTank API Client
 * 
 * Client for interacting with the PhishTank API to check and retrieve phishing URLs.
 * PhishTank is a community-driven service for reporting and verifying phishing websites.
 * 
 * API Documentation: https://phishtank.org/api_info.php
 */

import { db } from '@/lib/db';
import { indicators } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// PhishTank API URLs
const PHISHTANK_BASE_URL = 'https://checkurl.phishtank.com/checkurl/';
const PHISHTANK_ONLINE_URL = 'https://phishtank.org/phish_detail.php?phish_id=';

// API key configuration
const PHISHTANK_API_KEY = process.env.PHISHTANK_API_KEY;

// Interface for PhishTank API response
interface PhishTankCheckResponse {
  meta: {
    status: string;
    url: string;
    requestId?: string;
    errorMessage?: string;
  };
  results: {
    url: string;
    inDatabase: boolean;
    verified: boolean;
    verifiedAt?: string;
    phishId?: string;
    phishDetailPage?: string;
    details?: any[];
  };
}

/**
 * Check if a URL is a known phishing site according to PhishTank
 * 
 * @param url URL to check
 * @returns PhishTank check result
 */
export async function checkUrl(url: string): Promise<PhishTankCheckResponse> {
  if (!url) {
    throw new Error('URL is required');
  }
  
  try {
    // Format request for PhishTank API
    const formData = new FormData();
    formData.append('url', url);
    formData.append('format', 'json');
    
    if (PHISHTANK_API_KEY) {
      formData.append('app_key', PHISHTANK_API_KEY);
    }
    
    // Send request to PhishTank API
    const response = await fetch(PHISHTANK_BASE_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`PhishTank API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse response
    const data: PhishTankCheckResponse = await response.json();
    
    // Store result in database if it's a phishing URL
    if (data.results.inDatabase && data.results.verified) {
      storePhishingIndicator(url, data);
    }
    
    return data;
  } catch (error) {
    console.error('Error checking URL with PhishTank:', error);
    throw error;
  }
}

/**
 * Batch check multiple URLs against PhishTank
 * Note: This will make multiple API calls, so use responsibly
 * 
 * @param urls List of URLs to check
 * @returns Map of URLs to their PhishTank check results
 */
export async function batchCheckUrls(urls: string[]): Promise<Map<string, PhishTankCheckResponse>> {
  const results = new Map<string, PhishTankCheckResponse>();
  
  // PhishTank doesn't have a batch API, so we need to make individual requests
  // Add a slight delay between requests to avoid overloading their API
  for (const url of urls) {
    try {
      const result = await checkUrl(url);
      results.set(url, result);
      
      // Small delay to be nice to their API
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error checking URL ${url}:`, error);
      // Continue with other URLs even if one fails
    }
  }
  
  return results;
}

/**
 * Store a verified phishing URL in the database
 * 
 * @param url The phishing URL
 * @param data PhishTank API response
 */
async function storePhishingIndicator(url: string, data: PhishTankCheckResponse): Promise<void> {
  try {
    const now = new Date();
    const verifiedDate = data.results.verifiedAt ? new Date(data.results.verifiedAt).getTime() : now;
    
    // Create indicator data
    const indicatorData = {
      id: `phishtank_${data.results.phishId || now}`,
      type: 'url',
      value: url,
      maliciousScore: 1.0, // Verified phishing URLs are definitely malicious
      firstSeen: verifiedDate,
      lastSeen: now,
      source: 'phishtank',
      associatedAttackTypes: JSON.stringify(['phishing']),
      tags: JSON.stringify(['phishing', 'verified']),
      sourceData: JSON.stringify(data),
    };
    
    // Upsert into database
    await db
      .insert(indicators)
      .values(indicatorData)
      .onConflictDoUpdate({
        target: indicators.id,
        set: {
          lastSeen: now,
          sourceData: indicatorData.sourceData,
        },
      });
      
    console.log(`[DB] Stored phishing URL indicator: ${url}`);
  } catch (error) {
    console.error('[DB] Error storing phishing indicator:', error);
  }
}

/**
 * Get the PhishTank detail page URL for a phishing ID
 * 
 * @param phishId PhishTank phish ID
 * @returns PhishTank detail page URL
 */
export function getPhishDetailUrl(phishId: string): string {
  return `${PHISHTANK_ONLINE_URL}${phishId}`;
}

/**
 * Get recently detected phishing URLs from the database
 * 
 * @param limit Maximum number of results to return
 * @returns List of phishing URL indicators
 */
export async function getRecentPhishingUrls(limit: number = 10): Promise<any[]> {
  try {
    // Get phishing URL indicators from database
    const phishingUrls = await db
      .select()
      .from(indicators)
      .where(eq(indicators.source, 'phishtank'))
      .orderBy(indicators.lastSeen, 'desc')
      .limit(limit);
    
    return phishingUrls;
  } catch (error) {
    console.error('Error getting recent phishing URLs:', error);
    return [];
  }
}