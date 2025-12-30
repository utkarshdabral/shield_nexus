import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Header from '../Header';
import AlertSystem from '../AlertSystem';
import ActivityLog from '../ActivityLog';
import { fetchIssues, fetchDashboardSummary } from '../../services/api';
import './DashboardStyles.css';

function FireFieldOfficerDashboard() {
    const { user, logActivity } = useUser();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        logActivity('ACCESS_DASHBOARD', 'Fire Field Officer Dashboard', 'SUCCESS');
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
                            🔥 Fire & Emergency Operations
                        </h1>
                        <p className="dashboard-subtitle">
                            Firefighter {user?.username} | Emergency Response Monitoring
                        </p>
                    </div>
                    <div className="status-badges">
                        <div className="status-badge active">
                            <span className="badge-dot"></span>
                            On Duty
                        </div>
                        <div className="status-badge">
                            8 Response Units Ready
                        </div>
                    </div>
                </div>

                {/* Emergency Alerts */}
                <div className="alert-section">
                    <div className="alert-banner critical">
                        <div className="alert-icon">🚨</div>
                        <div className="alert-content">
                            <h3>Active Emergency Situations</h3>
                            <p>Monitor crowd density and escalation scores. High-risk areas may require fire safety protocols.</p>
                        </div>
                    </div>
                </div>

                {/* Resource Status */}
                <div className="section">
                    <h2>🚒 Fire Department Resources</h2>
                    <div className="quick-access-grid">
                        <div className="quick-card">
                            <div className="quick-icon">🚒</div>
                            <h3>Fire Engines</h3>
                            <p>8 Available | 2 Deployed</p>
                        </div>
                        <div className="quick-card">
                            <div className="quick-icon">🚑</div>
                            <h3>Ambulances</h3>
                            <p>12 Ready | 3 On Call</p>
                        </div>
                        <div className="quick-card">
                            <div className="quick-icon">👨‍🚒</div>
                            <h3>Personnel</h3>
                            <p>45 On Duty | 12 Standby</p>
                        </div>
                        <div className="quick-card">
                            <div className="quick-icon">📍</div>
                            <h3>Hazard Zones</h3>
                            <p>3 Monitored Areas</p>
                        </div>
                    </div>
                </div>

                {/* Active Incidents */}
                <div className="section">
                    <h2>🔥 Active Fire & Safety Incidents</h2>
                    <div className="incidents-grid">
                        {issues.map(issue => (
                            <div 
                                key={issue.id} 
                                className={`incident-card ${issue.risk_level === 'High' ? 'high-priority' : ''}`}
                                onClick={() => navigate(`/issue/${issue.id}`)}
                            >
                                <div className="incident-header">
                                    <span className="incident-type">{issue.type}</span>
                                    <span className={`risk-badge ${issue.risk_level.toLowerCase()}`}>
                                        {issue.risk_level} RISK
                                    </span>
                                </div>
                                <h3 className="incident-title">{issue.title}</h3>
                                <p className="incident-location">📍 {issue.location}</p>
                                <div className="incident-footer">
                                    <span className="incident-status">{issue.status}</span>
                                    <button className="btn-view">Assess Safety →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inter-Agency Alerts */}
                <div className="section">
                    <AlertSystem />
                </div>
            </div>

            <ActivityLog />
        </div>
    );
}

export default FireFieldOfficerDashboard;

