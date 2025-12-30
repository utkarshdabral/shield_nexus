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

function CoordinatorDashboard() {
    const { user, logActivity } = useUser();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState(null);

    useEffect(() => {
        loadData();
        logActivity('ACCESS_DASHBOARD', 'Inter-Agency Coordinator Dashboard', 'SUCCESS');
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
        <div className="dashboard coordinator-dashboard">
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
                            🌐 NEXUS Inter-Agency Command Center
                        </h1>
                        <p className="dashboard-subtitle">
                            Full System Access | All Agencies | Real-Time Coordination
                        </p>
                    </div>
                    <div className="status-badges">
                        <div className="status-badge coordinator">
                            <span className="badge-dot"></span>
                            Level 4 Clearance
                        </div>
                        <div className="status-badge">
                            {issues.length} Active Operations
                        </div>
                    </div>
                </div>

                {/* System Overview */}
                <div className="section">
                    <h2>📊 Cross-Agency System Overview</h2>
                    <div className="agency-overview-grid">
                        <div className="agency-card police">
                            <div className="agency-header">
                                <h3>🚔 Police Department</h3>
                                <span className="agency-status active">Active</span>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">CCTV Feeds</span>
                                    <span className="stat-value">12 Active</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Patrol Units</span>
                                    <span className="stat-value">45 Deployed</span>
                                </div>
                            </div>
                        </div>

                        <div className="agency-card fire">
                            <div className="agency-header">
                                <h3>🔥 Fire & Emergency</h3>
                                <span className="agency-status active">Active</span>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Response Units</span>
                                    <span className="stat-value">8 Ready</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Hazard Zones</span>
                                    <span className="stat-value">3 Monitored</span>
                                </div>
                            </div>
                        </div>

                        <div className="agency-card medical">
                            <div className="agency-header">
                                <h3>🏥 Medical Services</h3>
                                <span className="agency-status active">Active</span>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Hospital Capacity</span>
                                    <span className="stat-value">78% Available</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Ambulances</span>
                                    <span className="stat-value">15 Ready</span>
                                </div>
                            </div>
                        </div>

                        <div className="agency-card environment">
                            <div className="agency-header">
                                <h3>🌍 Environment Department</h3>
                                <span className="agency-status active">Active</span>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Air Quality</span>
                                    <span className="stat-value">Moderate</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Sentiment Analysis</span>
                                    <span className="stat-value">75% Negative</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unified Analytics */}
                {selectedIssue ? (
                    <div className="section">
                        <button 
                            className="btn-back"
                            onClick={() => setSelectedIssue(null)}
                        >
                            ← Back to Overview
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
                    </div>
                ) : (
                    <>
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

export default CoordinatorDashboard;

