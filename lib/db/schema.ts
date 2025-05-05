// schema.ts
// Database schema using Drizzle ORM (Lecture 11-12)
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().notNull().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['user', 'analyst', 'admin'] }).default('user').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(() => new Date()),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  dashboards: many(dashboards),
  alerts: many(alerts),
}));

// User dashboard configurations
export const dashboards = sqliteTable('dashboards', {
  id: text('id').primaryKey().notNull().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  layout: text('layout').notNull(), // JSON string of dashboard layout
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(() => new Date()),
});

// Dashboard relations
export const dashboardsRelations = relations(dashboards, ({ one }) => ({
  user: one(users, {
    fields: [dashboards.userId],
    references: [users.id],
  }),
}));

// Vulnerabilities - data from NVD and CISA KEV
export const vulnerabilities = sqliteTable('vulnerabilities', {
  id: text('id').primaryKey(), // CVE ID e.g., CVE-2023-12345
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: real('severity').notNull(), // CVSS score
  exploitedInWild: integer('exploited_in_wild', { mode: 'boolean' }).notNull().default(0),
  publishedDate: integer('published_date', { mode: 'timestamp' }).notNull(),
  lastModified: integer('last_modified', { mode: 'timestamp' }).notNull(),
  cisaKevDate: integer('cisa_kev_date', { mode: 'timestamp' }), // Date added to CISA KEV catalog (if applicable)
  remediationDate: integer('remediation_date', { mode: 'timestamp' }), // CISA required remediation date (if applicable)
  affectedSystems: text('affected_systems').notNull(), // JSON string of affected systems/software
  attackVector: text('attack_vector'), // MITRE ATT&CK vector if available
  references: text('references').notNull(), // JSON string of reference URLs
  sourceData: text('source_data').notNull(), // Complete JSON data from source
});

// Threat actors - known APT groups and threat actors
export const threatActors = sqliteTable('threat_actors', {
  id: text('id').primaryKey().notNull().$defaultFn(() => createId()),
  name: text('name').notNull(),
  aliases: text('aliases'), // JSON string of aliases
  description: text('description').notNull(),
  nationState: text('nation_state'), // Country associated with the threat actor, if known
  motivations: text('motivations'), // JSON string of motivations (financial, political, etc.)
  sophisticationLevel: text('sophistication_level'), // Level of sophistication
  firstSeen: integer('first_seen', { mode: 'timestamp' }),
  lastSeen: integer('last_seen', { mode: 'timestamp' }),
  associatedGroups: text('associated_groups'), // JSON string of associated groups
  targetedSectors: text('targeted_sectors'), // JSON string of targeted sectors
  targetedRegions: text('targeted_regions'), // JSON string of targeted regions/countries
  techniques: text('techniques'), // JSON string of MITRE ATT&CK techniques
  sourceData: text('source_data'), // JSON string of source data
});

// Recorded cyber attacks - historical attack data
export const cyberAttacks = sqliteTable('cyber_attacks', {
  id: text('id').primaryKey().notNull().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  attackDate: integer('attack_date', { mode: 'timestamp' }).notNull(),
  discoveredDate: integer('discovered_date', { mode: 'timestamp' }).notNull(),
  attackType: text('attack_type').notNull(),
  threatActorId: text('threat_actor_id').references(() => threatActors.id),
  vulnerabilitiesExploited: text('vulnerabilities_exploited'), // JSON string of CVE IDs
  targetedSector: text('targeted_sector').notNull(),
  targetedRegion: text('targeted_region').notNull(),
  impactLevel: real('impact_level').notNull(), // Numerical score of impact
  techniquesUsed: text('techniques_used'), // JSON string of techniques
  indicators: text('indicators'), // JSON string of IoCs (Indicators of Compromise)
  source: text('source').notNull(), // Source of the attack data
  sourceUrl: text('source_url'), // URL to the source
  sourceData: text('source_data'), // Complete JSON data from source
});

// Cyber attack relations
export const cyberAttacksRelations = relations(cyberAttacks, ({ one }) => ({
  threatActor: one(threatActors, {
    fields: [cyberAttacks.threatActorId],
    references: [threatActors.id],
  }),
}));

