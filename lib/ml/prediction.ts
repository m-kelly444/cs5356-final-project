/**
 * Cybersecurity threat prediction model
 * 
 * This module provides ML-based predictions for future cyber attacks
 * using TensorFlow.js.
 */

import * as tf from '@tensorflow/tfjs';
import { fetchAndNormalizeVulnerabilities, extractFeatures, prepareTrainingData } from './data-processing';
import { db } from '../db';
import { predictionModels, predictions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Attack types that we can predict
export const ATTACK_TYPES = [
  'ransomware',
  'dataBreach',
  'ddos',
  'zeroDay',
  'phishing',
  'supplyChain',
  'insiderThreat',
];

// Target types for predictions
export const TARGET_TYPES = [
  'sector',
  'region',
  'organization',
];

/**
 * Create and train a new cyber attack prediction model
 */
export async function trainAttackPredictionModel(): Promise<{
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}> {
  // Prepare training data
  const trainingData = await prepareTrainingData();
  
  // Extract features and labels for training
  const { features, labels, featureNames } = extractFeatures(trainingData);
  
  // Split into training and validation sets (80/20 split)
  const numExamples = features.shape[0];
  const numTrainExamples = Math.floor(0.8 * numExamples);
  
  const trainFeatures = features.slice([0, 0], [numTrainExamples, features.shape[1]]);
  const trainLabels = labels.slice([0, 0], [numTrainExamples, labels.shape[1]]);
  
  const valFeatures = features.slice([numTrainExamples, 0], [numExamples - numTrainExamples, features.shape[1]]);
  const valLabels = labels.slice([numTrainExamples, 0], [numExamples - numTrainExamples, labels.shape[1]]);
  
  // Create a sequential model
  const model = tf.sequential();
  
  // Input layer
  model.add(tf.layers.dense({
    inputShape: [features.shape[1]],
    units: 64,
    activation: 'relu',
    kernelInitializer: 'heNormal',
  }));
  
  // Dropout for regularization
  model.add(tf.layers.dropout({ rate: 0.3 }));
  
  // Hidden layer
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    kernelInitializer: 'heNormal',
  }));
  
  // Dropout for regularization
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  // Output layer for multi-class classification
  model.add(tf.layers.dense({
    units: labels.shape[1],
    activation: 'softmax',
  }));
  
  // Compile the model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  
  // Train the model
  const history = await model.fit(trainFeatures, trainLabels, {
    epochs: 50,
    batchSize: 32,
    validationData: [valFeatures, valLabels],
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}, accuracy = ${logs?.acc?.toFixed(4)}`);
      }
    }
  });
  
  // Evaluate the model on validation data
  const evalResult = model.evaluate(valFeatures, valLabels) as tf.Scalar[];
  const validationLoss = evalResult[0].dataSync()[0];
  const validationAccuracy = evalResult[1].dataSync()[0];
  
  // Calculate precision, recall, and F1 score
  const predictions = model.predict(valFeatures) as tf.Tensor;
  const predArray = await predictions.array() as number[][];
  const labelArray = await valLabels.array() as number[][];
  
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  for (let i = 0; i < predArray.length; i++) {
    const predicted = predArray[i].map((prob, idx) => 
      prob > 0.5 ? 1 : 0
    );
    
    for (let j = 0; j < predicted.length; j++) {
      if (predicted[j] === 1 && labelArray[i][j] === 1) {
        truePositives++;
      } else if (predicted[j] === 1 && labelArray[i][j] === 0) {
        falsePositives++;
      } else if (predicted[j] === 0 && labelArray[i][j] === 1) {
        falseNegatives++;
      }
    }
  }
  
  const precision = truePositives / (truePositives + falsePositives);
  const recall = truePositives / (truePositives + falseNegatives);
  const f1Score = 2 * (precision * recall) / (precision + recall);
  
  // Save model metadata to database
  const modelId = createId();
  const now = new Date();
  
  await db.insert(predictionModels).values({
    id: modelId,
    name: `Attack Prediction Model ${now.toISOString().slice(0, 10)}`,
    description: 'Attack type prediction model based on historical attack data',
    type: 'attack_probability',
    algorithm: 'neural_network',
    version: '1.0',
    parameters: JSON.stringify({
      featureNames,
      attackTypes: ATTACK_TYPES,
      layers: [
        { type: 'dense', units: 64, activation: 'relu' },
        { type: 'dropout', rate: 0.3 },
        { type: 'dense', units: 32, activation: 'relu' },
        { type: 'dropout', rate: 0.2 },
        { type: 'dense', units: ATTACK_TYPES.length, activation: 'softmax' },
      ],
    }),
    accuracy: validationAccuracy,
    precision,
    recall,
    f1Score,
    trainingDate: now,
    lastUsed: now,
    filePath: `/models/attack-prediction-${modelId}.json`,
  });
  
  // Save the model to disk
  await model.save(`file://./public/models/attack-prediction-${modelId}`);
  
  return {
    modelId,
    accuracy: validationAccuracy,
    precision,
    recall,
    f1Score,
  };
}

/**
 * Load a trained model by ID
 */
