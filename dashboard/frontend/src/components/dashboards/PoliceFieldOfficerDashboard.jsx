import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Header from '../Header';
import AlertSystem from '../AlertSystem';
import ActivityLog from '../ActivityLog';
import { fetchIssues, fetchDashboardSummary } from '../../services/api';
import './DashboardStyles.css';

function PoliceFieldOfficerDashboard() {
    const { user, logActivity } = useUser();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        logActivity('ACCESS_DASHBOARD', 'Police Field Officer Dashboard', 'SUCCESS');
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

    const getPriorityIssues = () => {
        return issues.filter(issue => 
            issue.risk_level === 'High' || 
            issue.type === 'Riot' || 
            issue.type === 'Protest'
        ).slice(0, 3);
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
                            🚔 Police Field Operations Center
                        </h1>
                        <p className="dashboard-subtitle">
                            Officer {user?.username} | Active Patrol Monitoring
                        </p>
                    </div>
                    <div className="status-badges">
                        <div className="status-badge active">
                            <span className="badge-dot"></span>
                            On Duty
                        </div>
                        <div className="status-badge">
                            {issues.filter(i => i.risk_level === 'High').length} High Priority
                        </div>
                    </div>
                </div>

                {/* Critical Alerts */}
                <div className="alert-section">
                    <div className="alert-banner critical">
                        <div className="alert-icon">⚠️</div>
                        <div className="alert-content">
                            <h3>Active High-Risk Situations</h3>
                            <p>Monitor these incidents closely. Coordinate with dispatch if escalation detected.</p>
                        </div>
                    </div>
                </div>

                {/* Priority Incidents */}
                <div className="section">
                    <div className="section-header">
                        <h2>🚨 Priority Incidents Requiring Attention</h2>
                        <span className="section-badge">{getPriorityIssues().length}</span>
                    </div>
                    <div className="incidents-grid">
                        {getPriorityIssues().map(issue => (
                            <div 
                                key={issue.id} 
                                className="incident-card high-priority"
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
                                    <button className="btn-view">View Details →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Access */}
                <div className="section">
                    <h2>📋 Quick Access</h2>
                    <div className="quick-access-grid">
                        <div className="quick-card" onClick={() => navigate('/issue/1')}>
                            <div className="quick-icon">📹</div>
                            <h3>CCTV Monitoring</h3>
                            <p>Real-time surveillance feeds</p>
                        </div>
                        <div className="quick-card" onClick={() => navigate('/issue/1')}>
                            <div className="quick-icon">📊</div>
                            <h3>Escalation Scores</h3>
                            <p>Risk assessment metrics</p>
                        </div>
                        <div className="quick-card">
                            <div className="quick-icon">📱</div>
                            <h3>Dispatch Radio</h3>
                            <p>Communication hub</p>
                        </div>
                        <div className="quick-card">
                            <div className="quick-icon">🗺️</div>
                            <h3>Patrol Routes</h3>
                            <p>Area coverage map</p>
                        </div>
                    </div>
                </div>

                {/* Inter-Agency Alerts */}
                <div className="section">
                    <AlertSystem />
                </div>

                {/* All Active Issues */}
                <div className="section">
                    <h2>📑 All Active Operations</h2>
                    <div className="issues-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Location</th>
                                    <th>Risk Level</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {issues.map(issue => (
                                    <tr key={issue.id}>
                                        <td><span className="issue-type-badge">{issue.type}</span></td>
                                        <td>{issue.location}</td>
                                        <td>
                                            <span className={`risk-badge-small ${issue.risk_level.toLowerCase()}`}>
                                                {issue.risk_level}
                                            </span>
                                        </td>
                                        <td>{issue.status}</td>
                                        <td>
                                            <button 
                                                className="btn-small"
                                                onClick={() => navigate(`/issue/${issue.id}`)}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ActivityLog />
        </div>
    );
}

export default PoliceFieldOfficerDashboard;

