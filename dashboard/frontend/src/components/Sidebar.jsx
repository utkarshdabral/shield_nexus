import './Sidebar.css';

function Sidebar({ filters, onFilterChange, refreshInterval, onRefreshIntervalChange, isOpen = true }) {
    const handleStartTimeChange = (e) => {
        onFilterChange({ startTime: e.target.value || null });
    };

    const handleEndTimeChange = (e) => {
        onFilterChange({ endTime: e.target.value || null });
    };

    // ... (handlers omitted for brevity if unchanged logic, but here I must provide full replacement chunk for valid matching)
    // Actually, I can just replace the signature and the return statement wrapper.
    // simpler to just replace the top and bottom.

    const handleRiskLevelChange = (e) => {
        onFilterChange({ riskLevel: e.target.value || null });
    };

    const handleSourceTypeChange = (e) => {
        onFilterChange({ sourceType: e.target.value || null });
    };

    const handleIntervalChange = (e) => {
        onRefreshIntervalChange(parseInt(e.target.value));
    };

    const clearFilters = () => {
        onFilterChange({
            startTime: null,
            endTime: null,
            sourceType: null,
            riskLevel: null
        });
    };

    return (
        <aside
            className={`sidebar ${isOpen ? 'open' : 'closed'}`}
            style={{
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease'
            }}
        >
            <div className="sidebar-section">
                <h3 className="sidebar-title">
                    <span className="icon">🎛️</span>
                    Filters
                </h3>

                <div className="form-group">
                    <label className="form-label">Date Range</label>
                    <div className="date-range">
                        <input
                            type="date"
                            className="form-input"
                            value={filters.startTime?.split('T')[0] || ''}
                            onChange={handleStartTimeChange}
                            placeholder="Start date"
                        />
                        <span className="date-separator">to</span>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.endTime?.split('T')[0] || ''}
                            onChange={handleEndTimeChange}
                            placeholder="End date"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Risk Level</label>
                    <select
                        className="form-select"
                        value={filters.riskLevel || ''}
                        onChange={handleRiskLevelChange}
                    >
                        <option value="">All Levels</option>
                        <option value="High">High Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="Low">Low Risk</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Data Source</label>
                    <select
                        className="form-select"
                        value={filters.sourceType || ''}
                        onChange={handleSourceTypeChange}
                    >
                        <option value="">All Sources</option>
                        <option value="tweet">Twitter/X</option>
                        <option value="report">Reports</option>
                        <option value="message">Messages</option>
                    </select>
                </div>

                <button className="btn btn-secondary clear-btn" onClick={clearFilters}>
                    Clear Filters
                </button>
            </div>

            <div className="sidebar-section">
                <h3 className="sidebar-title">
                    <span className="icon">⚙️</span>
                    Settings
                </h3>

                <div className="form-group">
                    <label className="form-label">Refresh Interval</label>
                    <select
                        className="form-select"
                        value={refreshInterval}
                        onChange={handleIntervalChange}
                    >
                        <option value="2000">2 seconds</option>
                        <option value="5000">5 seconds</option>
                        <option value="10000">10 seconds</option>
                        <option value="30000">30 seconds</option>
                        <option value="60000">1 minute</option>
                    </select>
                </div>
            </div>

            <div className="sidebar-section">
                <h3 className="sidebar-title">
                    <span className="icon">📊</span>
                    Quick Stats
                </h3>

                <div className="quick-stats">
                    <div className="stat-item">
                        <span className="stat-icon">📹</span>
                        <div className="stat-info">
                            <span className="stat-value">Active</span>
                            <span className="stat-label">CCTV Status</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">💬</span>
                        <div className="stat-info">
                            <span className="stat-value">Monitoring</span>
                            <span className="stat-label">Sentiment Feed</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">🔗</span>
                        <div className="stat-info">
                            <span className="stat-value">Connected</span>
                            <span className="stat-label">API Status</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sidebar-footer">
                <p className="version">v1.0.0</p>
                <p className="copyright">© 2024 IRIS System</p>
            </div>
        </aside>
    );
}

export default Sidebar;
