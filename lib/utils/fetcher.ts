/**
 * Utility functions for data fetching and API calls
 */

interface FetcherOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    cache?: RequestCache;
    next?: {
      revalidate?: number | false;
      tags?: string[];
    };
  }
  
  interface CustomRequestInit extends RequestInit {
    next?: {
      revalidate?: number | false;
      tags?: string[];
    };
  }
  
  /**
   * Fetches data from an API with error handling and request options
   */
  export async function fetcher<T = any>(
    url: string,
    options: FetcherOptions = {}
  ): Promise<T> {
    // Destructure options with defaults
    const {
      method = 'GET',
      headers = {},
      body,
      cache = 'default',
      next,
    } = options;
    
    // Prepare headers with content type if not provided
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };
    
    // Prepare request options
    const requestOptions: CustomRequestInit = {
      method,
      headers: requestHeaders,
      cache,
      next,
    };
    
    // Add body if provided
    if (body !== undefined) {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    try {
      // Make the request
      const response = await fetch(url, requestOptions);
      
      // Handle unsuccessful responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new FetchError(
          `API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      // Parse JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      // Re-throw FetchError
      if (error instanceof FetchError) {
        throw error;
      }
      
      // Convert other errors to FetchError
      throw new FetchError(
        error instanceof Error ? error.message : 'Unknown error',
        0
      );
    }
  }
  
  /**
   * Custom error class for fetch errors
   */
  export class FetchError extends Error {
    status: number;
    data?: any;
    
    constructor(message: string, status: number, data?: any) {
      super(message);
      this.name = 'FetchError';
      this.status = status;
      this.data = data;
    }
  }
  
  /**
   * Fetches data from the threat data API
   */
  export async function fetchThreatData<T = any>(
    endpoint: string,
    options: FetcherOptions = {}
  ): Promise<T> {
    return fetcher<T>(`/api/threat-data/${endpoint}`, options);
  }
  
  /**
   * Gets CISA KEV data
   */
  export async function fetchCisaKevData(params: Record<string, string> = {}) {
    // Convert params to query string
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/threat-data/cisa${queryString ? `?${queryString}` : ''}`;
    
    return fetcher(url);
  }
  
  /**
   * Gets NVD vulnerability data
   */
  export async function fetchNvdData(params: Record<string, string> = {}) {
    // Convert params to query string
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/threat-data/nvd${queryString ? `?${queryString}` : ''}`;
    
    return fetcher(url);
  }
  
  /**
   * Gets prediction data
   */
  export async function fetchPredictionData(params: Record<string, string> = {}) {
    // Convert params to query string
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/threat-data/predictions${queryString ? `?${queryString}` : ''}`;
    
    return fetcher(url);
  }
  
  /**
   * Makes a prediction
   */
  export async function makePrediction(data: any) {
    return fetcher(`/api/threat-data/predictions`, {
      method: 'POST',
      body: data,
    });
  }
  
  /**
   * Gets dashboard stats
   */
  export async function fetchDashboardStats() {
    return fetcher(`/api/threat-data/stats`);
  }