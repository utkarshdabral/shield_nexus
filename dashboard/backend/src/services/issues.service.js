import { getDatabase } from '../db/init.js';

export class IssuesService {
    getAllIssues(filters = {}) {
        const db = getDatabase();
        let query = 'SELECT * FROM issues';
        const params = [];

        const conditions = [];
        if (filters.status) {
            conditions.push('status = ?');
            params.push(filters.status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += " ORDER BY risk_level = 'High' DESC, created_at DESC";

        return db.prepare(query).all(...params);
    }

    getIssueById(id) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    }

    createIssue(data) {
        const db = getDatabase();
        const stmt = db.prepare(`
            INSERT INTO issues (title, type, status, location, description, risk_level)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            data.title,
            data.type,
            data.status,
            data.location,
            data.description,
            data.risk_level || 'Low' // Default risk
        );

        return { id: info.lastInsertRowid, ...data };
    }
}

export const issuesService = new IssuesService();
