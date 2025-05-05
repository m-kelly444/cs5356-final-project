// Type definitions for cybersecurity threat data

// CISA KEV (Known Exploited Vulnerabilities) data types
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
  
  export interface KevStatistics {
    totalVulnerabilities: number;
    addedLast30Days: number;
    addedLast90Days: number;
    byVendor: Record<string, number>;
    remediationDueSoon: number;
  }
  
  // NVD (National Vulnerability Database) data types
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
      metrics?: {
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
  
  export interface NvdApiResponse<T> {
    resultsPerPage: number;
    startIndex: number;
    totalResults: number;
    format: string;
    version: string;
    timestamp: string;
    vulnerabilities: T[];
  }
  
  // Normalized vulnerability data for display and ML processing
  export interface NormalizedVulnerability {
    id: string;
    title: string;
    description: string;
    severity: string; // CRITICAL, HIGH, MEDIUM, LOW
    score: number; // CVSS score (0-10)
    published: string; // ISO date string
    lastModified: string; // ISO date string
    exploitedInWild: boolean;
    attackVector?: string;
    vendorName: string;
    productName: string;
    references: string[];
    sourceData: any; // Original source data
  }
  
  // Cyber attack data types
  export interface CyberAttack {
    id: string;
    title: string;
    description: string;
    attackDate: number; // Timestamp
    discoveredDate: number; // Timestamp
    attackType: string;
    threatActorId?: string;
    vulnerabilitiesExploited?: string[]; // Array of CVE IDs
    targetedSector: string;
    targetedRegion: string;
    impactLevel: number; // 0-10
    techniquesUsed?: string[]; // Array of MITRE ATT&CK techniques
    indicators?: string[]; // Array of IoCs
    source: string;
    sourceUrl?: string;
  }
  
  // Threat actor data
  export interface ThreatActor {
    id: string;
    name: string;
    aliases?: string[];
    description: string;
    nationState?: string;
    motivations?: string[];
    sophisticationLevel?: string;
    firstSeen?: number; // Timestamp
    lastSeen?: number; // Timestamp
    associatedGroups?: string[];
    targetedSectors?: string[];
    targetedRegions?: string[];
    techniques?: string[];
  }
  
  // ML prediction data types
  export interface PredictionInput {
    targetType: string; // 'sector', 'region', 'organization'
    targetValue: string;
    recentVulnerabilities?: number;
    avgVulnSeverity?: number;
    historicalAttackFrequency?: number;
    daysSinceLastAttack?: number;
    region?: string;
    sector?: string;
    sophisticationLevel?: number;
  }
  
  export interface PredictionResult {
    id: string;
    modelId: string;
    generatedDate: number; // Timestamp
    predictedTimeframe: string; // e.g., 'next_30_days'
    targetType: string;
    targetValue: string;
    attackType?: string;
    probability: number; // 0-1
    severity: number; // 0-10
    confidence: number; // 0-1
    potentialVulnerabilities?: string[]; // Array of CVE IDs
    explanation: string;
    inputFeatures: any;
  }
  
  // Machine learning model data
  export interface PredictionModel {
    id: string;
    name: string;
    description: string;
    type: string;
    algorithm: string;
    version: string;
    parameters: any;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    trainingDate: number; // Timestamp
    lastUsed: number; // Timestamp
    filePath?: string;
  }
  
  // Indicators of Compromise (IoCs)
  export interface Indicator {
    id: string;
    type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
    value: string;
    maliciousScore: number; // 0-1
    firstSeen: number; // Timestamp
    lastSeen: number; // Timestamp
    source: string;
    associatedAttackTypes?: string[];
    tags?: string[];
    sourceData?: any;
  }