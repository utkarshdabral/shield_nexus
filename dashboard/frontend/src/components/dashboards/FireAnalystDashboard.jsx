import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Header from '../Header';
import AlertSystem from '../AlertSystem';
import ActivityLog from '../ActivityLog';
import { fetchIssues, fetchDashboardSummary } from '../../services/api';
import './DashboardStyles.css';

function FireAnalystDashboard() {
    const { user, logActivity } = useUser();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        logActivity('ACCESS_DASHBOARD', 'Fire Analyst Dashboard', 'SUCCESS');
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
        <div className="dashboard fire-dashboard">
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
                            🔥 Fire & Emergency Analytics Center
                        </h1>
                        <p className="dashboard-subtitle">
                            Data Analyst {user?.username} | Risk Assessment & Resource Planning
                        </p>
                    </div>
                    <div className="status-badges">
                        <div className="status-badge">
                            {issues.length} Active Situations
                        </div>
                    </div>
                </div>

                {/* Analytics Overview */}
                <div className="section">
                    <h2>📊 Fire Safety Risk Analysis</h2>
                    <div className="agency-overview-grid">
                        <div className="agency-card fire">
                            <div className="agency-header">
                                <h3>High-Risk Areas</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Crowd Density</span>
                                    <span className="stat-value">High (3 zones)</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Escalation Risk</span>
                                    <span className="stat-value">7.8/10</span>
                                </div>
                            </div>
                        </div>
                        <div className="agency-card fire">
                            <div className="agency-header">
                                <h3>Resource Allocation</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Units Deployed</span>
                                    <span className="stat-value">2/8 Available</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Response Time</span>
                                    <span className="stat-value">4.2 min avg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* All Incidents */}
                <div className="section">
                    <h2>🔍 All Active Operations</h2>
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
                                    <button className="btn-view">View Analysis →</button>
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

export default FireAnalystDashboard;

