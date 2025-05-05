/**
 * Data processing utilities for ML models
 * 
 * This module handles the collection, preprocessing, and feature extraction
 * from various cybersecurity data sources.
 */

import * as tf from '@tensorflow/tfjs-node';
import { fetchCisaKevCatalog, CisaKevVulnerability } from '../api/cisa';
import { fetchVulnerabilities, NvdVulnerability } from '../api/nvd';
import { db } from '../db';
import { cyberAttacks, vulnerabilities, threatActors } from '../db/schema';
import { eq, lt, gt, and, desc } from 'drizzle-orm';

/**
 * Normalized vulnerability data structure for ML processing
 */
export interface NormalizedVulnerability {
  cveId: string;
  publishedDate: Date;
  cvssScore: number;
  exploitedInWild: boolean;
  attackVector: string;
  attackComplexity: string;
  privilegesRequired: string;
  userInteraction: string;
  impactScore: number;
  baseScore: number;
  vendorName: string;
  productName: string;
  affectedSystemsCount: number;
  daysToRemediate?: number;
}

/**
 * Normalized cyber attack data structure for ML processing
 */
export interface NormalizedAttack {
  id: string;
  attackDate: Date;
  attackType: string;
  targetedSector: string;
  targetedRegion: string;
  impactLevel: number;
  nationState?: string;
  vulnerabilitiesExploited: string[];
}

/**
 * Prepare training data for attack prediction models
 */
export async function prepareTrainingData() {
  // Get historical attack data
  const attacks = await db.select().from(cyberAttacks).orderBy(desc(cyberAttacks.attackDate));
  
  // Get vulnerability data
  const vulns = await db.select().from(vulnerabilities);
  
  // Get threat actor data
  const actors = await db.select().from(threatActors);
  
  // Create a lookup map for vulnerabilities by CVE ID
  const vulnMap = new Map();
  vulns.forEach(vuln => {
    vulnMap.set(vuln.id, vuln);
  });
  
  // Create a lookup map for threat actors by ID
  const actorMap = new Map();
  actors.forEach(actor => {
    actorMap.set(actor.id, actor);
  });
  
  // Process attack data
  const processedAttacks = attacks.map(attack => {
    const threatActor = attack.threatActorId ? actorMap.get(attack.threatActorId) : null;
    
    // Parse the vulnerabilitiesExploited JSON string
    let exploitedVulns: string[] = [];
    try {
      exploitedVulns = attack.vulnerabilitiesExploited 
        ? JSON.parse(attack.vulnerabilitiesExploited) 
        : [];
    } catch (e) {
      console.error('Error parsing vulnerabilitiesExploited:', e);
    }
    
    // Map used vulnerabilities to their details
    const vulnDetails = exploitedVulns
      .map(cveId => vulnMap.get(cveId))
      .filter(Boolean);
    
    // Calculate average severity of exploited vulnerabilities
    const avgSeverity = vulnDetails.length 
      ? vulnDetails.reduce((sum, v) => sum + v.severity, 0) / vulnDetails.length 
      : 0;
    
    // Create feature record
    return {
      id: attack.id,
      attackDate: new Date(attack.attackDate),
      attackType: attack.attackType,
      targetedSector: attack.targetedSector,
      targetedRegion: attack.targetedRegion,
      impactLevel: attack.impactLevel,
      nationState: threatActor?.nationState,
      threatActorSophistication: threatActor?.sophisticationLevel || 'unknown',
      exploitedVulnCount: exploitedVulns.length,
      avgVulnSeverity: avgSeverity,
      daysSinceFirstAttack: (attack.attackDate - attacks[attacks.length - 1].attackDate) / (1000 * 60 * 60 * 24),
    };
  });
  
  return processedAttacks;
}

/**
 * Fetch and normalize vulnerability data from multiple sources
 */
