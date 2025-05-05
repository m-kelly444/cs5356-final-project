/**
 * Machine Learning Model Loader
 * 
 * This module handles loading and managing ML models for prediction.
 * It supports both client-side (TensorFlow.js) and server-side models.
 */

import * as tf from '@tensorflow/tfjs';
import { join } from 'path';
import { db } from '@/lib/db';
import { predictionModels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PredictionModel } from '@/types/threat-data';

// Cache for loaded models to avoid reloading
const modelCache = new Map<string, tf.LayersModel>();

/**
 * Load a model by ID from the database and model storage
 */
export async function loadModelById(modelId: string): Promise<tf.LayersModel> {
  // First check the cache
  if (modelCache.has(modelId)) {
    return modelCache.get(modelId)!;
  }
  
  // Get model metadata from database
  const model = await db.query.predictionModels.findFirst({
    where: eq(predictionModels.id, modelId),
  });
  
  if (!model) {
    throw new Error(`Model with ID ${modelId} not found in database`);
  }
  
  // Check if model file path is defined
  if (!model.filePath) {
    throw new Error(`Model with ID ${modelId} has no file path defined`);
  }
  
  // Update last used timestamp
  await db.update(predictionModels)
    .set({ lastUsed: Date.now() })
    .where(eq(predictionModels.id, modelId));
  
  // Determine path to model files
  let modelPath: string;
  
  // Handle different environments
  if (process.env.NODE_ENV === 'production') {
    // In production, models are stored in a dedicated directory
    modelPath = `file://${join(process.cwd(), 'public', model.filePath)}`;
  } else {
    // In development, models are stored in the public directory
    modelPath = `file://${join(process.cwd(), 'public', model.filePath)}`;
  }
  
  try {
    // Load the model from storage
    const loadedModel = await tf.loadLayersModel(modelPath);
    
    // Cache the model for future use
    modelCache.set(modelId, loadedModel);
    
    return loadedModel;
  } catch (error) {
    console.error(`Error loading model ${modelId}:`, error);
    throw new Error(`Failed to load model: ${error.message}`);
  }
}

/**
 * Get the most recent model of a specific type
 */
export async function getLatestModelByType(type: string): Promise<PredictionModel | null> {
  const models = await db.select()
    .from(predictionModels)
    .where(eq(predictionModels.type, type))
    .orderBy(predictionModels.trainingDate, 'desc')
    .limit(1);
  
  return models.length > 0 ? models[0] : null;
}

/**
 * Load the latest model of a specific type
 */
export async function loadLatestModelByType(type: string): Promise<tf.LayersModel> {
  const model = await getLatestModelByType(type);
  
  if (!model) {
    throw new Error(`No model of type ${type} found`);
  }
  
  return loadModelById(model.id);
}

/**
 * Clean up model cache to free memory
 */
export function clearModelCache(): void {
  modelCache.clear();
}

/**
 * Get all available model types
 */
export async function getAvailableModelTypes(): Promise<string[]> {
  const types = await db.select({ type: predictionModels.type })
    .from(predictionModels)
    .groupBy(predictionModels.type);
  
  return types.map(t => t.type);
}

/**
 * Get model metadata for all models
 */
export async function getAllModelMetadata(): Promise<PredictionModel[]> {
  return db.select().from(predictionModels);
}

/**
 * Save a TensorFlow.js model to storage and database
 */
export async function saveModel(
  model: tf.LayersModel,
  metadata: Omit<PredictionModel, 'id' | 'filePath' | 'trainingDate' | 'lastUsed'>
): Promise<string> {
  // Generate a model ID and file path
  const modelId = `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const filePath = `/models/${metadata.type}/${modelId}`;
  const fullPath = join(process.cwd(), 'public', filePath);
  
  // Save the model to storage
  await model.save(`file://${fullPath}`);
  
  // Save model metadata to database
  const now = Date.now();
  
  await db.insert(predictionModels).values({
    id: modelId,
    name: metadata.name,
    description: metadata.description,
    type: metadata.type,
    algorithm: metadata.algorithm,
    version: metadata.version,
    parameters: metadata.parameters,
    accuracy: metadata.accuracy,
    precision: metadata.precision,
    recall: metadata.recall,
    f1Score: metadata.f1Score,
    trainingDate: now,
    lastUsed: now,
    filePath,
  });
  
  return modelId;
}