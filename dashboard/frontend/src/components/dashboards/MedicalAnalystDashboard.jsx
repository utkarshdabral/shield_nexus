import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Header from '../Header';
import AlertSystem from '../AlertSystem';
import ActivityLog from '../ActivityLog';
import { fetchIssues, fetchDashboardSummary } from '../../services/api';
import './DashboardStyles.css';

function MedicalAnalystDashboard() {
    const { user, logActivity } = useUser();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        logActivity('ACCESS_DASHBOARD', 'Medical Analyst Dashboard', 'SUCCESS');
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
        <div className="dashboard medical-dashboard">
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
                            🏥 Medical Services Analytics
                        </h1>
                        <p className="dashboard-subtitle">
                            Data Analyst {user?.username} | Resource Planning & Capacity Management
                        </p>
                    </div>
                    <div className="status-badges">
                        <div className="status-badge">
                            {issues.length} Active Situations
                        </div>
                    </div>
                </div>

                {/* Medical Analytics */}
                <div className="section">
                    <h2>📊 Medical Resource Analysis</h2>
                    <div className="agency-overview-grid">
                        <div className="agency-card medical">
                            <div className="agency-header">
                                <h3>Hospital Capacity</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Available Beds</span>
                                    <span className="stat-value">78% (234/300)</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">ICU Capacity</span>
                                    <span className="stat-value">65% Available</span>
                                </div>
                            </div>
                        </div>
                        <div className="agency-card medical">
                            <div className="agency-header">
                                <h3>Emergency Response</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">Ambulances</span>
                                    <span className="stat-value">15 Ready | 3 Deployed</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Response Time</span>
                                    <span className="stat-value">6.5 min avg</span>
                                </div>
                            </div>
                        </div>
                        <div className="agency-card medical">
                            <div className="agency-header">
                                <h3>Risk Assessment</h3>
                            </div>
                            <div className="agency-stats">
                                <div className="stat">
                                    <span className="stat-label">High-Risk Zones</span>
                                    <span className="stat-value">3 Areas</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Potential Casualties</span>
                                    <span className="stat-value">Low-Medium</span>
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

export default MedicalAnalystDashboard;

