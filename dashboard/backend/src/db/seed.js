/**
 * Seed script to populate database with sample data for testing
 * Run: node src/db/seed.js
 */

import { initDatabase, getDatabase } from './init.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3'; // Added for direct database interaction

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load real data
function loadVideoMetrics(filename) {
    try {
        const jsonPath = path.join(__dirname, '../../uploads/processed', filename);
        if (fs.existsSync(jsonPath)) {
            const raw = fs.readFileSync(jsonPath, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn(`Could not load metrics for ${filename}:`, e.message);
    }
    return null;
}

// Issue Mapping
// Issue 1 -> v_final1 (High Risk)
// Issue 2 -> v_final2 (High Risk)
// Issue 3 -> v_final_nonv (Low Risk)
const issueVideoMap = [
    { issueIndex: 0, videoId: 'v_final1', file: 'v_final1_processed.json' },   // ID 1 -> Violent
    { issueIndex: 1, videoId: 'v_final2', file: 'v_final2_processed.json' },   // ID 2 -> Violent
    { issueIndex: 2, videoId: 'v_final_nonv', file: 'v_final_nonv_processed.json' } // ID 3 -> Non-Violent
];

// Sample sentiment analysis data (kept for fallback/additional data)
const sampleSentimentData = [
    { text: "The crowd seems calm and orderly today", compound: 0.4, risk_level: 'Low', source_type: 'tweet', location: 'Downtown', author: '@city_observer', url: 'https://twitter.com/city_observer/status/1234567890' },
    { text: "Getting nervous about the large gathering", compound: -0.3, risk_level: 'Medium', source_type: 'tweet', location: 'City Mall', author: '@nervous_resident', url: 'https://twitter.com/nervous_resident/status/1234567891' },
    { text: "There's a lot of tension in the air", compound: -0.4, risk_level: 'Medium', source_type: 'report', location: 'Stadium', author: 'Police Unit 4', url: null },
    { text: "People are shouting and pushing! #danger", compound: -0.6, risk_level: 'High', source_type: 'tweet', location: 'Old Town', author: '@scared_citizen', url: 'https://twitter.com/scared_citizen/status/1234567893' },
    { text: "Emergency services have arrived", compound: -0.2, risk_level: 'Medium', source_type: 'report', location: 'Stadium', author: 'Dispatcher', url: null },
    { text: "Situation is now under control", compound: 0.3, risk_level: 'Low', source_type: 'report', location: 'Stadium', author: 'Commander', url: null },
    { text: "Beautiful peaceful day at the park", compound: 0.6, risk_level: 'Low', source_type: 'tweet', location: 'University', author: '@park_lover', url: 'https://twitter.com/park_lover/status/1234567896' },
    { text: "Fire reported near the mall! 🔥", compound: -0.7, risk_level: 'High', source_type: 'message', location: 'City Mall', author: 'Anon', url: null },
    { text: "They are breaking windows! Police need to come NOW!", compound: -0.85, risk_level: 'High', source_type: 'tweet', location: 'Downtown', author: '@witness99', url: 'https://twitter.com/witness99/status/1234567899' },
    { text: "This is getting out of hand, stay away from the square", compound: -0.75, risk_level: 'High', source_type: 'tweet', location: 'Square', author: '@local_guide', url: 'https://twitter.com/local_guide/status/1234567900' }
];

async function seed() {
    console.log('🌱 Starting database seed...');
    // Ensure database schema is initialized
    await initDatabase();

    const db = new Database(process.env.DATABASE_PATH || './data/analytics.db');

    // 1. Clear existing data (Child tables first!)
    console.log('🗑️ Clearing existing data...');
    db.exec('DELETE FROM risk_index');
    db.exec('DELETE FROM sentiment_analysis');
    db.exec('DELETE FROM cctv_analysis');
    db.exec('DELETE FROM issues');

    // Reset auto-increment counters to ensure IDs start at 1, 2, 3
    try {
        db.exec('DELETE FROM sqlite_sequence');
    } catch (e) {
        console.warn('   ⚠️ Could not reset sqlite_sequence (may be empty)');
    }

    console.log('   ✅ Existing data cleared.');

    // 2. Insert Issues
    console.log('🚩 Seeding issues/threads...');
    const issueStmt = db.prepare('INSERT INTO issues (id, title, type, status, location, description, risk_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    const issues = [
        { id: 1, title: 'City Center Riot', type: 'Riot', status: 'Active', location: 'Downtown Plaza', description: 'Large-scale civil unrest with property damage.', risk_level: 'High' },
        { id: 2, title: 'Violent Protest', type: 'Protest', status: 'Active', location: 'Government Square', description: 'Protest escalating into violence and clashes.', risk_level: 'High' },
        { id: 3, title: 'Peaceful Gathering', type: 'Gathering', status: 'Monitored', location: 'City Park', description: 'Student gathering, currently peaceful.', risk_level: 'Low' }
    ];

    const issueIds = [];
    issues.forEach(issue => {
        issueStmt.run(issue.id, issue.title, issue.type, issue.status, issue.location, issue.description, issue.risk_level, new Date().toISOString());
        issueIds.push(issue.id);
    });
    console.log(`   ✅ Inserted ${issueIds.length} issues`);

    // 3. Insert CCTV Data (Real + Mock fallback)
    console.log('📹 Seeding CCTV analysis data...');
    const cctvStmt = db.prepare(`
    INSERT INTO cctv_analysis 
    (issue_id, video_id, timestamp, frame_number, escalation_score, motion_intensity, person_count, local_energies, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const baseTime = Date.now();

    for (const map of issueVideoMap) {
        const realData = loadVideoMetrics(map.file);
        const issueId = issueIds[map.issueIndex];

        if (realData && realData.length > 0) {
            console.log(`   Found real data for ${map.videoId} (${realData.length} frames)`);
            // Sample every 5th frame to avoid DB bloat if too many
            const step = Math.max(1, Math.floor(realData.length / 100)); // Target ~100 points

            realData.forEach((frame, idx) => {
                if (idx % step !== 0) return;

                // Real timestamp relative to now
                // We map the video timeline (0 -> end) to (now - duration -> now)
                const timeOffset = frame.timestamp_ms;
                const timestamp = new Date(baseTime - (realData[realData.length - 1].timestamp_ms - timeOffset)).toISOString();

                cctvStmt.run(
                    issueId,
                    map.videoId,
                    timestamp,
                    frame.frame,
                    frame.escalation_score,
                    frame.motion_intensity,
                    Math.round(frame.crowd_density * 10), // Estimate person count from density
                    JSON.stringify([]), // anomaly_scores
                    JSON.stringify({ source: 'real', processed_file: map.file })
                );
            });
        } else {
            console.log(`   Using fallback mock data for ${map.videoId}`);
            // FALLBACK MOCK DATA
            const isHighRisk = map.videoId.includes('nonv') ? false : true;
            for (let i = 0; i < 50; i++) {
                const timestamp = new Date(baseTime - (50 - i) * 1000).toISOString();
                const esc = isHighRisk ? 0.7 + Math.random() * 0.2 : 0.1 + Math.random() * 0.1;
                cctvStmt.run(
                    issueId,
                    map.videoId,
                    timestamp,
                    i,
                    esc,
                    isHighRisk ? 8 + Math.random() : 2 + Math.random(),
                    isHighRisk ? 50 + Math.floor(Math.random() * 10) : 10 + Math.floor(Math.random() * 5),
                    JSON.stringify([]), // anomaly_scores
                    JSON.stringify({ source: 'mock' })
                );
            }
        }
    }
    console.log(`   ✅ Inserted CCTV records`);

    // 4. Sentiment & Risk (Keep existing logic but link to new issueIds)
    console.log('💬 Seeding sentiment analysis data...');
    const sentimentStmt = db.prepare(`
    INSERT INTO sentiment_analysis 
    (issue_id, source_id, source_type, author, url, text_content, timestamp, positive, negative, neutral, compound, volatility, risk_level, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sampleSentimentData.forEach((data, index) => {
        const timestamp = new Date(baseTime - (sampleSentimentData.length - index) * 120000).toISOString();
        const issueId = issueIds[index % 3]; // Round robin
        sentimentStmt.run(
            issueId,
            `seed-${index + 1}`,
            data.source_type,
            data.author || 'Anonymous',
            data.url || null,
            data.text,
            timestamp,
            data.positive || 0.1,
            data.negative || 0.1,
            data.neutral || 0.8,
            data.compound,
            data.volatility || 50,
            data.risk_level,
            data.location
        );
    });
    console.log(`   ✅ Inserted ${sampleSentimentData.length} sentiment records`);

    console.log('⚡ Seeding risk index data...');
    const riskStmt = db.prepare(`
    INSERT INTO risk_index 
    (issue_id, timestamp, cctv_score, sentiment_score, combined_score, fusion_weights)
    VALUES (?, ?, ?, ?, ?, ?)
    `);

    issueIds.forEach(issueId => {
        // Generate a trend
        for (let i = 0; i < 20; i++) {
            const timestamp = new Date(baseTime - (20 - i) * 60000).toISOString();
            const score = Math.random(); // 0.0 to 1.0
            const cctv = score * 0.6;
            const sentiment = score * 0.4;
            riskStmt.run(
                issueId,
                timestamp,
                cctv,
                sentiment,
                score, // combined
                JSON.stringify({ cctv: 0.6, sentiment: 0.4 })
            );
        }
    });

    console.log(`   ✅ Inserted risk index records`);
    console.log('\n✨ Database seeding complete!');
    process.exit(0);
}

seed().catch(error => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});

