import { issuesService } from '../services/issues.service.js';
import * as cctvService from '../services/cctv.service.js';
import * as sentimentService from '../services/sentiment.service.js';
import { getLatestRiskMetrics } from '../services/risk.service.js';

export const issuesController = {
    // List all issues
    getAll: async (req, res) => {
        try {
            const filters = {
                status: req.query.status
            };
            const issues = issuesService.getAllIssues(filters);
            res.json({
                success: true,
                count: issues.length,
                data: issues
            });
        } catch (error) {
            console.error('Error fetching issues:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch issues' });
        }
    },

    // Get single issue details
    getById: async (req, res) => {
        try {
            const issueId = req.params.id;
            const issue = issuesService.getIssueById(issueId);

            if (!issue) {
                return res.status(404).json({ success: false, error: 'Issue not found' });
            }

            res.json({
                success: true,
                data: issue
            });
        } catch (error) {
            console.error('Error fetching issue:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch issue' });
        }
    },

    // Create new issue
    create: async (req, res) => {
        try {
            const issue = issuesService.createIssue(req.body);
            res.status(201).json({
                success: true,
                message: 'Issue created successfully',
                data: issue
            });
        } catch (error) {
            console.error('Error creating issue:', error);
            res.status(500).json({ success: false, error: 'Failed to create issue' });
        }
    },

    // Get summary analytics specific to an issue (for the card view)
    getAnalytics: async (req, res) => {
        try {
            const issueId = req.params.id;

            // Get latest risk metrics for this issue
            const risk = getLatestRiskMetrics({ issueId });

            // Get aggregate sentiment for this issue
            const sentiment = await sentimentService.getAggregates({ issueId });

            // Get active cameras (count distinct videos linked to this issue)
            const cctvResults = await cctvService.getResults({ issueId, limit: 1000 });
            const cameraCount = new Set(cctvResults.map(r => r.video_id)).size;

            res.json({
                success: true,
                data: {
                    riskScore: risk?.combined_score || 0,
                    riskLevel: risk?.riskLevel || 'Low',
                    sentimentScore: sentiment?.avg_compound || 0,
                    sentimentTrend: sentiment?.avg_compound < -0.2 ? 'negative' : 'neutral',
                    activeCameras: cameraCount,
                    lastUpdate: risk?.timestamp
                }
            });
        } catch (error) {
            console.error('Error fetching issue analytics:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch issue analytics' });
        }
    }
};
