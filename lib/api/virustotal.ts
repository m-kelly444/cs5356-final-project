/**
 * VirusTotal API Client
 * 
 * This module provides functions to interact with the VirusTotal API for
 * retrieving malware analysis data.
 * 
 * API Documentation: https://developers.virustotal.com/reference/overview
 */

declare const Buffer: {
  from(data: string): { toString(encoding: string): string };
};

// API base URL and configuration
const VT_API_BASE_URL = 'https://www.virustotal.com/api/v3';
const VT_API_KEY = (process.env as any)['VIRUSTOTAL_API_KEY'];

// Check if API key is configured
if (!VT_API_KEY) {
  console.warn('VirusTotal API key not configured. API calls will not work.');
}

/**
 * Make an authenticated request to the VirusTotal API
 */
async function vtApiRequest(endpoint: string, options: RequestInit = {}) {
  // Ensure API key is available
  if (!VT_API_KEY) {
    throw new Error('VirusTotal API key not configured');
  }
  
  // Set up default headers
  const headers = {
    'x-apikey': VT_API_KEY,
    'Accept': 'application/json',
    ...options.headers,
  };
  
  // Make the request
  const response = await fetch(`${VT_API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // Handle errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`VirusTotal API error (${response.status}): ${errorText}`);
  }
  
  // Parse and return the response
  return await response.json();
}

/**
 * Get file report by hash (MD5, SHA-1, or SHA-256)
 */
export async function getFileReport(hash: string) {
  return vtApiRequest(`/files/${hash}`);
}

/**
 * Get URL report
 */
export async function getUrlReport(url: string) {
  // URL needs to be URL-encoded and base64-encoded
  const encodedUrl = Buffer.from(encodeURIComponent(url)).toString('base64');
  return vtApiRequest(`/urls/${encodedUrl}`);
}

/**
 * Get domain report
 */
export async function getDomainReport(domain: string) {
  return vtApiRequest(`/domains/${domain}`);
}

/**
 * Get IP address report
 */
export async function getIpReport(ip: string) {
  return vtApiRequest(`/ip_addresses/${ip}`);
}

/**
 * Submit a URL for scanning
 */
export async function scanUrl(url: string) {
  return vtApiRequest('/urls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `url=${encodeURIComponent(url)}`,
  });
}

/**
 * Convert VirusTotal file report to normalized format
 */
export function normalizeFileReport(report: any) {
  const data = report.data;
  const attributes = data.attributes;
  
  return {
    id: data.id,
    type: 'file',
    name: attributes.meaningful_name || attributes.name || data.id,
    sha256: data.id,
    sha1: attributes.sha1,
    md5: attributes.md5,
    size: attributes.size,
    fileType: attributes.type_tag || attributes.type_description || 'unknown',
    firstSeen: new Date(attributes.first_submission_date * 1000).toISOString(),
    lastSeen: new Date(attributes.last_analysis_date * 1000).toISOString(),
    detectionRate: `${attributes.last_analysis_stats.malicious}/${Object.keys(attributes.last_analysis_results).length}`,
    detectionRatio: attributes.last_analysis_stats.malicious / Object.keys(attributes.last_analysis_results).length,
    malicious: attributes.last_analysis_stats.malicious > 0,
    tags: attributes.tags || [],
    signatures: attributes.signature_info || {},
    source: 'VirusTotal',
  };
}

/**
 * Convert VirusTotal URL report to normalized format
 */
export function normalizeUrlReport(report: any) {
  const data = report.data;
  const attributes = data.attributes;
  
  return {
    id: data.id,
    type: 'url',
    url: attributes.url,
    firstSeen: new Date(attributes.first_submission_date * 1000).toISOString(),
    lastSeen: new Date(attributes.last_analysis_date * 1000).toISOString(),
    detectionRate: `${attributes.last_analysis_stats.malicious}/${Object.keys(attributes.last_analysis_results).length}`,
    detectionRatio: attributes.last_analysis_stats.malicious / Object.keys(attributes.last_analysis_results).length,
    malicious: attributes.last_analysis_stats.malicious > 0,
    categories: attributes.categories || {},
    tags: attributes.tags || [],
    source: 'VirusTotal',
  };
}

/**
 * Convert a domain report to normalized format
 */
export function normalizeDomainReport(report: any) {
  const data = report.data;
  const attributes = data.attributes;
  
  return {
    id: data.id,
    type: 'domain',
    domain: data.id,
    creationDate: attributes.creation_date 
      ? new Date(attributes.creation_date * 1000).toISOString() 
      : undefined,
    lastDnsRecords: attributes.last_dns_records || [],
    lastHttpsCertificate: attributes.last_https_certificate || {},
    categories: attributes.categories || {},
    detectionRate: `${attributes.last_analysis_stats.malicious}/${Object.keys(attributes.last_analysis_results).length}`,
    detectionRatio: attributes.last_analysis_stats.malicious / Object.keys(attributes.last_analysis_results).length,
    malicious: attributes.last_analysis_stats.malicious > 0,
    tags: attributes.tags || [],
    source: 'VirusTotal',
  };
}

/**
 * Convert an IP report to normalized format
 */
export function normalizeIpReport(report: any) {
  const data = report.data;
  const attributes = data.attributes;
  
  return {
    id: data.id,
    type: 'ip',
    ip: data.id,
    country: attributes.country || 'Unknown',
    asn: attributes.asn || 0,
    asnOwner: attributes.as_owner || 'Unknown',
    lastHttpsCertificates: attributes.last_https_certificates || [],
    detectionRate: `${attributes.last_analysis_stats.malicious}/${Object.keys(attributes.last_analysis_results).length}`,
    detectionRatio: attributes.last_analysis_stats.malicious / Object.keys(attributes.last_analysis_results).length,
    malicious: attributes.last_analysis_stats.malicious > 0,
    tags: attributes.tags || [],
    source: 'VirusTotal',
  };
}