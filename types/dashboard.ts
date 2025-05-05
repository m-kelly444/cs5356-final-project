// Type definitions for dashboard components and UI elements

import { 
    NormalizedVulnerability, 
    CyberAttack, 
    ThreatActor, 
    PredictionResult, 
    Indicator,
    KevStatistics
  } from './threat-data';
  
  // Dashboard layouts and configurations
  export interface DashboardLayout {
    id: string;
    userId: string;
    name: string;
    layout: DashboardLayoutItem[];
    createdAt: number;
    updatedAt: number;
  }
  
  export interface DashboardLayoutItem {
    id: string;
    componentType: string;
    x: number;
    y: number;
    width: number;
    height: number;
    config?: Record<string, any>;
  }
  
  // Attack Map component
  export interface AttackMapProps {
    attacks: CyberAttack[];
    threatActors?: Record<string, ThreatActor>;
    filter?: AttackMapFilter;
  }
  
  export interface AttackMapFilter {
    timeframe?: string;
    attackTypes?: string[];
    regions?: string[];
    sectors?: string[];
    minImpact?: number;
  }
  
  export interface AttackNode {
    id: string;
    source: [number, number]; // [longitude, latitude]
    target: [number, number]; // [longitude, latitude]
    attackType: string;
    impactLevel: number;
    date: string;
    sector: string;
    region: string;
  }
  
  // Threat Meter component
  export interface ThreatMeterProps {
    level: number; // 0-100
    previousLevel?: number;
    label?: string;
  }
  
  // Stats Grid component
  export interface StatsGridProps {
    kevStats: {
      totalVulnerabilities: number;
      addedLast30Days: number;
      addedLast90Days: number;
      remediationDueSoon: number;
      byVendor?: Record<string, number>;
    };
    vulnerabilityCount: {
      total: number;
      critical: number;
    };
    attackStats: {
      recentCount: number;
      predictedCount: number;
    };
  }
  
  export interface StatCard {
    title: string;
    value: number;
    trend: 'up' | 'down' | 'neutral';
    description: string;
    refKey: string;
    color: string;
    textColor: string;
  }
  
  // Prediction Card component
  export interface PredictionCardProps {
    prediction: {
      id: string;
      targetType: string;
      targetValue: string;
      attackType?: string;
      probability: number;
      severity: number;
      confidence: number;
      generatedDate: number | string;
      explanation: string;
    };
  }
  
  // Vulnerability Table component
  export interface VulnerabilityTableProps {
    vulnerabilities: {
      id: string;
      title: string;
      severity: string;
      score: number;
      published: string;
      vector?: string;
    }[];
  }
  
  // Threat Card component
  export interface ThreatCardProps {
    threat: {
      id: string;
      title: string;
      type: 'attack' | 'vulnerability' | 'prediction' | 'indicator';
      severity: number;
      description: string;
      date: number | string;
      source?: string;
      tags?: string[];
      details?: any;
    };
  }
  
  // Dashboard Filters
  export interface DashboardFilters {
    timeframe: string;
    attackTypes: string[];
    regions: string[];
    sectors: string[];
    severityLevels: string[];
    threatActors: string[];
    showPredictions: boolean;
    showVulnerabilities: boolean;
    showAttacks: boolean;
    showIndicators: boolean;
  }
  
  // Dashboard Overview Stats
  export interface DashboardOverviewStats {
    globalThreatLevel: number;
    trendDirection: 'up' | 'down' | 'neutral';
    trendPercentage: number;
    criticalVulnerabilities: number;
    activeThreats: number;
    predictedAttacks: number;
    topTargetedSector: string;
    topAttackType: string;
  }
  
  // Dashboard Alert
  export interface DashboardAlert {
    id: string;
    userId: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'vulnerability' | 'attack' | 'prediction' | 'indicator';
    relatedItemId: string;
    relatedItemType: string;
    createdAt: number;
    read: boolean;
    readAt?: number;
  }
  
  // Threat Timeline Event
  export interface ThreatTimelineEvent {
    id: string;
    type: 'attack' | 'vulnerability' | 'prediction' | 'indicator' | 'system';
    title: string;
    description: string;
    timestamp: number;
    severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
    relatedItemId?: string;
    relatedItemType?: string;
    icon?: string;
  }
  
  // Region Risk Map data
  export interface RegionRiskMapData {
    regions: Record<string, {
      code: string;
      name: string;
      threatLevel: number;
      recentAttacks: number;
      predictedAttacks: number;
      criticalVulnerabilities: number;
      topAttackType?: string;
    }>;
  }
  
  // Sector Risk Analysis data
  export interface SectorRiskAnalysisData {
    sectors: Record<string, {
      name: string;
      threatLevel: number;
      recentAttacks: number;
      predictedAttacks: number;
      criticalVulnerabilities: number;
      topAttackType?: string;
      trend: 'up' | 'down' | 'neutral';
    }>;
  }