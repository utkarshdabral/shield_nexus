import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import './AlertSystem.css';

function AlertSystem() {
    const { user, logActivity } = useUser();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [newAlert, setNewAlert] = useState({
        title: '',
        message: '',
        priority: 'medium',
        agencies: [],
        attachments: []
    });

    const allAgencies = [
        'Police Department',
        'Fire & Emergency',
        'Medical Services',
        'Environment Department',
        'Disaster Management'
    ];

    useEffect(() => {
        loadAlerts();
    }, [user]);

    const loadAlerts = () => {
        const stored = JSON.parse(localStorage.getItem('nexus_alerts') || '[]');
        // Filter alerts for current user's agency
        const relevantAlerts = stored.filter(alert => 
            alert.agencies.includes(user?.agency) || 
            alert.from === user?.agency ||
            user?.role === 'Coordinator'
        );
        setAlerts(relevantAlerts);
    };

    const handleCreateAlert = (e) => {
        e.preventDefault();
        if (!newAlert.title || !newAlert.message || newAlert.agencies.length === 0) {
            return;
        }

        const alert = {
            id: Date.now(),
            from: user.agency,
            fromUser: user.username,
            title: newAlert.title,
            message: newAlert.message,
            priority: newAlert.priority,
            agencies: newAlert.agencies,
            attachments: newAlert.attachments,
            timestamp: new Date().toISOString(),
            acknowledged: []
        };

        const stored = JSON.parse(localStorage.getItem('nexus_alerts') || '[]');
        stored.unshift(alert);
        localStorage.setItem('nexus_alerts', JSON.stringify(stored));

        logActivity('BROADCAST_ALERT', newAlert.title, 'SUCCESS');
        
        setNewAlert({
            title: '',
            message: '',
            priority: 'medium',
            agencies: [],
            attachments: []
        });
        setShowCreateModal(false);
        loadAlerts();
    };

    const toggleAgency = (agency) => {
        setNewAlert(prev => ({
            ...prev,
            agencies: prev.agencies.includes(agency)
                ? prev.agencies.filter(a => a !== agency)
                : [...prev.agencies, agency]
        }));
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return '#e53935';
            case 'high': return '#ff9800';
            case 'medium': return '#ffc107';
            default: return '#43a047';
        }
    };

    const unreadCount = alerts.filter(a => !a.acknowledged?.includes(user?.username)).length;

    return (
        <div className="alert-system">
            <div className="alert-header">
                <h3>🚨 Inter-Agency Alerts</h3>
                {unreadCount > 0 && <span className="alert-badge">{unreadCount}</span>}
                {user?.permissions?.includes('CREATE_ALERTS') && (
                    <button 
                        className="btn-create-alert"
                        onClick={() => setShowCreateModal(true)}
                    >
                        + Create Alert
                    </button>
                )}
            </div>

            <div className="alerts-list">
                {alerts.length === 0 ? (
                    <div className="no-alerts">No alerts available</div>
                ) : (
                    alerts.map(alert => (
                        <div 
                            key={alert.id} 
                            className={`alert-item priority-${alert.priority}`}
                            style={{ borderLeftColor: getPriorityColor(alert.priority) }}
                        >
                            <div className="alert-header-item">
                                <div>
                                    <span className="alert-priority">{alert.priority.toUpperCase()}</span>
                                    <span className="alert-from">from {alert.from}</span>
                                </div>
                                <span className="alert-time">
                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <h4 className="alert-title">{alert.title}</h4>
                            <p className="alert-message">{alert.message}</p>
                            {alert.attachments.length > 0 && (
                                <div className="alert-attachments">
                                    <strong>Attached Data:</strong>
                                    <ul>
                                        {alert.attachments.map((att, idx) => (
                                            <li key={idx}>{att}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="alert-actions">
                                <button className="btn-acknowledge">Acknowledge</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Broadcast Alert</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateAlert} className="alert-form">
                            <div className="form-group">
                                <label>Alert Type:</label>
                                <div className="radio-group">
                                    <label>
                                        <input 
                                            type="radio" 
                                            value="information" 
                                            checked={newAlert.priority === 'information'}
                                            onChange={(e) => setNewAlert({...newAlert, priority: e.target.value})}
                                        />
                                        Information
                                    </label>
                                    <label>
                                        <input 
                                            type="radio" 
                                            value="medium" 
                                            checked={newAlert.priority === 'medium'}
                                            onChange={(e) => setNewAlert({...newAlert, priority: e.target.value})}
                                        />
                                        Warning
                                    </label>
                                    <label>
                                        <input 
                                            type="radio" 
                                            value="high" 
                                            checked={newAlert.priority === 'high'}
                                            onChange={(e) => setNewAlert({...newAlert, priority: e.target.value})}
                                        />
                                        High Priority
                                    </label>
                                    <label>
                                        <input 
                                            type="radio" 
                                            value="critical" 
                                            checked={newAlert.priority === 'critical'}
                                            onChange={(e) => setNewAlert({...newAlert, priority: e.target.value})}
                                        />
                                        Critical Emergency
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Title:</label>
                                <input
                                    type="text"
                                    value={newAlert.title}
                                    onChange={(e) => setNewAlert({...newAlert, title: e.target.value})}
                                    placeholder="e.g., High protest risk at India Gate"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Message:</label>
                                <textarea
                                    value={newAlert.message}
                                    onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                                    placeholder="Describe the situation..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Share with Agencies:</label>
                                <div className="checkbox-group">
                                    {allAgencies.map(agency => (
                                        <label key={agency}>
                                            <input
                                                type="checkbox"
                                                checked={newAlert.agencies.includes(agency)}
                                                onChange={() => toggleAgency(agency)}
                                            />
                                            {agency}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Attach Data:</label>
                                <div className="checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newAlert.attachments.includes('Sentiment Analysis')}
                                            onChange={(e) => {
                                                const atts = e.target.checked
                                                    ? [...newAlert.attachments, 'Sentiment Analysis']
                                                    : newAlert.attachments.filter(a => a !== 'Sentiment Analysis');
                                                setNewAlert({...newAlert, attachments: atts});
                                            }}
                                        />
                                        Sentiment Analysis Results
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newAlert.attachments.includes('CCTV Heatmap')}
                                            onChange={(e) => {
                                                const atts = e.target.checked
                                                    ? [...newAlert.attachments, 'CCTV Heatmap']
                                                    : newAlert.attachments.filter(a => a !== 'CCTV Heatmap');
                                                setNewAlert({...newAlert, attachments: atts});
                                            }}
                                        />
                                        CCTV Heatmap
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newAlert.attachments.includes('Escalation Score Timeline')}
                                            onChange={(e) => {
                                                const atts = e.target.checked
                                                    ? [...newAlert.attachments, 'Escalation Score Timeline']
                                                    : newAlert.attachments.filter(a => a !== 'Escalation Score Timeline');
                                                setNewAlert({...newAlert, attachments: atts});
                                            }}
                                        />
                                        Escalation Score Timeline
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit">Send Alert to All Selected</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AlertSystem;

