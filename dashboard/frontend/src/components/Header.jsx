import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './Header.css';

function Header({ summary, onRefresh, autoRefresh, onAutoRefreshToggle, subTitle, onBack }) {
    const { user, logout } = useUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const getRiskLevel = () => {
        if (!summary?.riskIndex) return 'unknown';
        return summary.riskIndex.level?.toLowerCase() || 'low';
    };

    const riskLevel = getRiskLevel();
    const currentRisk = summary?.riskIndex?.current || 0;

    return (
        <header className="header">
            <div className="header-left">
                {onBack && (
                    <button className="back-button" onClick={onBack}>
                        ← Back
                    </button>
                )}
                <div className="logo">
                    <span className="logo-icon">🛡️</span>
                    <div className="logo-text">
                        <h1>NEXUS</h1>
                        <span className="logo-subtitle">Inter-Agency Data Sharing Platform</span>
                    </div>
                </div>
                {subTitle && (
                    <div className="header-subtitle">{subTitle}</div>
                )}
            </div>

            <div className="header-center">
                <div className={`global-status status-${riskLevel}`}>
                    <div className="status-indicator">
                        <span className={`status-dot ${riskLevel}`}></span>
                        <span className="status-label">System Status</span>
                    </div>
                    <div className="status-value">
                        <span className="risk-score">{(currentRisk * 100).toFixed(0)}%</span>
                        <span className={`risk-level ${riskLevel}`}>
                            {riskLevel.toUpperCase()} RISK
                        </span>
                    </div>
                </div>
            </div>

            <div className="header-right">
                {user && (
                    <div className="user-info">
                        <div className="user-badge">
                            <span className="user-agency">{user.agency}</span>
                            <span className="user-role">{user.role}</span>
                        </div>
                    </div>
                )}
                
                <div
                    className={`toggle ${autoRefresh ? 'active' : ''}`}
                    onClick={onAutoRefreshToggle}
                >
                    <div className="toggle-switch"></div>
                    <span className="toggle-label">Auto-refresh</span>
                </div>

                <button
                    className="btn btn-icon refresh-btn"
                    onClick={onRefresh}
                    title="Refresh Data"
                >
                    🔄
                </button>

                <div className="header-time">
                    <span className="time-label">Last updated</span>
                    <span className="time-value">
                        {summary?.timestamp
                            ? new Date(summary.timestamp).toLocaleTimeString()
                            : '--:--:--'}
                    </span>
                </div>

                {user && (
                    <button
                        className="btn btn-icon logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        🚪
                    </button>
                )}
            </div>
        </header>
    );
}

export default Header;
