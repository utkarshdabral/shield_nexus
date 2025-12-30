import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { fetchIssues } from '../services/api';
import ActivityLog from './ActivityLog';
import './IssueList.css';

const IssueList = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadIssues = async () => {
            try {
                const data = await fetchIssues();
                setIssues(data);
            } catch (err) {
                console.error('Failed to load issues:', err);
                setError('Failed to load active threads');
            } finally {
                setLoading(false);
            }
        };

        loadIssues();

        // Auto-refresh issues list every 30s
        const interval = setInterval(loadIssues, 30000);
        return () => clearInterval(interval);
    }, []);

    const getRiskColor = (level) => {
        switch (level) {
            case 'High': return 'var(--color-risk-high)';
            case 'Medium': return 'var(--color-risk-medium)';
            case 'Low': return 'var(--color-risk-low)';
            default: return 'var(--color-text-secondary)';
        }
    };

    if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="issue-list-container">
            <div className="hero-section">
                <div className="hero-content">
                    <span className="hero-icon">🛡️</span>
                    <h1 className="hero-title">IRIS</h1>
                    <p className="hero-subtitle">Integrated Response & Intelligence System</p>
                </div>
            </div>

            <header className="issues-header">
                <h2>Active Operations Threads</h2>
                <div className="status-badge">Live Monitoring</div>
            </header>

            <div className="issues-grid">
                {issues.map(issue => (
                    <div
                        key={issue.id}
                        className="issue-card"
                        onClick={() => navigate(`/issue/${issue.id}`)}
                    >
                        <div className="issue-header">
                            <span className="issue-type">{issue.type}</span>
                            <span
                                className="risk-badge"
                                style={{ backgroundColor: getRiskColor(issue.risk_level), color: '#000' }}
                            >
                                {issue.risk_level} Risk
                            </span>
                        </div>

                        <h2 className="issue-title">{issue.title}</h2>
                        <p className="issue-location">📍 {issue.location}</p>
                        <p className="issue-description">{issue.description}</p>

                        <div className="issue-footer">
                            <span className="issue-status">
                                <span className={`status-dot ${issue.status.toLowerCase()}`}></span>
                                {issue.status}
                            </span>
                            <span className="view-details">View Dashboard →</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Activity Log Sidebar */}
            <ActivityLog />
        </div>
    );
};

export default IssueList;