export async function fetchAndNormalizeVulnerabilities(
  limit = 1000
): Promise<NormalizedVulnerability[]> {
  // Fetch data from NVD
  const nvdResponse = await fetchVulnerabilities({
    resultPerPage: limit,
  });
  
  // Fetch data from CISA KEV
  const cisaKevCatalog = await fetchCisaKevCatalog();
  
  // Create a map for quick lookup of KEV vulnerabilities
  const kevMap = new Map<string, CisaKevVulnerability>();
  cisaKevCatalog.vulnerabilities.forEach(vuln => {
    kevMap.set(vuln.cveID, vuln);
  });
  
  // Process and normalize vulnerabilities
  const normalizedVulns: NormalizedVulnerability[] = [];
  
  for (const vulnerability of nvdResponse.vulnerabilities) {
    const cve = vulnerability.cve;
    const cveId = cve.id;
    
    // Get CVSS data, preferring CVSS v3 over v2
    const cvssV3 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
    const cvssV2 = cve.metrics?.cvssMetricV2?.[0]?.cvssData;
    
    // Check if this vulnerability is in the KEV catalog
    const isInKev = kevMap.has(cveId);
    const kevData = isInKev ? kevMap.get(cveId) : null;
    
    // Extract vendor and product from the first CPE match if available
    let vendorName = 'unknown';
    let productName = 'unknown';
    
    if (cve.configurations && cve.configurations.length > 0) {
      for (const config of cve.configurations) {
        for (const node of config.nodes) {
          for (const match of node.cpeMatch) {
            if (match.criteria) {
              // CPE format: cpe:2.3:a:vendor:product:version:...
              const parts = match.criteria.split(':');
              if (parts.length > 4) {
                vendorName = parts[3];
                productName = parts[4];
                break;
              }
            }
          }
          if (vendorName !== 'unknown') break;
        }
        if (vendorName !== 'unknown') break;
      }
    } else if (kevData) {
      vendorName = kevData.vendorProject;
      productName = kevData.product;
    }
    
    // Count affected systems from configurations
    let affectedSystemsCount = 0;
    if (cve.configurations) {
      for (const config of cve.configurations) {
        for (const node of config.nodes) {
          affectedSystemsCount += node.cpeMatch.length;
        }
      }
    }
    
    // Calculate days to remediate if in KEV
    let daysToRemediate: number | undefined = undefined;
    if (kevData) {
      const addedDate = new Date(kevData.dateAdded);
      const dueDate = new Date(kevData.dueDate);
      daysToRemediate = (dueDate.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
    }
    
    normalizedVulns.push({
      cveId,
      publishedDate: new Date(cve.published),
      cvssScore: cvssV3?.baseScore || cvssV2?.baseScore || 0,
      exploitedInWild: isInKev,
      attackVector: cvssV3?.attackVector || cvssV2?.accessVector || 'unknown',
      attackComplexity: cvssV3?.attackComplexity || cvssV2?.accessComplexity || 'unknown',
      privilegesRequired: cvssV3?.privilegesRequired || 'unknown',
      userInteraction: cvssV3?.userInteraction || (cvssV2?.userInteractionRequired ? 'REQUIRED' : 'NONE'),
      impactScore: cve.metrics?.cvssMetricV31?.[0]?.impactScore || cve.metrics?.cvssMetricV2?.[0]?.impactScore || 0,
      baseScore: cvssV3?.baseScore || cvssV2?.baseScore || 0,
      vendorName,
      productName,
      affectedSystemsCount,
      daysToRemediate,
    });
  }
  
  return normalizedVulns;
}

/**
 * Extract features from normalized data for machine learning
 */
export function extractFeatures(data: any[]): { 
  features: tf.Tensor2D, 
  labels: tf.Tensor2D,
  featureNames: string[] 
} {
  // Define the features we'll use for prediction
  const featureNames = [
    'avgVulnSeverity',
    'exploitedVulnCount',
    'impactLevel',
    'isCriticalInfrastructure',
    'isFinancialSector',
    'isHealthcareSector',
    'isGovernmentSector',
    'isTechnologySector',
    'isRetailSector',
    'isNorthAmerica',
    'isEurope',
    'isAsiaPacific',
    'daysSinceLastAttack',
    'sophisticationLevel',
    'isNationState',
    'isRansomwareAttack',
    'isDataBreachAttack',
    'isDdosAttack',
  ];
  
  // Prepare arrays for features and labels
  const featureArrays: number[][] = [];
  const labelArrays: number[][] = [];
  
  // Define the attack types we want to predict
  const attackTypes = [
    'ransomware',
    'dataBreach',
    'ddos',
    'zeroDay',
    'phishing',
    'supplyChain',
    'insiderThreat',
  ];
  
  // Process each data point
  for (const item of data) {
    // Extract features
    const featureArray: number[] = [];
    
    // Numeric features
    featureArray.push(item.avgVulnSeverity || 0);
    featureArray.push(item.exploitedVulnCount || 0);
    featureArray.push(item.impactLevel || 0);
    
    // Sector features (one-hot encoding)
    featureArray.push(isInSector(item.targetedSector, 'critical infrastructure') ? 1 : 0);
    featureArray.push(isInSector(item.targetedSector, 'financial') ? 1 : 0);
    featureArray.push(isInSector(item.targetedSector, 'healthcare') ? 1 : 0);
    featureArray.push(isInSector(item.targetedSector, 'government') ? 1 : 0);
    featureArray.push(isInSector(item.targetedSector, 'technology') ? 1 : 0);
    featureArray.push(isInSector(item.targetedSector, 'retail') ? 1 : 0);
    
    // Region features (one-hot encoding)
    featureArray.push(isInRegion(item.targetedRegion, ['north america', 'usa', 'canada']) ? 1 : 0);
    featureArray.push(isInRegion(item.targetedRegion, ['europe', 'eu']) ? 1 : 0);
    featureArray.push(isInRegion(item.targetedRegion, ['asia', 'pacific', 'apac']) ? 1 : 0);
    
    // Time-based features
    featureArray.push(item.daysSinceLastAttack || 0);
    
    // Threat actor features
    featureArray.push(sophisticationToNumeric(item.threatActorSophistication));
    featureArray.push(item.nationState ? 1 : 0);
    
    // Attack type features
    featureArray.push(isAttackType(item.attackType, 'ransomware') ? 1 : 0);
    featureArray.push(isAttackType(item.attackType, 'data breach') ? 1 : 0);
    featureArray.push(isAttackType(item.attackType, 'ddos') ? 1 : 0);
    
    featureArrays.push(featureArray);
    
    // Create label array (one-hot encoding of attack type)
    const labelArray = attackTypes.map(type => 
      isAttackType(item.attackType, type) ? 1 : 0
    );
    labelArrays.push(labelArray);
  }
  
  // Convert to tensors
  const features = tf.tensor2d(featureArrays);
  const labels = tf.tensor2d(labelArrays);
  
  return { features, labels, featureNames };
}

/**
 * Helper function to check if a sector matches the target
 */
function isInSector(sector: string, target: string): boolean {
  if (!sector) return false;
  return sector.toLowerCase().includes(target.toLowerCase());
}

/**
 * Helper function to check if a region matches any of the targets
 */
function isInRegion(region: string, targets: string[]): boolean {
  if (!region) return false;
  const lowerRegion = region.toLowerCase();
  return targets.some(target => lowerRegion.includes(target.toLowerCase()));
}

/**
 * Helper function to check if an attack type matches the target
 */
function isAttackType(attackType: string, target: string): boolean {
  if (!attackType) return false;
  return attackType.toLowerCase().includes(target.toLowerCase());
}

/**
 * Convert sophistication level to numeric value
 */
function sophisticationToNumeric(sophistication: string): number {
  if (!sophistication || sophistication === 'unknown') return 0.5;
  
  const levels: Record<string, number> = {
    'low': 0.25,
    'medium': 0.5,
    'high': 0.75,
    'advanced': 1.0,
  };
  
  for (const [level, value] of Object.entries(levels)) {
    if (sophistication.toLowerCase().includes(level)) {
      return value;
    }
  }
  
  return 0.5; // Default to medium if no match
}