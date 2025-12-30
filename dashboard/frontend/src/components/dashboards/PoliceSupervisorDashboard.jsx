import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Header from '../Header';
import AlertSystem from '../AlertSystem';
import ActivityLog from '../ActivityLog';
import CCTVPanel from '../CCTVPanel';
import SentimentPanel from '../SentimentPanel';
import RiskPanel from '../RiskPanel';
import AccessIndicator from '../AccessIndicator';
import { fetchIssues, fetchDashboardSummary } from '../../services/api';
import './DashboardStyles.css';

function PoliceSupervisorDashboard() {
    const { user, logActivity } = useUser();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState(null);

    useEffect(() => {
        loadData();
        logActivity('ACCESS_DASHBOARD', 'Police Supervisor Dashboard', 'SUCCESS');
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
                            🚔 Police Command & Control Center
                        </h1>
                        <p className="dashboard-subtitle">
                            Supervisor {user?.username} | Full Operational Access
                        </p>
                    </div>
                    <div className="status-badges">
                        <div className="status-badge active">
                            <span className="badge-dot"></span>
                            Command Active
                        </div>
                        <div className="status-badge">
                            {issues.length} Active Operations
                        </div>
                    </div>
                </div>

                {selectedIssue ? (
                    <>
                        <button 
                            className="btn-back"
                            onClick={() => setSelectedIssue(null)}
                        >
                            ← Back to Operations
                        </button>
                        <div className="dashboard-grid">
                            <div className="panel-section risk-section">
                                <AccessIndicator dataName="risk_index">
                                    <RiskPanel
                                        summary={summary}
                                        loading={loading}
                                        filters={{ issueId: selectedIssue }}
                                    />
                                </AccessIndicator>
                            </div>
                            <div className="panel-section cctv-section">
                                <AccessIndicator dataName="cctv_heatmap">
                                    <CCTVPanel
                                        summary={summary}
                                        loading={loading}
                                        filters={{ issueId: selectedIssue }}
                                    />
                                </AccessIndicator>
                            </div>
                            <div className="panel-section sentiment-section">
                                <AccessIndicator dataName="sentiment_analysis">
                                    <SentimentPanel
                                        summary={summary}
                                        loading={loading}
                                        filters={{ issueId: selectedIssue }}
                                    />
                                </AccessIndicator>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Command Overview */}
                        <div className="section">
                            <h2>📊 Command Overview</h2>
                            <div className="agency-overview-grid">
                                <div className="agency-card police">
                                    <div className="agency-header">
                                        <h3>Patrol Status</h3>
                                    </div>
                                    <div className="agency-stats">
                                        <div className="stat">
                                            <span className="stat-label">Active Units</span>
                                            <span className="stat-value">45 Deployed</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-label">Response Time</span>
                                            <span className="stat-value">3.2 min avg</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="agency-card police">
                                    <div className="agency-header">
                                        <h3>Threat Assessment</h3>
                                    </div>
                                    <div className="agency-stats">
                                        <div className="stat">
                                            <span className="stat-label">High-Risk Zones</span>
                                            <span className="stat-value">3 Active</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-label">Escalation Score</span>
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
                            </div>
                        </div>

                        {/* Inter-Agency Alerts */}
                        <div className="section">
                            <AlertSystem />
                        </div>

                        {/* All Operations */}
                        <div className="section">
                            <h2>🔍 All Active Operations</h2>
                            <div className="operations-grid">
                                {issues.map(issue => (
                                    <div 
                                        key={issue.id} 
                                        className="operation-card"
                                        onClick={() => {
                                            setSelectedIssue(issue.id);
                                            navigate(`/issue/${issue.id}`);
                                        }}
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
                                            <button className="btn-view">View Full Analysis →</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ActivityLog />
        </div>
    );
}

export default PoliceSupervisorDashboard;

