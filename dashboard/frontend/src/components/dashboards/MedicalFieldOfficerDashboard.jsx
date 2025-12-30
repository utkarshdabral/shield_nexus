import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Header from '../Header';
import AlertSystem from '../AlertSystem';
import ActivityLog from '../ActivityLog';
import { fetchIssues, fetchDashboardSummary } from '../../services/api';
import './DashboardStyles.css';

function MedicalFieldOfficerDashboard() {
    const { user, logActivity } = useUser();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        logActivity('ACCESS_DASHBOARD', 'Medical Field Officer Dashboard', 'SUCCESS');
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
                            🏥 Medical Emergency Response
                        </h1>
                        <p className="dashboard-subtitle">
                            Paramedic {user?.username} | Emergency Medical Services
                        </p>
                    </div>
                    <div className="status-badges">
                        <div className="status-badge active">
                            <span className="badge-dot"></span>
                            On Call
                        </div>
                        <div className="status-badge">
                            15 Ambulances Ready
                        </div>
                    </div>
                </div>

                {/* Medical Alerts */}
                <div className="alert-section">
                    <div className="alert-banner critical">
                        <div className="alert-icon">🚑</div>
                        <div className="alert-content">
                            <h3>Medical Readiness Alert</h3>
                            <p>High-risk situations detected. Prepare medical response teams. Monitor crowd density for potential mass casualty scenarios.</p>
                        </div>
                    </div>
                </div>

                {/* Hospital Status */}
                <div className="section">
                    <h2>🏥 Hospital Capacity & Resources</h2>
                    <div className="quick-access-grid">
                        <div className="quick-card">
                            <div className="quick-icon">🏥</div>
                            <h3>Hospital Capacity</h3>
                            <p>78% Available | 22% Occupied</p>
                        </div>
                        <div className="quick-card">
                            <div className="quick-icon">🚑</div>
                            <h3>Ambulances</h3>
                            <p>15 Ready | 3 Deployed</p>
                        </div>
                        <div className="quick-card">
                            <div className="quick-icon">👨‍⚕️</div>
                            <h3>Medical Staff</h3>
                            <p>120 On Duty | 45 Standby</p>
                        </div>
                        <div className="quick-card">
                            <div className="quick-icon">💊</div>
                            <h3>Emergency Supplies</h3>
                            <p>Fully Stocked</p>
                        </div>
                    </div>
                </div>

                {/* Active Medical Situations */}
                <div className="section">
                    <h2>🚨 Active Medical Response Situations</h2>
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
                                    <button className="btn-view">Assess Medical Needs →</button>
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

export default MedicalFieldOfficerDashboard;