export async function loadModel(modelId: string): Promise<tf.LayersModel> {
  // Get model metadata from database
  const modelData = await db.query.predictionModels.findFirst({
    where: eq(predictionModels.id, modelId),
  });
  
  if (!modelData || !modelData.filePath) {
    throw new Error(`Model with ID ${modelId} not found or has no file path`);
  }
  
  // Update last used timestamp
  await db.update(predictionModels)
    .set({ lastUsed: new Date() })
    .where(eq(predictionModels.id, modelId));
  
  // Load the model from disk
  try {
    const model = await tf.loadLayersModel(`file://./public${modelData.filePath}`);
    return model;
  } catch (error) {
    console.error(`Error loading model ${modelId}:`, error);
    throw new Error(`Failed to load model: ${error.message}`);
  }
}

/**
 * Get the most recent model
 */
export async function getMostRecentModel(): Promise<string | null> {
  const model = await db.query.predictionModels.findFirst({
    orderBy: (predictionModels, { desc }) => [desc(predictionModels.trainingDate)],
  });
  
  return model ? model.id : null;
}

/**
 * Make a prediction using the trained model
 */
export async function predictAttacks(
  input: {
    targetType: string;
    targetValue: string;
    region?: string;
    sector?: string;
    recentVulnerabilities?: number;
    avgVulnSeverity?: number;
    historicalAttackFrequency?: number;
    daysSinceLastAttack?: number;
  }
): Promise<{
  predictions: {
    attackType: string;
    probability: number;
    severity: number;
    confidence: number;
  }[];
  overallThreatLevel: number;
  targetInfo: any;
}> {
  // Get the most recent model
  const modelId = await getMostRecentModel();
  
  if (!modelId) {
    throw new Error('No trained model available');
  }
  
  // Load the model
  const model = await loadModel(modelId);
  
  // Get model parameters
  const modelData = await db.query.predictionModels.findFirst({
    where: eq(predictionModels.id, modelId),
  });
  
  if (!modelData) {
    throw new Error(`Model metadata not found for ID ${modelId}`);
  }
  
  const params = JSON.parse(modelData.parameters);
  const featureNames = params.featureNames;
  const attackTypes = params.attackTypes || ATTACK_TYPES;
  
  // Prepare input feature vector
  const featureArray = new Array(featureNames.length).fill(0);
  
  // Set known features
  if (input.avgVulnSeverity) {
    const idx = featureNames.indexOf('avgVulnSeverity');
    if (idx >= 0) featureArray[idx] = input.avgVulnSeverity;
  }
  
  if (input.recentVulnerabilities) {
    const idx = featureNames.indexOf('exploitedVulnCount');
    if (idx >= 0) featureArray[idx] = input.recentVulnerabilities;
  }
  
  if (input.daysSinceLastAttack) {
    const idx = featureNames.indexOf('daysSinceLastAttack');
    if (idx >= 0) featureArray[idx] = input.daysSinceLastAttack;
  }
  
  if (input.historicalAttackFrequency) {
    const idx = featureNames.indexOf('attackFrequency');
    if (idx >= 0) featureArray[idx] = input.historicalAttackFrequency;
  }
  
  // Set sector features
  if (input.sector || (input.targetType === 'sector' && input.targetValue)) {
    const sector = input.sector || input.targetValue;
    
    ['isCriticalInfrastructure', 'isFinancialSector', 'isHealthcareSector', 
     'isGovernmentSector', 'isTechnologySector', 'isRetailSector'].forEach(feature => {
      const idx = featureNames.indexOf(feature);
      if (idx >= 0) {
        const sectorType = feature.replace('is', '').replace('Sector', '').toLowerCase();
        featureArray[idx] = sector.toLowerCase().includes(sectorType) ? 1 : 0;
      }
    });
  }
  
  // Set region features
  if (input.region || (input.targetType === 'region' && input.targetValue)) {
    const region = input.region || input.targetValue;
    
    ['isNorthAmerica', 'isEurope', 'isAsiaPacific'].forEach(feature => {
      const idx = featureNames.indexOf(feature);
      if (idx >= 0) {
        const regionType = feature.replace('is', '').toLowerCase();
        
        if (regionType === 'northamerica' && 
            ['north america', 'usa', 'canada', 'mexico', 'united states'].some(r => 
              region.toLowerCase().includes(r))) {
          featureArray[idx] = 1;
        } else if (regionType === 'europe' && 
            ['europe', 'eu', 'european'].some(r => 
              region.toLowerCase().includes(r))) {
          featureArray[idx] = 1;
        } else if (regionType === 'asiapacific' && 
            ['asia', 'pacific', 'apac'].some(r => 
              region.toLowerCase().includes(r))) {
          featureArray[idx] = 1;
        }
      }
    });
  }
  
  // Convert to tensor and make prediction
  const inputTensor = tf.tensor2d([featureArray]);
  const predictionTensor = model.predict(inputTensor) as tf.Tensor;
  const probabilities = await predictionTensor.data();
  
  // Format prediction results
  const predictionResults = Array.from(probabilities).map((prob, idx) => {
    const attackType = attackTypes[idx];
    return {
      attackType,
      probability: prob,
      // Calculate severity based on probability and type of attack
      severity: calculateSeverity(prob, attackType),
      // Calculate confidence based on model metrics and probability
      confidence: calculateConfidence(prob, modelData.precision || 0.8),
    };
  }).sort((a, b) => b.probability - a.probability);
  
  // Calculate overall threat level (0-100)
  const overallThreatLevel = calculateOverallThreatLevel(predictionResults);
  
  // Store prediction in database
  const predictionId = createId();
  await db.insert(predictions).values({
    id: predictionId,
    modelId,
    generatedDate: new Date(),
    predictedTimeframe: 'next_30_days',
    targetType: input.targetType,
    targetValue: input.targetValue,
    probability: predictionResults[0]?.probability || 0,
    severity: predictionResults[0]?.severity || 0,
    confidence: predictionResults[0]?.confidence || 0,
    attackType: predictionResults[0]?.attackType,
    inputFeatures: JSON.stringify(input),
    potentialVulnerabilities: null, // Would be filled in production with actual vulnerability IDs
    explanation: generateExplanation(predictionResults, input),
  });
  
  // Gather additional information about the target
  const targetInfo = await getTargetInfo(input.targetType, input.targetValue);
  
  return {
    predictions: predictionResults,
    overallThreatLevel,
    targetInfo,
  };
}

