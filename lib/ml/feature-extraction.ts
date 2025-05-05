/**
 * Feature Extraction Module
 * 
 * This module handles extracting and processing features from raw data
 * for use in machine learning models.
 */

import * as tf from '@tensorflow/tfjs';
import { 
  NormalizedVulnerability, 
  CyberAttack, 
  ThreatActor,
  Indicator
} from '@/types/threat-data';

/**
 * Feature extraction configuration
 */
export interface FeatureExtractionConfig {
  includeSectors?: boolean;
  includeRegions?: boolean;
  includeAttackTypes?: boolean;
  includeThreatActors?: boolean;
  includeVulnerabilities?: boolean;
  includeTimeSeries?: boolean;
  timeSeriesLength?: number;
}

/**
 * Default feature extraction configuration
 */
const DEFAULT_CONFIG: FeatureExtractionConfig = {
  includeSectors: true,
  includeRegions: true,
  includeAttackTypes: true,
  includeThreatActors: true,
  includeVulnerabilities: true,
  includeTimeSeries: false,
  timeSeriesLength: 10,
};

/**
 * Sector categories for one-hot encoding
 */
export const SECTOR_CATEGORIES = [
  'financial',
  'healthcare',
  'government',
  'education',
  'technology',
  'manufacturing',
  'energy',
  'retail',
  'transportation',
  'telecommunications',
  'media',
  'other',
];

/**
 * Region categories for one-hot encoding
 */
export const REGION_CATEGORIES = [
  'north_america',
  'south_america',
  'europe',
  'asia',
  'africa',
  'oceania',
  'middle_east',
];

/**
 * Attack type categories for one-hot encoding
 */
export const ATTACK_TYPE_CATEGORIES = [
  'ransomware',
  'data_breach',
  'ddos',
  'phishing',
  'zero_day',
  'supply_chain',
  'malware',
  'insider_threat',
  'social_engineering',
  'other',
];

/**
 * Extract features from attack data
 */
export function extractFeaturesFromAttacks(
  attacks: CyberAttack[],
  config: FeatureExtractionConfig = DEFAULT_CONFIG
): { features: tf.Tensor2D; featureNames: string[] } {
  const featureVectors: number[][] = [];
  const featureNames: string[] = [];
  
  // Process each attack
  for (const attack of attacks) {
    const featureVector: number[] = [];
    
    // Basic numerical features
    featureVector.push(attack.impactLevel || 0);
    featureNames.push('impact_level');
    
    featureVector.push(attack.attackDate || 0);
    featureNames.push('attack_date');
    
    // Process sector (one-hot encoding)
    if (config.includeSectors) {
      const sectorOneHot = oneHotEncodeSector(attack.targetedSector);
      featureVector.push(...sectorOneHot);
      SECTOR_CATEGORIES.forEach(sector => featureNames.push(`sector_${sector}`));
    }
    
    // Process region (one-hot encoding)
    if (config.includeRegions) {
      const regionOneHot = oneHotEncodeRegion(attack.targetedRegion);
      featureVector.push(...regionOneHot);
      REGION_CATEGORIES.forEach(region => featureNames.push(`region_${region}`));
    }
    
    // Process attack type (one-hot encoding)
    if (config.includeAttackTypes) {
      const attackTypeOneHot = oneHotEncodeAttackType(attack.attackType);
      featureVector.push(...attackTypeOneHot);
      ATTACK_TYPE_CATEGORIES.forEach(type => featureNames.push(`attack_type_${type}`));
    }
    
    // Add to feature vectors
    featureVectors.push(featureVector);
  }
  
  // Convert to tensor
  return {
    features: tf.tensor2d(featureVectors),
    featureNames,
  };
}

/**
 * Extract features from vulnerability data
 */
export function extractFeaturesFromVulnerabilities(
  vulnerabilities: NormalizedVulnerability[]
): { features: tf.Tensor2D; featureNames: string[] } {
  const featureVectors: number[][] = [];
  const featureNames: string[] = [];
  
  // Process each vulnerability
  for (const vuln of vulnerabilities) {
    const featureVector: number[] = [];
    
    // Basic numerical features
    featureVector.push(vuln.cvssScore || 0);
    featureNames.push('cvss_score');
    
    featureVector.push(vuln.exploitedInWild ? 1 : 0);
    featureNames.push('exploited_in_wild');
    
    featureVector.push(new Date(vuln.publishedDate).getTime());
    featureNames.push('published_date');
    
    // Attack vector (simplified encoding)
    const attackVectorValue = encodeAttackVector(vuln.attackVector);
    featureVector.push(attackVectorValue);
    featureNames.push('attack_vector');
    
    // Add affected systems count
    let affectedSystemsCount = 0;
    try {
      affectedSystemsCount = (typeof vuln.affectedSystems === 'string' 
        ? JSON.parse(vuln.affectedSystems) 
        : vuln.affectedSystems || []).length;
    } catch (e) {
      affectedSystemsCount = 0;
    }
    
    featureVector.push(affectedSystemsCount);
    featureNames.push('affected_systems_count');
    
    // Add to feature vectors
    featureVectors.push(featureVector);
  }
  
  // Convert to tensor
  return {
    features: tf.tensor2d(featureVectors),
    featureNames,
  };
}

/**
 * Extract features for predicting attacks against a specific target
 */
