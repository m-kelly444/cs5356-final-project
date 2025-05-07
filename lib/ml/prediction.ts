/*
 * Cybersecurity threat prediction model
 *
 * This module provides ML-based predictions for future cyber attacks
 * using TensorFlow.js.
 */

import * as tf from '@tensorflow/tfjs';
import { fetchAndNormalizeVulnerabilities, extractFeatures, prepareTrainingData } from './data-processing';
import { db } from '../db';
import { predictionModels, predictions } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const ATTACK_TYPES = [
  'ransomware',
  'dataBreach',
  'ddos',
  'zeroDay',
  'phishing',
  'supplyChain',
  'insiderThreat',
];

export const TARGET_TYPES = [
  'sector',
  'region',
  'organization',
];

export async function trainAttackPredictionModel(): Promise<{
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}> {
  const trainingData = await prepareTrainingData();
  const { features, labels, featureNames } = extractFeatures(trainingData);

  const numExamples = features.shape[0];
  const numTrainExamples = Math.floor(0.8 * numExamples);

  const trainFeatures = features.slice([0, 0], [numTrainExamples, features.shape[1]]);
  const trainLabels = labels.slice([0, 0], [numTrainExamples, labels.shape[1]]);
  const valFeatures = features.slice([numTrainExamples, 0], [numExamples - numTrainExamples, features.shape[1]]);
  const valLabels = labels.slice([numTrainExamples, 0], [numExamples - numTrainExamples, labels.shape[1]]);

  const model = tf.sequential();

  model.add(tf.layers.dense({ inputShape: [features.shape[1]], units: 64, activation: 'relu', kernelInitializer: 'heNormal' }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu', kernelInitializer: 'heNormal' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: labels.shape[1], activation: 'softmax' }));

  model.compile({ optimizer: tf.train.adam(0.001), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

  await model.fit(trainFeatures, trainLabels, {
    epochs: 50,
    batchSize: 32,
    validationData: [valFeatures, valLabels],
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}, accuracy = ${logs?.acc?.toFixed(4)}`);
      }
    }
  });

  const evalResult = model.evaluate(valFeatures, valLabels) as tf.Scalar[];
  const validationLoss = evalResult[0].dataSync()[0];
  const validationAccuracy = evalResult[1].dataSync()[0];

  const predictionsTensor = model.predict(valFeatures) as tf.Tensor;
  const predArray = await predictionsTensor.array() as number[][];
  const labelArray = await valLabels.array() as number[][];

  let truePositives = 0, falsePositives = 0, falseNegatives = 0;
  for (let i = 0; i < predArray.length; i++) {
    const predicted = predArray[i].map((prob) => prob > 0.5 ? 1 : 0);
    for (let j = 0; j < predicted.length; j++) {
      if (predicted[j] === 1 && labelArray[i][j] === 1) truePositives++;
      else if (predicted[j] === 1 && labelArray[i][j] === 0) falsePositives++;
      else if (predicted[j] === 0 && labelArray[i][j] === 1) falseNegatives++;
    }
  }

  const precision = truePositives / (truePositives + falsePositives);
  const recall = truePositives / (truePositives + falseNegatives);
  const f1Score = 2 * (precision * recall) / (precision + recall);

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

  await model.save(`file://./public/models/attack-prediction-${modelId}`);

  return { modelId, accuracy: validationAccuracy, precision, recall, f1Score };
}

export async function loadModel(modelId: string): Promise<tf.LayersModel> {
  const modelData = await db.select()
    .from(predictionModels)
    .where(eq(predictionModels.id, modelId))
    .limit(1);

  if (!modelData[0] || !modelData[0].filePath) {
    throw new Error(`Model with ID ${modelId} not found or has no file path`);
  }

  await db.update(predictionModels)
    .set({ lastUsed: new Date() })
    .where(eq(predictionModels.id, modelId));

  try {
    const model = await tf.loadLayersModel(`file://./public${modelData[0].filePath}`);
    return model;
  } catch (error) {
    console.error(`Error loading model ${modelId}:`, error);
    throw new Error(`Failed to load model: ${error.message}`);
  }
}

export async function getMostRecentModel(): Promise<string | null> {
  const model = await db.select()
    .from(predictionModels)
    .orderBy(desc(predictionModels.trainingDate))
    .limit(1);

  return model[0] ? model[0].id : null;
}
