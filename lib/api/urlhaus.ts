declare const Buffer: {
  from(data: string): { toString(encoding: string): string };
};

/**
 * URLhaus API Client
 * 
 * This module provides functions to interact with the URLhaus API for
 * retrieving information about malicious URLs.
 * 
 * API Documentation: https://urlhaus.abuse.ch/api/
 */

// API base URL
const URLHAUS_API_URL = 'https://urlhaus-api.abuse.ch/v1';

/**
 * Make a request to the URLhaus API
 */
async function urlhausApiRequest(endpoint: string, data?: any) {
  const options: RequestInit = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Accept': 'application/json',
    },
  };
  
  // Add request body if provided
  if (data) {
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    };
    options.body = JSON.stringify(data);
  }
  
  // Make the request
  const response = await fetch(`${URLHAUS_API_URL}${endpoint}`, options);
  
  // Handle errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`URLhaus API error (${response.status}): ${errorText}`);
  }
  
  // Parse and return the response
  return await response.json();
}

/**
 * Query URL information
 */
export async function queryUrl(url: string) {
  return urlhausApiRequest('/url/', { url });
}

/**
 * Query payload (file hash) information
 */
export async function queryPayload(hash: string) {
  return urlhausApiRequest('/payload/', { hash });
}

/**
 * Query host information (IP address or domain)
 */
export async function queryHost(host: string) {
  return urlhausApiRequest('/host/', { host });
}

/**
 * Search for tags
 */
export async function queryTag(tag: string) {
  return urlhausApiRequest('/tag/', { tag });
}

/**
 * Get recent submissions
 */
export async function getRecentSubmissions() {
  return urlhausApiRequest('/submissions/');
}

/**
 * Convert URLhaus URL result to normalized format
 */
export function normalizeUrlResult(result: any) {
  // Skip if query was not successful
  if (result.query_status !== 'ok') {
    return null;
  }
  
  return {
    id: result.id || `urlhaus-${Buffer.from(result.url).toString('base64')}`,
    type: 'url',
    url: result.url,
    status: result.url_status,
    dateAdded: result.date_added,
    threatType: result.threat || 'unknown',
    tags: result.tags || [],
    reporter: result.reporter || 'anonymous',
    payloads: (result.payloads || []).map((payload: any) => ({
      filename: payload.filename || 'unknown',
      filesize: payload.file_size || 0,
      filetype: payload.file_type || 'unknown',
      md5: payload.response_md5 || '',
      sha256: payload.response_sha256 || '',
      signature: payload.signature || '',
    })),
    source: 'URLhaus',
    malicious: true, // URLhaus only tracks malicious URLs
  };
}

/**
 * Convert URLhaus payload result to normalized format
 */
export function normalizePayloadResult(result: any) {
  // Skip if query was not successful
  if (result.query_status !== 'ok') {
    return null;
  }
  
  return {
    id: result.sha256_hash,
    type: 'file',
    sha256: result.sha256_hash,
    md5: result.md5_hash,
    sha1: result.sha1_hash,
    filesize: result.file_size,
    filetype: result.file_type,
    filename: result.filename || 'unknown',
    signature: result.signature,
    firstSeen: result.firstseen,
    urlCount: result.urlhaus_download,
    tags: result.tags || [],
    urls: (result.urls || []).map((url: any) => ({
      url: url.url,
      status: url.url_status,
      dateAdded: url.date_added,
      reporter: url.reporter || 'anonymous',
    })),
    source: 'URLhaus',
    malicious: true, // URLhaus only tracks malicious payloads
  };
}

/**
 * Convert URLhaus host result to normalized format
 */
export function normalizeHostResult(result: any) {
  // Skip if query was not successful
  if (result.query_status !== 'ok') {
    return null;
  }
  
  // Determine if this is an IP or domain
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(result.host);
  
  return {
    id: `urlhaus-${result.host}`,
    type: isIp ? 'ip' : 'domain',
    host: result.host,
    dateAdded: result.firstseen,
    urlCount: result.url_count,
    blacklists: result.blacklists || {},
    urls: (result.urls || []).map((url: any) => ({
      id: url.id,
      url: url.url,
      status: url.url_status,
      dateAdded: url.date_added,
      threatType: url.threat || 'unknown',
      tags: url.tags || [],
      reporter: url.reporter || 'anonymous',
    })),
    source: 'URLhaus',
    malicious: true, // URLhaus only tracks malicious hosts
  };
}

/**
 * Convert URLhaus tag results to normalized format
 */
export function normalizeTagResults(result: any) {
  // Skip if query was not successful
  if (result.query_status !== 'ok') {
    return null;
  }
  
  return {
    tag: result.tag,
    urlCount: result.url_count,
    urls: (result.urls || []).map((url: any) => ({
      id: url.id,
      url: url.url,
      status: url.url_status,
      dateAdded: url.date_added,
      threatType: url.threat || 'unknown',
      tags: url.tags || [],
      reporter: url.reporter || 'anonymous',
    })),
    source: 'URLhaus',
  };
}

/**
 * Convert URLhaus recent submissions to normalized format
 */
export function normalizeRecentSubmissions(result: any) {
  if (!result.urls || !Array.isArray(result.urls)) {
    return [];
  }
  
  return result.urls.map((url: any) => ({
    id: url.id,
    type: 'url',
    url: url.url,
    status: url.url_status,
    dateAdded: url.date_added,
    threatType: url.threat || 'unknown',
    tags: url.tags || [],
    reporter: url.reporter || 'anonymous',
    source: 'URLhaus',
    malicious: true, // URLhaus only tracks malicious URLs
  }));
}