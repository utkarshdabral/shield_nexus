import { useState, useEffect } from 'react';
import './ActivityLog.css';

function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        loadLogs();
        // Refresh logs every 5 seconds
        const interval = setInterval(loadLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadLogs = () => {
        const stored = JSON.parse(localStorage.getItem('nexus_activity_log') || '[]');
        setLogs(stored.slice(0, 20)); // Show last 20 entries
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS': return '#43a047';
            case 'DENIED': return '#e53935';
            case 'WARNING': return '#ff9800';
            default: return '#888';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SUCCESS': return '🟢';
            case 'DENIED': return '🔴';
            case 'WARNING': return '🟡';
            default: return '⚪';
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getAgencyColor = (agency) => {
        const colors = {
            'Police Department': '#1e88e5',
            'Fire & Emergency': '#e53935',
            'Medical Services': '#43a047',
            'Environment Department': '#7cb342',
            'Disaster Management': '#ff9800',
            'Inter-Agency Coordinator': '#8e24aa'
        };
        return colors[agency] || '#888';
    };

    if (!isExpanded) {
        return (
            <div className="activity-log-collapsed">
                <button 
                    className="activity-log-toggle"
                    onClick={() => setIsExpanded(true)}
                >
                    📋 System Activity Log ({logs.length})
                </button>
            </div>
        );
    }

    return (
        <div className="activity-log">
            <div className="activity-log-header">
                <h3>📋 System Activity Log</h3>
                <button 
                    className="activity-log-close"
                    onClick={() => setIsExpanded(false)}
                >
                    ×
                </button>
            </div>
            <div className="activity-log-content">
                {logs.length === 0 ? (
                    <div className="no-logs">No activity logged yet</div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="log-entry">
                            <div className="log-time">{formatTime(log.timestamp)}</div>
                            <div 
                                className="log-icon"
                                style={{ color: getStatusColor(log.status) }}
                            >
                                {getStatusIcon(log.status)}
                            </div>
                            <div className="log-details">
                                <div className="log-user">
                                    <span 
                                        className="log-agency"
                                        style={{ color: getAgencyColor(log.agency) }}
                                    >
                                        {log.agency}
                                    </span>
                                    <span className="log-username">{log.user}</span>
                                </div>
                                <div className="log-action">{log.action}</div>
                                <div className="log-resource">{log.resource}</div>
                            </div>
                            <div 
                                className="log-status"
                                style={{ color: getStatusColor(log.status) }}
                            >
                                {log.status}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ActivityLog;

