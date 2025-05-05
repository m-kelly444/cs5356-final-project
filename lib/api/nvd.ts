/**
 * NVD API Client
 * 
 * This client interacts with the National Vulnerability Database (NVD) 2.0 API
 * to fetch vulnerability data.
 * 
 * API Documentation: https://nvd.nist.gov/developers/vulnerabilities
 */

// Types for NVD API responses
export interface NvdApiResponse<T> {
    resultsPerPage: number;
    startIndex: number;
    totalResults: number;
    format: string;
    version: string;
    timestamp: string;
    vulnerabilities: T[];
  }
  
  export interface NvdVulnerability {
    cve: {
      id: string;
      sourceIdentifier: string;
      published: string;
      lastModified: string;
      vulnStatus: string;
      descriptions: {
        lang: string;
        value: string;
      }[];
      metrics: {
        cvssMetricV31?: {
          cvssData: {
            version: string;
            vectorString: string;
            attackVector: string;
            attackComplexity: string;
            privilegesRequired: string;
            userInteraction: string;
            scope: string;
            confidentialityImpact: string;
            integrityImpact: string;
            availabilityImpact: string;
            baseScore: number;
            baseSeverity: string;
          };
          exploitabilityScore: number;
          impactScore: number;
        }[];
        cvssMetricV2?: {
          cvssData: {
            version: string;
            vectorString: string;
            accessVector: string;
            accessComplexity: string;
            authentication: string;
            confidentialityImpact: string;
            integrityImpact: string;
            availabilityImpact: string;
            baseScore: number;
          };
          baseSeverity: string;
          exploitabilityScore: number;
          impactScore: number;
          acInsufInfo: boolean;
          obtainAllPrivilege: boolean;
          obtainUserPrivilege: boolean;
          obtainOtherPrivilege: boolean;
          userInteractionRequired: boolean;
        }[];
      };
      weaknesses?: {
        source: string;
        type: string;
        description: {
          lang: string;
          value: string;
        }[];
      }[];
      configurations?: {
        nodes: {
          operator: string;
          negate: boolean;
          cpeMatch: {
            vulnerable: boolean;
            criteria: string;
            matchCriteriaId: string;
            versionEndExcluding?: string;
            versionEndIncluding?: string;
            versionStartExcluding?: string;
            versionStartIncluding?: string;
          }[];
        }[];
      }[];
      references: {
        url: string;
        source: string;
        tags: string[];
      }[];
    };
  }
  
  // API base URL and key configuration
  const NVD_API_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
  const NVD_API_KEY = process.env.NVD_API_KEY; // Optional, but recommended for higher rate limits
  
  /**
   * Fetch vulnerabilities from NVD API
   */
  export async function fetchVulnerabilities({
    cveId,
    keywordSearch,
    pubStartDate,
    pubEndDate,
    lastModStartDate,
    lastModEndDate,
    cvssV3Severity,
    cvssV2Severity,
    cpeName,
    isExploitable,
    resultPerPage = 20,
    startIndex = 0,
  }: {
    cveId?: string;
    keywordSearch?: string;
    pubStartDate?: Date;
    pubEndDate?: Date;
    lastModStartDate?: Date;
    lastModEndDate?: Date;
    cvssV3Severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    cvssV2Severity?: 'HIGH' | 'MEDIUM' | 'LOW';
    cpeName?: string;
    isExploitable?: boolean;
    resultPerPage?: number;
    startIndex?: number;
  } = {}): Promise<NvdApiResponse<NvdVulnerability>> {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (cveId) params.append('cveId', cveId);
    if (keywordSearch) params.append('keywordSearch', keywordSearch);
    
    if (pubStartDate) params.append('pubStartDate', formatDate(pubStartDate));
    if (pubEndDate) params.append('pubEndDate', formatDate(pubEndDate));
    
    if (lastModStartDate) params.append('lastModStartDate', formatDate(lastModStartDate));
    if (lastModEndDate) params.append('lastModEndDate', formatDate(lastModEndDate));
    
    if (cvssV3Severity) params.append('cvssV3Severity', cvssV3Severity);
    if (cvssV2Severity) params.append('cvssV2Severity', cvssV2Severity);
    
    if (cpeName) params.append('cpeName', cpeName);
    if (isExploitable !== undefined) params.append('isExploitable', isExploitable.toString());
    
    params.append('resultsPerPage', resultPerPage.toString());
    params.append('startIndex', startIndex.toString());
    
    // Set up request headers
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    // Add API key if available
    if (NVD_API_KEY) {
      headers['apiKey'] = NVD_API_KEY;
    }
    
    try {
      // Make the API request
      const response = await fetch(`${NVD_API_URL}?${params.toString()}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`NVD API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching from NVD API:', error);
      throw error;
    }
  }
  
  /**
   * Fetch recently added vulnerabilities
   * 
   * Gets vulnerabilities published in the last 30 days
   */
  export async function fetchRecentVulnerabilities(days = 30, limit = 50): Promise<NvdVulnerability[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
    
    const response = await fetchVulnerabilities({
      pubStartDate: thirtyDaysAgo,
      resultPerPage: limit,
    });
    
    return response.vulnerabilities;
  }
  
  /**
   * Fetch critical vulnerabilities
   * 
   * Gets vulnerabilities with CVSS v3 critical severity
   */
  export async function fetchCriticalVulnerabilities(limit = 50): Promise<NvdVulnerability[]> {
    const response = await fetchVulnerabilities({
      cvssV3Severity: 'CRITICAL',
      resultPerPage: limit,
    });
    
    return response.vulnerabilities;
  }
  
  /**
   * Fetch a specific vulnerability by CVE ID
   */
  export async function fetchVulnerabilityByCveId(cveId: string): Promise<NvdVulnerability | null> {
    const response = await fetchVulnerabilities({
      cveId,
    });
    
    if (response.vulnerabilities.length > 0) {
      return response.vulnerabilities[0];
    }
    
    return null;
  }
  
  /**
   * Format date for NVD API
   * 
   * NVD API requires dates in ISO 8601 format: YYYY-MM-DDThh:mm:ss.sssZ
   */
  function formatDate(date: Date): string {
    return date.toISOString();
  }