/**
 * Calculate severity based on attack type and probability
 */
function calculateSeverity(probability: number, attackType: string): number {
  // Base severity on probability (0-10 scale)
  let severity = probability * 10;
  
  // Adjust based on attack type
  if (['ransomware', 'zeroDay', 'supplyChain'].includes(attackType)) {
    // More severe attack types
    severity *= 1.3;
  } else if (['phishing', 'ddos'].includes(attackType)) {
    // Less severe attack types
    severity *= 0.9;
  }
  
  // Ensure severity is within range 0-10
  return Math.min(10, Math.max(0, severity));
}

/**
 * Calculate confidence based on probability and model precision
 */
function calculateConfidence(probability: number, modelPrecision: number): number {
  // Higher probabilities and model precision lead to higher confidence
  const confidence = probability * modelPrecision;
  
  // Scale to 0-1 range
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Calculate overall threat level based on predictions
 */
function calculateOverallThreatLevel(predictions: any[]): number {
  // Weight by probability and severity
  const weightedSum = predictions.reduce((sum, pred, idx) => {
    // First predictions have higher weight
    const positionWeight = 1 - (idx / predictions.length) * 0.5;
    return sum + (pred.probability * pred.severity * positionWeight);
  }, 0);
  
  // Scale to 0-100 range
  return Math.min(100, Math.round(weightedSum * 10));
}

/**
 * Generate a human-readable explanation for the prediction
 */
function generateExplanation(predictions: any[], input: any): string {
  const topPrediction = predictions[0];
  
  if (!topPrediction) {
    return 'Insufficient data to generate a detailed explanation.';
  }
  
  const threatLevel = topPrediction.probability > 0.7 ? 'high' : 
                      topPrediction.probability > 0.4 ? 'moderate' : 'low';
  
  let targetDesc = '';
  if (input.targetType === 'sector') {
    targetDesc = `the ${input.targetValue} sector`;
  } else if (input.targetType === 'region') {
    targetDesc = `the ${input.targetValue} region`;
  } else if (input.targetType === 'organization') {
    targetDesc = `${input.targetValue}`;
  }
  
  return `Based on historical attack patterns and current vulnerability data, there is a ${threatLevel} probability (${(topPrediction.probability * 100).toFixed(1)}%) that ${targetDesc} will experience a ${topPrediction.attackType} attack in the next 30 days. This prediction has a confidence score of ${(topPrediction.confidence * 100).toFixed(1)}%.`;
}

/**
 * Get additional information about the prediction target
 */
async function getTargetInfo(targetType: string, targetValue: string): Promise<any> {
  // This would be expanded in production to get real data about the target
  // For now, we'll return a simple object
  return {
    type: targetType,
    value: targetValue,
    recentAttacks: 0,
    vulnerabilityScore: 0,
    // Additional data would be added here
  };
}

/**
 * Get attack predictions for common sectors
 */
export async function getPredictionsForCommonSectors(): Promise<any[]> {
  const sectors = [
    'Healthcare', 
    'Financial', 
    'Government', 
    'Technology', 
    'Education',
    'Retail',
    'Manufacturing',
    'Energy',
    'Transportation'
  ];
  
  const predictions = await Promise.all(
    sectors.map(async sector => {
      try {
        const result = await predictAttacks({
          targetType: 'sector',
          targetValue: sector,
        });
        
        return {
          sector,
          threatLevel: result.overallThreatLevel,
          topAttackType: result.predictions[0]?.attackType,
          probability: result.predictions[0]?.probability,
        };
      } catch (error) {
        console.error(`Error predicting for sector ${sector}:`, error);
        return {
          sector,
          error: error.message,
        };
      }
    })
  );
  
  return predictions.filter(p => !p.error).sort((a, b) => b.threatLevel - a.threatLevel);
}