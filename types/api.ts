// Type definitions for API requests and responses

import {
    CisaKevVulnerability,
    CisaKevCatalog,
    KevStatistics,
    NvdVulnerability,
    NormalizedVulnerability,
    CyberAttack,
    ThreatActor,
    PredictionResult,
    PredictionModel,
    Indicator
  } from './threat-data';
  
  // Generic API response
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
  }
  
  // Error response
  export interface ApiError {
    code: string;
    message: string;
    details?: any;
  }
  
  // Pagination params
  export interface PaginationParams {
    page?: number;
    pageSize?: number;
    startIndex?: number;
    limit?: number;
  }
  
  // Common filter parameters
  export interface FilterParams {
    from?: string | number; // date or timestamp
    to?: string | number; // date or timestamp
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    query?: string;
    [key: string]: any; // Additional filters
  }
  
  // CISA KEV API Endpoints
  
  // GET /api/threat-data/cisa
  export interface CisaKevCatalogResponse extends ApiResponse<CisaKevCatalog> {}
  
  // GET /api/threat-data/cisa/stats
  export interface CisaKevStatsResponse extends ApiResponse<KevStatistics> {}
  
  // GET /api/threat-data/cisa/:cveId
  export interface CisaKevVulnerabilityResponse extends ApiResponse<CisaKevVulnerability | null> {}
  
  // NVD API Endpoints
  
  // GET /api/threat-data/nvd/vulnerabilities
  export interface NvdVulnerabilityParams extends PaginationParams, FilterParams {
    cveId?: string;
    keywordSearch?: string;
    pubStartDate?: string;
    pubEndDate?: string;
    lastModStartDate?: string;
    lastModEndDate?: string;
    cvssV3Severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    cvssV2Severity?: 'HIGH' | 'MEDIUM' | 'LOW';
    cpeName?: string;
    isExploitable?: boolean;
  }
  
  export interface NvdVulnerabilityResponse extends ApiResponse<NvdVulnerability[]> {
    totalResults: number;
    resultsPerPage: number;
    startIndex: number;
  }
  
  // GET /api/threat-data/nvd/vulnerability/:cveId
  export interface NvdVulnerabilityDetailResponse extends ApiResponse<NvdVulnerability | null> {}
  
  // Predictions API Endpoints
  
  // POST /api/threat-data/predictions
  export interface PredictionRequestBody {
    targetType: string;
    targetValue: string;
    recentVulnerabilities?: number;
    avgVulnSeverity?: number;
    historicalAttackFrequency?: number;
    daysSinceLastAttack?: number;
    region?: string;
    sector?: string;
  }
  
  export interface PredictionResponse extends ApiResponse<PredictionResult> {}
  
  // GET /api/threat-data/predictions/sectors
  export interface SectorPredictionsResponse extends ApiResponse<{
    sector: string;
    threatLevel: number;
    topAttackType: string;
    probability: number;
  }[]> {}
  
  // GET /api/threat-data/predictions/recent
  export interface RecentPredictionsParams extends PaginationParams {
    minProbability?: number;
    limit?: number;
  }
  
  export interface RecentPredictionsResponse extends ApiResponse<PredictionResult[]> {}
  
  // Stats API Endpoints
  
  // GET /api/threat-data/stats
  export interface StatsResponse extends ApiResponse<{
    kevStats: KevStatistics;
    vulnerabilityCount: {
      total: number;
      critical: number;
      exploitedInWild: number;
    };
    attackStats: {
      recentCount: number;
      predictedCount: number;
      byType: Record<string, number>;
      byRegion: Record<string, number>;
    };
  }> {}
  
  // Dashboard API Types
  
  // GET /api/dashboard/threats
  export interface ThreatsListParams extends PaginationParams, FilterParams {
    type?: string;
    region?: string;
    sector?: string;
    minSeverity?: number;
  }
  
  export interface ThreatsListResponse extends ApiResponse<{
    attacks: CyberAttack[];
    vulnerabilities: NormalizedVulnerability[];
    predictions: PredictionResult[];
    indicators: Indicator[];
    totalCount: number;
  }> {}
  
  // GET /api/dashboard/attack-map
  export interface AttackMapDataResponse extends ApiResponse<{
    attacks: CyberAttack[];
    threatActors: Record<string, ThreatActor>;
    regionData: Record<string, {
      attacks: number;
      predictedAttacks: number;
      threatLevel: number;
    }>;
  }> {}
  
  // Webhook API Types
  
  // POST /api/webhooks
  export interface WebhookPayload {
    type: string;
    data: any;
    signature?: string;
    timestamp: number;
  }
  
  export interface WebhookResponse extends ApiResponse<{
    received: boolean;
    processed: boolean;
  }> {}