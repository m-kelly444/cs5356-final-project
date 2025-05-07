import { db } from '../db';
import { predictionModels, predictions } from '../db/schema';
import { createId } from '@paralleldrive/cuid2';
import { eq, desc } from 'drizzle-orm';

export const ATTACK_TYPES = [
  'ransomware',
  'dataBreach',
  'ddos',
  'zeroDay',
  'phishing',
  'supplyChain',
  'insiderThreat',
] as const;

export const TARGET_TYPES = [
  'sector',
  'region',
  'organization',
] as const;

export type AttackType = typeof ATTACK_TYPES[number];
export type TargetType = typeof TARGET_TYPES[number];

export interface PredictionInput {
  targetType: TargetType;
  targetValue: string;
  attackType: AttackType;
}

export async function getPredictionsForCommonSectors() {
  // Placeholder logic — replace with real model or DB queries
  return [
    { sector: 'Healthcare', attackType: 'ransomware', likelihood: 0.83 },
    { sector: 'Finance', attackType: 'phishing', likelihood: 0.77 },
    { sector: 'Energy', attackType: 'ddos', likelihood: 0.64 },
  ];
}

export async function predictAttacks(input: PredictionInput) {
  // Simulated prediction logic
  const prediction = {
    id: createId(),
    attackType: input.attackType,
    targetType: input.targetType,
    targetValue: input.targetValue,
    likelihood: Math.random(), // Replace with ML model output
    createdAt: new Date(),
  };

  await db.insert(predictions).values(prediction);

  return prediction;
}

export async function getLatestPredictionModel() {
  const [latest] = await db
    .select()
    .from(predictionModels)
    .orderBy(desc(predictionModels.createdAt))
    .limit(1);
  return latest;
}

export async function getAllPredictions() {
  return await db.select().from(predictions).orderBy(desc(predictions.createdAt));
}
