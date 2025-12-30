import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Header from '../Header';
import AlertSystem from '../AlertSystem';
import ActivityLog from '../ActivityLog';
import { fetchIssues, fetchDashboardSummary } from '../../services/api';
import './DashboardStyles.css';

function PoliceAnalystDashboard() {
    const { user, logActivity } = useUser();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        logActivity('ACCESS_DASHBOARD', 'Police Analyst Dashboard', 'SUCCESS');
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
        <div className="dashboard police-dashboard">
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
                            🚔 Police Intelligence & Analytics
                        </h1>
                        <p className="dashboard-subtitle">
                            Data Analyst {user?.username} | Threat Assessment & Pattern Analysis
                        </p>
                    </div>
                    <div className="status-badges">
                        <div className="status-badge">
                            {issues.length} Active Operations
                        </div>
                    </div>
                </div>

                {/* Analytics Overview */}
                <div className="section">
                    <h2>📊 Intelligence Analysis</h2>
                    <div className="agency-overview-grid">
                        <div className="agency-card police">
                            <div className="agency-header">
                                <h3>Escalation Risk</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">High-Risk Zones</span>
                                    <span className="stat-value">3 Active</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Avg Escalation</span>
                                    <span className="stat-value">7.8/10</span>
                                </div>
                            </div>
                        </div>
                        <div className="agency-card police">
                            <div className="agency-header">
                                <h3>CCTV Coverage</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Active Feeds</span>
                                    <span className="stat-value">12 Cameras</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Crowd Density</span>
                                    <span className="stat-value">High (3 areas)</span>
                                </div>
                            </div>
                        </div>
                        <div className="agency-card police">
                            <div className="agency-header">
                                <h3>Patrol Status</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Units Deployed</span>
                                    <span className="stat-value">45 Active</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Response Time</span>
                                    <span className="stat-value">3.2 min avg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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

export default PoliceAnalystDashboard;