export function extractTargetFeatures(
  target: {
    type: string;
    value: string;
    sector?: string;
    region?: string;
    recentVulnerabilities?: number;
    avgVulnSeverity?: number;
    historicalAttackFrequency?: number;
    daysSinceLastAttack?: number;
  }
): { features: tf.Tensor1D; featureNames: string[] } {
  const featureVector: number[] = [];
  const featureNames: string[] = [];
  
  // Handle numerical features
  featureVector.push(target.recentVulnerabilities || 0);
  featureNames.push('recent_vulnerabilities');
  
  featureVector.push(target.avgVulnSeverity || 0);
  featureNames.push('avg_vuln_severity');
  
  featureVector.push(target.historicalAttackFrequency || 0);
  featureNames.push('historical_attack_frequency');
  
  featureVector.push(target.daysSinceLastAttack || 0);
  featureNames.push('days_since_last_attack');
  
  // Process sector (one-hot encoding)
  const sector = target.sector || (target.type === 'sector' ? target.value : '');
  if (sector) {
    const sectorOneHot = oneHotEncodeSector(sector);
    featureVector.push(...sectorOneHot);
    SECTOR_CATEGORIES.forEach(s => featureNames.push(`sector_${s}`));
  } else {
    // Add zeros for all sectors
    featureVector.push(...Array(SECTOR_CATEGORIES.length).fill(0));
    SECTOR_CATEGORIES.forEach(s => featureNames.push(`sector_${s}`));
  }
  
  // Process region (one-hot encoding)
  const region = target.region || (target.type === 'region' ? target.value : '');
  if (region) {
    const regionOneHot = oneHotEncodeRegion(region);
    featureVector.push(...regionOneHot);
    REGION_CATEGORIES.forEach(r => featureNames.push(`region_${r}`));
  } else {
    // Add zeros for all regions
    featureVector.push(...Array(REGION_CATEGORIES.length).fill(0));
    REGION_CATEGORIES.forEach(r => featureNames.push(`region_${r}`));
  }
  
  // Convert to tensor
  return {
    features: tf.tensor1d(featureVector),
    featureNames,
  };
}

/**
 * Helper function to one-hot encode sectors
 */
function oneHotEncodeSector(sector: string): number[] {
  const sectorLower = (sector || '').toLowerCase();
  return SECTOR_CATEGORIES.map(category => 
    sectorLower.includes(category) ? 1 : 0
  );
}

/**
 * Helper function to one-hot encode regions
 */
function oneHotEncodeRegion(region: string): number[] {
  const regionLower = (region || '').toLowerCase();
  
  // Map region variations to categories
  const regionMapping: Record<string, string[]> = {
    'north_america': ['north america', 'usa', 'canada', 'mexico', 'united states'],
    'south_america': ['south america', 'latin america', 'brazil', 'argentina'],
    'europe': ['europe', 'eu', 'european union', 'uk', 'britain', 'germany', 'france'],
    'asia': ['asia', 'china', 'japan', 'india', 'korea', 'southeast asia'],
    'africa': ['africa', 'north africa', 'south africa', 'central africa'],
    'oceania': ['oceania', 'australia', 'new zealand', 'pacific'],
    'middle_east': ['middle east', 'saudi arabia', 'uae', 'israel', 'iran'],
  };
  
  return REGION_CATEGORIES.map(category => {
    const variations = regionMapping[category] || [category];
    return variations.some(v => regionLower.includes(v)) ? 1 : 0;
  });
}

/**
 * Helper function to one-hot encode attack types
 */
function oneHotEncodeAttackType(attackType: string): number[] {
  const typeLower = (attackType || '').toLowerCase();
  
  // Map attack type variations to categories
  const typeMapping: Record<string, string[]> = {
    'ransomware': ['ransomware', 'ransom', 'encryption'],
    'data_breach': ['data breach', 'breach', 'leak', 'exfiltration'],
    'ddos': ['ddos', 'denial of service', 'dos'],
    'phishing': ['phishing', 'spear phishing', 'whaling'],
    'zero_day': ['zero day', '0day', 'zero-day', 'unknown vulnerability'],
    'supply_chain': ['supply chain', 'third party', 'vendor'],
    'malware': ['malware', 'virus', 'trojan', 'worm'],
    'insider_threat': ['insider', 'employee', 'internal'],
    'social_engineering': ['social engineering', 'pretexting', 'baiting'],
  };
  
  return ATTACK_TYPE_CATEGORIES.map(category => {
    const variations = typeMapping[category] || [category];
    return variations.some(v => typeLower.includes(v)) ? 1 : 0;
  });
}

/**
 * Helper function to encode attack vectors
 */
function encodeAttackVector(vector: string): number {
  // Convert CVSS attack vector to numeric value
  // Higher value = more accessible/easier to exploit
  const vectorLower = (vector || '').toLowerCase();
  
  if (vectorLower.includes('network')) return 1.0;
  if (vectorLower.includes('adjacent')) return 0.75;
  if (vectorLower.includes('local')) return 0.5;
  if (vectorLower.includes('physical')) return 0.25;
  
  return 0.5; // Default value
}

/**
 * Normalize features using min-max scaling
 */
export function normalizeFeatures(
  features: tf.Tensor2D
): tf.Tensor2D {
  const min = features.min(0, true);
  const max = features.max(0, true);
  const range = max.sub(min);
  
  // Avoid division by zero by adding a small epsilon where range is 0
  const epsilon = 1e-7;
  const rangeWithEpsilon = range.add(epsilon);
  
  return features.sub(min).div(rangeWithEpsilon);
}

/**
 * Encode categorical features with label encoding
 */
export function labelEncodeFeatures(
  features: string[],
  categories: Record<string, string[]>
): number[] {
  return features.map(feature => {
    for (const [index, categoryValues] of Object.entries(categories)) {
      if (categoryValues.some(value => feature.includes(value))) {
        return parseInt(index);
      }
    }
    return -1; // Unknown category
  });
}