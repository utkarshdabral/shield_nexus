import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CCTVPanel from '../components/CCTVPanel';
import SentimentPanel from '../components/SentimentPanel';
import RiskPanel from '../components/RiskPanel';
import AlertSystem from '../components/AlertSystem';
import ActivityLog from '../components/ActivityLog';
import AccessIndicator from '../components/AccessIndicator';
import { fetchDashboardSummary, fetchIssueById } from '../services/api';

function IssueDetail() {
    const { id: issueId } = useParams();
    const navigate = useNavigate();
    
    // Convert issueId to number for consistency
    const numericIssueId = issueId ? parseInt(issueId, 10) : null;
    
    console.log('[IssueDetail] Route param id:', issueId, 'Parsed numericIssueId:', numericIssueId);

    // Issue specific state
    const [issue, setIssue] = useState(null);

    // Dashboard state
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(5000);
    const [filters, setFilters] = useState({
        startTime: null,
        endTime: null,
        sourceType: null,
        riskLevel: null
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const loadData = useCallback(async () => {
        try {
            console.log('[IssueDetail] loadData called with issueId:', numericIssueId);
            // Fetch Dashboard Summary specifically for this Issue ID
            // We pass issueId as query param to backend
            // For now, let's assume fetchDashboardSummary supports issueId logic or we filter client side
            // Ideally backend updated to support ?issueId=...
            const data = await fetchDashboardSummary(numericIssueId); // Requires API update
            setSummary(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [numericIssueId]); // Dependency on numericIssueId

    useEffect(() => {
        // Load Issue Details
        const loadIssueDetails = async () => {
            try {
                console.log('[IssueDetail] Loading issue details for id:', numericIssueId);
                const data = await fetchIssueById(numericIssueId);
                setIssue(data);
            } catch (err) {
                console.error("Failed to load issue details", err);
                // navigate('/'); // Redirect if invalid?
            }
        };
        loadIssueDetails();
    }, [numericIssueId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(loadData, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, loadData]);

    const handleRefreshToggle = () => {
        setAutoRefresh(prev => !prev);
    };

    const handleManualRefresh = () => {
        setLoading(true);
        loadData();
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    return (
        <div className="app">
            <Header
                summary={summary}
                onRefresh={handleManualRefresh}
                autoRefresh={autoRefresh}
                onAutoRefreshToggle={handleRefreshToggle}
                subTitle={issue ? `Operation: ${issue.title}` : 'Loading...'}
                onBack={() => navigate('/')} // Add back button logic to Header later
            />

            <div className="app-layout">
                <Sidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    refreshInterval={refreshInterval}
                    onRefreshIntervalChange={setRefreshInterval}
                    issueDetails={issue} // Pass issue details to sidebar if needed
                    isOpen={isSidebarOpen}
                />

                <main
                    className="main-content"
                    style={{
                        marginLeft: isSidebarOpen ? 'var(--sidebar-width)' : '0',
                        transition: 'margin-left 0.3s ease'
                    }}
                >
                    {/* Breadcrumb or Back Link */}
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                ← Back to Operations
                            </button>
                            {issue && (
                                <span style={{ color: 'var(--color-text-muted)' }}>/ {issue.location}</span>
                            )}
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{
                                padding: '4px 12px',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>{isSidebarOpen ? '◀' : '▶'}</span>
                            {isSidebarOpen ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>

                    {error && (
                        <div className="error-banner">
                            <span className="error-icon">⚠️</span>
                            {error}
                            <button onClick={handleManualRefresh} className="retry-btn">
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Inter-Agency Alert System */}
                    <AlertSystem />

                    <div className="dashboard-grid">
                        <div className="panel-section risk-section">
                            <AccessIndicator dataName="risk_index">
                                <RiskPanel
                                    summary={summary}
                                    loading={loading}
                                    filters={{ ...filters, issueId: numericIssueId }}
                                />
                            </AccessIndicator>
                        </div>

                        <div className="panel-section cctv-section">
                            <AccessIndicator dataName="cctv_heatmap">
                                <CCTVPanel
                                    key={`cctv-${numericIssueId}`}
                                    summary={summary}
                                    loading={loading}
                                    filters={{ ...filters, issueId: numericIssueId }}
                                />
                            </AccessIndicator>
                        </div>

                        <div className="panel-section sentiment-section">
                            <AccessIndicator dataName="sentiment_analysis">
                                <SentimentPanel
                                    summary={summary}
                                    loading={loading}
                                    filters={{ ...filters, issueId: numericIssueId }}
                                />
                            </AccessIndicator>
                        </div>
                    </div>

                    {/* Activity Log Sidebar */}
                    <ActivityLog />
                </main>
            </div>
        </div>
    );
}

export default IssueDetail;
