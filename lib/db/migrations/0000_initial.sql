-- Initial database schema

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'analyst', 'admin')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create vulnerabilities table
CREATE TABLE IF NOT EXISTS vulnerabilities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity REAL NOT NULL,
  exploited_in_wild INTEGER NOT NULL DEFAULT 0,
  published_date INTEGER NOT NULL,
  last_modified INTEGER NOT NULL,
  cisa_kev_date INTEGER,
  remediation_date INTEGER,
  affected_systems TEXT NOT NULL,
  attack_vector TEXT,
  references TEXT NOT NULL,
  source_data TEXT NOT NULL
);

-- Create threat_actors table
CREATE TABLE IF NOT EXISTS threat_actors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT,
  description TEXT NOT NULL,
  nation_state TEXT,
  motivations TEXT,
  sophistication_level TEXT,
  first_seen INTEGER,
  last_seen INTEGER,
  associated_groups TEXT,
  targeted_sectors TEXT,
  targeted_regions TEXT,
  techniques TEXT,
  source_data TEXT
);

-- Create cyber_attacks table
CREATE TABLE IF NOT EXISTS cyber_attacks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  attack_date INTEGER NOT NULL,
  discovered_date INTEGER NOT NULL,
  attack_type TEXT NOT NULL,
  threat_actor_id TEXT REFERENCES threat_actors(id),
  vulnerabilities_exploited TEXT,
  targeted_sector TEXT NOT NULL,
  targeted_region TEXT NOT NULL,
  impact_level REAL NOT NULL,
  techniques_used TEXT,
  indicators TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  source_data TEXT
);

-- Create prediction_models table
CREATE TABLE IF NOT EXISTS prediction_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  version TEXT NOT NULL,
  parameters TEXT NOT NULL,
  accuracy REAL,
  precision REAL,
  recall REAL,
  f1_score REAL,
  training_date INTEGER NOT NULL,
  last_used INTEGER NOT NULL DEFAULT (unixepoch()),
  file_path TEXT
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES prediction_models(id),
  generated_date INTEGER NOT NULL DEFAULT (unixepoch()),
  predicted_timeframe TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_value TEXT NOT NULL,
  attack_type TEXT,
  probability REAL NOT NULL,
  severity REAL,
  confidence REAL NOT NULL,
  potential_vulnerabilities TEXT,
  explanation TEXT,
  input_features TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  verified_date INTEGER
);

-- Create indicators table
CREATE TABLE IF NOT EXISTS indicators (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('ip', 'domain', 'url', 'hash', 'email')),
  value TEXT NOT NULL,
  malicious_score REAL NOT NULL,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  source TEXT NOT NULL,
  associated_attack_types TEXT,
  tags TEXT,
  source_data TEXT
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  type TEXT NOT NULL CHECK (type IN ('vulnerability', 'attack', 'prediction', 'indicator')),
  related_item_id TEXT,
  related_item_type TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  read INTEGER DEFAULT 0,
  read_at INTEGER
);

-- Create data_fetch_logs table
CREATE TABLE IF NOT EXISTS data_fetch_logs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_params TEXT,
  response_status INTEGER,
  items_retrieved INTEGER,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  success INTEGER NOT NULL,
  error_message TEXT
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_published_date ON vulnerabilities(published_date);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_exploited ON vulnerabilities(exploited_in_wild);
CREATE INDEX IF NOT EXISTS idx_cyber_attacks_date ON cyber_attacks(attack_date);
CREATE INDEX IF NOT EXISTS idx_cyber_attacks_sector ON cyber_attacks(targeted_sector);
CREATE INDEX IF NOT EXISTS idx_cyber_attacks_region ON cyber_attacks(targeted_region);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(generated_date);
CREATE INDEX IF NOT EXISTS idx_predictions_probability ON predictions(probability);
CREATE INDEX IF NOT EXISTS idx_indicators_type ON indicators(type);
CREATE INDEX IF NOT EXISTS idx_indicators_score ON indicators(malicious_score);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);