// ML prediction models
export const predictionModels = sqliteTable('prediction_models', {
  id: text('id').primaryKey().notNull().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(), // Type of prediction (e.g., "attack_probability", "target_prediction")
  algorithm: text('algorithm').notNull(), // Algorithm used (e.g., "random_forest", "neural_network")
  version: text('version').notNull(),
  parameters: text('parameters').notNull(), // JSON string of model parameters
  accuracy: real('accuracy'),
  precision: real('precision'),
  recall: real('recall'),
  f1Score: real('f1_score'),
  trainingDate: integer('training_date', { mode: 'timestamp' }).notNull(),
  lastUsed: integer('last_used', { mode: 'timestamp' }).notNull().default(() => new Date()),
  filePath: text('file_path'), // Path to saved model
});

// Attack predictions
export const predictions = sqliteTable('predictions', {
  id: text('id').primaryKey().notNull().$defaultFn(() => createId()),
  modelId: text('model_id').notNull().references(() => predictionModels.id),
  generatedDate: integer('generated_date', { mode: 'timestamp' }).notNull().default(() => new Date()),
  predictedTimeframe: text('predicted_timeframe').notNull(), // e.g., "next_7_days", "next_30_days"
  targetType: text('target_type').notNull(), // E.g., "sector", "organization", "region"
  targetValue: text('target_value').notNull(),
  attackType: text('attack_type'),
  probability: real('probability').notNull(),
  severity: real('severity'),
  confidence: real('confidence').notNull(),
  potentialVulnerabilities: text('potential_vulnerabilities'), // JSON string of related CVEs
  explanation: text('explanation'), // Explanation of prediction
  inputFeatures: text('input_features').notNull(), // JSON string of features used for prediction
  verified: integer('verified', { mode: 'boolean' }).default(0), // Whether prediction was verified (happened or not)
  verifiedDate: integer('verified_date', { mode: 'timestamp' }),
});

// Prediction relations
export const predictionsRelations = relations(predictions, ({ one }) => ({
  model: one(predictionModels, {
    fields: [predictions.modelId],
    references: [predictionModels.id],
  }),
}));

// Malicious indicators (e.g., malicious IPs, domains, URLs)
export const indicators = sqliteTable('indicators', {
  id: text('id').primaryKey().notNull().$defaultFn(() => createId()),
  type: text('type', { enum: ['ip', 'domain', 'url', 'hash', 'email'] }).notNull(),
  value: text('value').notNull(),
  maliciousScore: real('malicious_score').notNull(), // 0-1 score of maliciousness
  firstSeen: integer('first_seen', { mode: 'timestamp' }).notNull(),
  lastSeen: integer('last_seen', { mode: 'timestamp' }).notNull(),
  source: text('source').notNull(), // Source of the indicator (e.g., "phishtank", "urlhaus")
  associatedAttackTypes: text('associated_attack_types'), // JSON string of attack types
  tags: text('tags'), // JSON string of tags
  sourceData: text('source_data'), // Complete JSON data from source
});

// User alerts
export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey().notNull().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).notNull(),
  type: text('type', { enum: ['vulnerability', 'attack', 'prediction', 'indicator'] }).notNull(),
  relatedItemId: text('related_item_id'), // ID of the related item (CVE ID, attack ID, etc.)
  relatedItemType: text('related_item_type'), // Type of the related item
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(() => new Date()),
  read: integer('read', { mode: 'boolean' }).default(0),
  readAt: integer('read_at', { mode: 'timestamp' }),
});

// Alert relations
export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
}));

// Data fetch logs - Track API calls to external services
export const dataFetchLogs = sqliteTable('data_fetch_logs', {
  id: text('id').primaryKey().notNull().$defaultFn(() => createId()),
  source: text('source').notNull(), // API source name
  endpoint: text('endpoint').notNull(), // Specific endpoint called
  requestParams: text('request_params'), // JSON string of request parameters
  responseStatus: integer('response_status'), // HTTP status code
  itemsRetrieved: integer('items_retrieved'), // Number of items retrieved
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  success: integer('success', { mode: 'boolean' }).notNull(),
  errorMessage: text('error_message'),
});