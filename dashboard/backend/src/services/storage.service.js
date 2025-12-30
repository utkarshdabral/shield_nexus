import { getDatabase } from '../db/init.js';

/**
 * Storage service for database CRUD operations
 */

// ==================== CCTV Analysis ====================

export function saveCCTVAnalysis(data) {
    const db = getDatabase();
    const stmt = db.prepare(`
    INSERT INTO cctv_analysis 
    (issue_id, video_id, timestamp, frame_number, escalation_score, motion_intensity, person_count, local_energies, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const result = stmt.run(
        data.issueId || null,
        data.videoId,
        data.timestamp,
        data.frameNumber || null,
        data.escalationScore,
        data.motionIntensity || null,
        data.personCount || null,
        JSON.stringify(data.localEnergies || []),
        JSON.stringify(data.metadata || {})
    );

    return result.lastInsertRowid;
}

export function saveCCTVAnalysisBatch(dataArray) {
    const db = getDatabase();
    const stmt = db.prepare(`
    INSERT INTO cctv_analysis 
    (issue_id, video_id, timestamp, frame_number, escalation_score, motion_intensity, person_count, local_energies, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const insertMany = db.transaction((items) => {
        for (const data of items) {
            stmt.run(
                data.issueId || null,
                data.videoId,
                data.timestamp,
                data.frameNumber || null,
                data.escalationScore,
                data.motionIntensity || null,
                data.personCount || null,
                JSON.stringify(data.localEnergies || []),
                JSON.stringify(data.metadata || {})
            );
        }
    });

    insertMany(dataArray);
    return dataArray.length;
}

export function getCCTVAnalysis(query = {}) {
    const db = getDatabase();
    let sql = 'SELECT * FROM cctv_analysis WHERE 1=1';
    const params = [];

    if (query.videoId) {
        sql += ' AND video_id = ?';
        params.push(query.videoId);
    }

    // Support filtering by issueId
    if (query.issueId !== undefined && query.issueId !== null) {
        sql += ' AND issue_id = ?';
        params.push(query.issueId);
        console.log(`[Storage] Filtering by issue_id: ${query.issueId}`);
    } else {
        console.log(`[Storage] No issue_id filter - query.issueId is: ${query.issueId}`);
    }

    if (query.startTime) {
        sql += ' AND timestamp >= ?';
        params.push(query.startTime);
    }

    if (query.endTime) {
        sql += ' AND timestamp <= ?';
        params.push(query.endTime);
    }

    sql += ' ORDER BY timestamp DESC';
    sql += ` LIMIT ? OFFSET ?`;
    params.push(query.limit || 100, query.offset || 0);

    console.log(`[Storage] Executing SQL: ${sql}`);
    console.log(`[Storage] Params:`, params);

    const rows = db.prepare(sql).all(...params);
    console.log(`[Storage] Found ${rows.length} rows`);
    if (rows.length > 0) {
        console.log(`[Storage] First row issue_id: ${rows[0].issue_id}, video_id: ${rows[0].video_id}`);
    }
    
    return rows.map(row => ({
        ...row,
        local_energies: JSON.parse(row.local_energies || '[]'),
        metadata: JSON.parse(row.metadata || '{}')
    }));
}

export function getLatestCCTVAnalysis(videoId = null, filters = {}) {
    const db = getDatabase();
    let sql = 'SELECT * FROM cctv_analysis WHERE 1=1';
    const params = [];

    if (videoId) {
        sql += ' AND video_id = ?';
        params.push(videoId);
    }

    if (filters.issueId) {
        sql += ' AND issue_id = ?';
        params.push(filters.issueId);
    }

    sql += ' ORDER BY timestamp DESC LIMIT 1';

    const row = db.prepare(sql).get(...params);
    if (!row) return null;

    return {
        ...row,
        local_energies: JSON.parse(row.local_energies || '[]'),
        metadata: JSON.parse(row.metadata || '{}')
    };
}

// ==================== Sentiment Analysis ====================

export function saveSentimentAnalysis(data) {
    const db = getDatabase();
    const stmt = db.prepare(`
    INSERT INTO sentiment_analysis 
    (issue_id, source_id, source_type, text_content, timestamp, positive, negative, neutral, compound, volatility, risk_level, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const result = stmt.run(
        data.issueId || null,
        data.sourceId,
        data.sourceType || 'unknown',
        data.textContent,
        data.timestamp,
        data.positive,
        data.negative,
        data.neutral,
        data.compound,
        data.volatility || null,
        data.riskLevel || null,
        data.location || null
    );

    return result.lastInsertRowid;
}

export function saveSentimentAnalysisBatch(dataArray) {
    const db = getDatabase();
    const stmt = db.prepare(`
    INSERT INTO sentiment_analysis 
    (issue_id, source_id, source_type, text_content, timestamp, positive, negative, neutral, compound, volatility, risk_level, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const insertMany = db.transaction((items) => {
        for (const data of items) {
            stmt.run(
                data.issueId || null,
                data.sourceId,
                data.sourceType || 'unknown',
                data.textContent,
                data.timestamp,
                data.positive,
                data.negative,
                data.neutral,
                data.compound,
                data.volatility || null,
                data.riskLevel || null,
                data.location || null
            );
        }
    });

    insertMany(dataArray);
    return dataArray.length;
}

export function getSentimentAnalysis(query = {}) {
    const db = getDatabase();
    let sql = 'SELECT * FROM sentiment_analysis WHERE 1=1';
    const params = [];

    if (query.sourceType) {
        sql += ' AND source_type = ?';
        params.push(query.sourceType);
    }

    if (query.issueId) {
        sql += ' AND issue_id = ?';
        params.push(query.issueId);
    }

    if (query.riskLevel) {
        sql += ' AND risk_level = ?';
        params.push(query.riskLevel);
    }

    if (query.startTime) {
        sql += ' AND timestamp >= ?';
        params.push(query.startTime);
    }

    if (query.endTime) {
        sql += ' AND timestamp <= ?';
        params.push(query.endTime);
    }

    sql += ' ORDER BY timestamp DESC';
    sql += ` LIMIT ? OFFSET ?`;
    params.push(query.limit || 100, query.offset || 0);

    return db.prepare(sql).all(...params);
}

export function getLatestSentimentAnalysis(count = 10, filters = {}) {
    const db = getDatabase();
    let sql = 'SELECT * FROM sentiment_analysis WHERE 1=1';
    const params = [];

    if (filters.issueId) {
        sql += ' AND issue_id = ?';
        params.push(filters.issueId);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(count);

    return db.prepare(sql).all(...params);
}

export function getSentimentAggregates(query = {}) {
    const db = getDatabase();
    let sql = `
    SELECT 
      COUNT(*) as total,
      AVG(positive) as avg_positive,
      AVG(negative) as avg_negative,
      AVG(neutral) as avg_neutral,
      AVG(compound) as avg_compound,
      AVG(volatility) as avg_volatility,
      SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high_risk_count,
      SUM(CASE WHEN risk_level = 'Medium' THEN 1 ELSE 0 END) as medium_risk_count,
      SUM(CASE WHEN risk_level = 'Low' THEN 1 ELSE 0 END) as low_risk_count
    FROM sentiment_analysis WHERE 1=1
  `;
    const params = [];

    if (query.issueId) {
        sql += ' AND issue_id = ?';
        params.push(query.issueId);
    }

    if (query.startTime) {
        sql += ' AND timestamp >= ?';
        params.push(query.startTime);
    }

    if (query.endTime) {
        sql += ' AND timestamp <= ?';
        params.push(query.endTime);
    }

    return db.prepare(sql).get(...params);
}

// ==================== Risk Index ====================

export function saveRiskIndex(data) {
    const db = getDatabase();
    const stmt = db.prepare(`
    INSERT INTO risk_index 
    (issue_id, timestamp, cctv_score, sentiment_score, combined_score, fusion_weights)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    const result = stmt.run(
        data.issueId || null,
        data.timestamp,
        data.cctvScore,
        data.sentimentScore,
        data.combinedScore,
        JSON.stringify(data.fusionWeights || {})
    );

    return result.lastInsertRowid;
}

export function getRiskHistory(query = {}) {
    const db = getDatabase();
    let sql = 'SELECT * FROM risk_index WHERE 1=1';
    const params = [];

    if (query.issueId) {
        sql += ' AND issue_id = ?';
        params.push(query.issueId);
    }

    if (query.startTime) {
        sql += ' AND timestamp >= ?';
        params.push(query.startTime);
    }

    if (query.endTime) {
        sql += ' AND timestamp <= ?';
        params.push(query.endTime);
    }

    sql += ' ORDER BY timestamp DESC';
    sql += ` LIMIT ?`;
    params.push(query.limit || 100);

    const rows = db.prepare(sql).all(...params);
    return rows.map(row => ({
        ...row,
        fusion_weights: JSON.parse(row.fusion_weights || '{}')
    }));
}

export function getLatestRiskIndex() {
    const db = getDatabase();
    const row = db.prepare(`
    SELECT * FROM risk_index 
    ORDER BY timestamp DESC 
    LIMIT 1
  `).get();

    if (!row) return null;

    return {
        ...row,
        fusion_weights: JSON.parse(row.fusion_weights || '{}')
    };
}

// ==================== Configuration ====================

export function getConfig(key = null) {
    const db = getDatabase();

    if (key) {
        const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
        return row ? row.value : null;
    }

    const rows = db.prepare('SELECT key, value FROM config').all();
    const config = {};
    for (const row of rows) {
        config[row.key] = row.value;
    }
    return config;
}

export function setConfig(key, value) {
    const db = getDatabase();
    const stmt = db.prepare(`
    INSERT OR REPLACE INTO config (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
    stmt.run(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
}
