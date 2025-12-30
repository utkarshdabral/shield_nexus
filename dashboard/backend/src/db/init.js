import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../../data/analytics.db');

let db = null;

/**
 * Get database instance (singleton)
 */
export function getDatabase() {
  if (!db) {
    // Ensure data directory exists
    const dataDir = dirname(DB_PATH);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

/**
 * Initialize database with schema
 */
export async function initDatabase() {
  const db = getDatabase();

  // Issues / Threads
  db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL, -- Protest, Riot, Gathering, etc.
      status TEXT NOT NULL, -- Active, Resolved, Monitoring
      location TEXT,
      description TEXT,
      risk_level TEXT, -- High, Medium, Low
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // CCTV Analysis Results
  db.exec(`
    CREATE TABLE IF NOT EXISTS cctv_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER,
      video_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      frame_number INTEGER,
      escalation_score REAL,
      motion_intensity REAL,
      person_count INTEGER,
      local_energies TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(issue_id) REFERENCES issues(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_cctv_video_id ON cctv_analysis(video_id);
    CREATE INDEX IF NOT EXISTS idx_cctv_issue_id ON cctv_analysis(issue_id);
    CREATE INDEX IF NOT EXISTS idx_cctv_timestamp ON cctv_analysis(timestamp);
  `);

  // Sentiment Analysis Results
  db.exec(`
    CREATE TABLE IF NOT EXISTS sentiment_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER,
      source_id TEXT NOT NULL,
      source_type TEXT,
      author TEXT,
      url TEXT,
      text_content TEXT,
      timestamp TEXT NOT NULL,
      positive REAL,
      negative REAL,
      neutral REAL,
      compound REAL,
      volatility REAL,
      risk_level TEXT,
      location TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(issue_id) REFERENCES issues(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_sentiment_source_id ON sentiment_analysis(source_id);
    CREATE INDEX IF NOT EXISTS idx_sentiment_issue_id ON sentiment_analysis(issue_id);
    CREATE INDEX IF NOT EXISTS idx_sentiment_timestamp ON sentiment_analysis(timestamp);
    CREATE INDEX IF NOT EXISTS idx_sentiment_risk_level ON sentiment_analysis(risk_level);
  `);

  // Unified Risk Index (Per Issue or Global? Let's make it linked to issue if needed, but keep global for now too, or make it per issue)
  // For now, let's allow risk index to be per issue
  db.exec(`
    CREATE TABLE IF NOT EXISTS risk_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER,
      timestamp TEXT NOT NULL,
      cctv_score REAL,
      sentiment_score REAL,
      combined_score REAL,
      fusion_weights TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(issue_id) REFERENCES issues(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_risk_timestamp ON risk_index(timestamp);
    CREATE INDEX IF NOT EXISTS idx_risk_issue_id ON risk_index(issue_id);
  `);

  // Configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert default configuration values
  const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)
  `);

  const defaults = {
    'risk.weight.cctv': '0.6',
    'risk.weight.sentiment': '0.4',
    'risk.threshold.high': '0.7',
    'risk.threshold.medium': '0.4',
    'analysis.grid_size': '3',
    'refresh.interval': '5000'
  };

  for (const [key, value] of Object.entries(defaults)) {
    insertConfig.run(key, value);
  }

  console.log('Database schema initialized');
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
