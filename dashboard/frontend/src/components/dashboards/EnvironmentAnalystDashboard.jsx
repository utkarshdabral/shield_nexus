import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Header from '../Header';
import AlertSystem from '../AlertSystem';
import ActivityLog from '../ActivityLog';
import SentimentPanel from '../SentimentPanel';
import AccessIndicator from '../AccessIndicator';
import { fetchIssues, fetchDashboardSummary } from '../../services/api';
import './DashboardStyles.css';

function EnvironmentAnalystDashboard() {
    const { user, logActivity } = useUser();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        logActivity('ACCESS_DASHBOARD', 'Environment Analyst Dashboard', 'SUCCESS');
    }, []);

    const loadData = async () => {
        try {
            const [issuesData, summaryData] = await Promise.all([
                fetchIssues(),
                fetchDashboardSummary()
            ]);
            setIssues(issuesData);
            setSummary(summaryData);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard environment-dashboard">
            <Header 
                summary={summary} 
                onRefresh={loadData}
                autoRefresh={true}
                onAutoRefreshToggle={() => {}}
            />
            
            <div className="dashboard-content" style={{ marginTop: '80px' }}>
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">
                            🌍 Environment Department Analytics
                        </h1>
                        <p className="dashboard-subtitle">
                            Data Analyst {user?.username} | Air Quality & Social Sentiment Monitoring
                        </p>
                    </div>
                    <div className="status-badges">
                        <div className="status-badge">
                            {issues.length} Active Issues
                        </div>
                    </div>
                </div>

                {/* Environment Metrics */}
                <div className="section">
                    <h2>📊 Environmental Monitoring</h2>
                    <div className="agency-overview-grid">
                        <div className="agency-card environment">
                            <div className="agency-header">
                                <h3>Air Quality Index</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Current AQI</span>
                                    <span className="stat-value">Moderate (156)</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Status</span>
                                    <span className="stat-value">⚠️ Elevated</span>
                                </div>
                            </div>
                        </div>
                        <div className="agency-card environment">
                            <div className="agency-header">
                                <h3>Social Sentiment</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Negative Sentiment</span>
                                    <span className="stat-value">75%</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Key Topics</span>
                                    <span className="stat-value">Pollution, Protest</span>
                                </div>
                            </div>
                        </div>
                        <div className="agency-card environment">
                            <div className="agency-header">
                                <h3>Public Engagement</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Social Media Posts</span>
                                    <span className="stat-value">1,234 (24h)</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Trending</span>
                                    <span className="stat-value">↑ Increasing</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sentiment Analysis */}
                <div className="section">
                    <AccessIndicator dataName="sentiment_analysis">
                        <SentimentPanel
                            summary={summary}
                            loading={loading}
                            filters={{}}
                        />
                    </AccessIndicator>
                </div>

                {/* Active Issues */}
                <div className="section">
                    <h2>🔍 Environmental Issues & Protests</h2>
                    <div className="operations-grid">
                        {issues.map(issue => (
                            <div 
                                key={issue.id} 
                                className="operation-card"
                                onClick={() => navigate(`/issue/${issue.id}`)}
                            >
                                <div className="operation-header">
                                    <span className="operation-type">{issue.type}</span>
                                    <span className={`risk-badge ${issue.risk_level.toLowerCase()}`}>
                                        {issue.risk_level}
                                    </span>
                                </div>
                                <h3>{issue.title}</h3>
                                <p className="operation-location">📍 {issue.location}</p>
                                <p className="operation-description">{issue.description}</p>
                                <div className="operation-footer">
                                    <span className="operation-status">{issue.status}</span>
                                    <button className="btn-view">View Sentiment Analysis →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <AlertSystem />
                </div>
            </div>

            <ActivityLog />
        </div>
    );
}

export default EnvironmentAnalystDashboard;

