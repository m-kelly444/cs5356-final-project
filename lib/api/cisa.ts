/**
 * CISA Known Exploited Vulnerabilities (KEV) Catalog API Client
 * 
 * This client fetches data from the CISA KEV Catalog, which is an authoritative source
 * of vulnerabilities that have been exploited in the wild.
 * 
 * Data source: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
 */

// Types for CISA KEV data
export interface CisaKevVulnerability {
    cveID: string;
    vendorProject: string;
    product: string;
    vulnerabilityName: string;
    dateAdded: string;
    shortDescription: string;
    requiredAction: string;
    dueDate: string;
    notes: string;
  }
  
  export interface CisaKevCatalog {
    title: string;
    catalogVersion: string;
    dateReleased: string;
    count: number;
    vulnerabilities: CisaKevVulnerability[];
  }
  
  // CISA KEV Catalog JSON URL
  const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
  
  /**
   * Fetch the complete CISA KEV catalog
   */
  export async function fetchCisaKevCatalog(): Promise<CisaKevCatalog> {
    try {
      const response = await fetch(CISA_KEV_URL);
      
      if (!response.ok) {
        throw new Error(`CISA KEV API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching CISA KEV catalog:', error);
      throw error;
    }
  }
  
  /**
   * Fetch recent vulnerabilities from the CISA KEV catalog
   * 
   * Gets vulnerabilities added in the last X days
   */
  export async function fetchRecentKevVulnerabilities(days = 30): Promise<CisaKevVulnerability[]> {
    const catalog = await fetchCisaKevCatalog();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return catalog.vulnerabilities.filter(vuln => {
      const addedDate = new Date(vuln.dateAdded);
      return addedDate >= cutoffDate;
    });
  }
  
  /**
   * Check if a vulnerability is in the CISA KEV catalog
   */
  export async function isVulnerabilityInKevCatalog(cveId: string): Promise<boolean> {
    const catalog = await fetchCisaKevCatalog();
    return catalog.vulnerabilities.some(vuln => vuln.cveID === cveId);
  }
  
  /**
   * Get details for a specific vulnerability in the CISA KEV catalog by CVE ID
   */
  export async function getKevVulnerabilityDetails(cveId: string): Promise<CisaKevVulnerability | null> {
    const catalog = await fetchCisaKevCatalog();
    const vulnerability = catalog.vulnerabilities.find(vuln => vuln.cveID === cveId);
    
    return vulnerability || null;
  }
  
  /**
   * Get KEV vulnerabilities by vendor/project
   */
  export async function getKevVulnerabilitiesByVendor(vendor: string): Promise<CisaKevVulnerability[]> {
    const catalog = await fetchCisaKevCatalog();
    const normalizedVendor = vendor.toLowerCase();
    
    return catalog.vulnerabilities.filter(vuln => 
      vuln.vendorProject.toLowerCase().includes(normalizedVendor)
    );
  }
  
  /**
   * Get KEV vulnerabilities that are due for remediation soon
   * 
   * Returns vulnerabilities with remediation due dates within the next X days
   */
  export async function getUpcomingKevRemediation(days = 14): Promise<CisaKevVulnerability[]> {
    const catalog = await fetchCisaKevCatalog();
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return catalog.vulnerabilities.filter(vuln => {
      const dueDate = new Date(vuln.dueDate);
      return dueDate >= now && dueDate <= cutoffDate;
    });
  }
  
  /**
   * Get statistics about the KEV catalog
   */
  export async function getKevCatalogStats(): Promise<{
    totalVulnerabilities: number;
    addedLast30Days: number;
    addedLast90Days: number;
    byVendor: Record<string, number>;
    remediationDueSoon: number;
  }> {
    const catalog = await fetchCisaKevCatalog();
    const now = new Date();
    const thirtyDaysAgo = new Date();
    const ninetyDaysAgo = new Date();
    const fourteenDaysFromNow = new Date();
    
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    
    // Count vulnerabilities by vendor
    const byVendor: Record<string, number> = {};
    catalog.vulnerabilities.forEach(vuln => {
      if (!byVendor[vuln.vendorProject]) {
        byVendor[vuln.vendorProject] = 0;
      }
      byVendor[vuln.vendorProject]++;
    });
    
    // Count vulnerabilities added in the last 30 days
    const addedLast30Days = catalog.vulnerabilities.filter(vuln => {
      const addedDate = new Date(vuln.dateAdded);
      return addedDate >= thirtyDaysAgo;
    }).length;
    
    // Count vulnerabilities added in the last 90 days
    const addedLast90Days = catalog.vulnerabilities.filter(vuln => {
      const addedDate = new Date(vuln.dateAdded);
      return addedDate >= ninetyDaysAgo;
    }).length;
    
    // Count vulnerabilities due for remediation in the next 14 days
    const remediationDueSoon = catalog.vulnerabilities.filter(vuln => {
      const dueDate = new Date(vuln.dueDate);
      return dueDate >= now && dueDate <= fourteenDaysFromNow;
    }).length;
    
    return {
      totalVulnerabilities: catalog.count,
      addedLast30Days,
      addedLast90Days,
      byVendor,
      remediationDueSoon,
    };
  }