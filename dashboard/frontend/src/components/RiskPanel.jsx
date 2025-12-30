import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Area, ComposedChart
} from 'recharts';
import { fetchRiskHistory } from '../services/api';
import './RiskPanel.css';

function RiskPanel({ summary, loading, filters }) {
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await fetchRiskHistory({ limit: 50, ...filters });
                // Transform and reverse for chronological order
                const transformed = (data || []).reverse().map((item, index) => ({
                    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    combined: (item.combined_score || 0) * 100,
                    cctv: (item.cctv_score || 0) * 100,
                    sentiment: (item.sentiment_score || 0) * 100,
                    index
                }));
                setHistoryData(transformed);
            } catch (error) {
                console.error('Failed to load risk history:', error);
            } finally {
                setHistoryLoading(false);
            }
        };

        loadHistory();
    }, [filters]);

    const currentRisk = summary?.riskIndex?.current || 0;
    const riskLevel = summary?.riskIndex?.level?.toLowerCase() || 'low';
    const riskPercentage = (currentRisk * 100).toFixed(1);

    // Calculate needle rotation for gauge (0 = left, 180 = right)
    const needleRotation = -90 + (currentRisk * 180);

    const getRiskColor = (level) => {
        switch (level) {
            case 'high': return 'var(--color-danger)';
            case 'medium': return 'var(--color-warning)';
            default: return 'var(--color-success)';
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="value" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toFixed(1)}%
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading && !summary) {
        return (
            <div className="risk-panel">
                <div className="panel-header">
                    <h2 className="panel-title">
                        <span className="icon">⚡</span>
                        Unified Risk Index
                    </h2>
                </div>
                <div className="loading-placeholder">
                    <div className="loading-spinner"></div>
                    <p>Loading risk data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="risk-panel">
            <div className="panel-header">
                <h2 className="panel-title">
                    <span className="icon">⚡</span>
                    Unified Risk Index
                </h2>
                <div className="panel-actions">
                    <span className={`status-badge ${riskLevel}`}>
                        <span className={`status-dot ${riskLevel}`}></span>
                        {riskLevel.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="risk-content">
                <div className="risk-gauge-section">
                    <div className="gauge-wrapper">
                        <svg viewBox="0 0 200 110" className="gauge-svg">
                            {/* Background arc */}
                            <defs>
                                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="var(--color-success)" />
                                    <stop offset="50%" stopColor="var(--color-warning)" />
                                    <stop offset="100%" stopColor="var(--color-danger)" />
                                </linearGradient>
                            </defs>

                            {/* Track */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="12"
                                strokeLinecap="round"
                            />

                            {/* Colored arc */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke="url(#gaugeGradient)"
                                strokeWidth="12"
                                strokeLinecap="round"
                                opacity="0.8"
                            />

                            {/* Needle */}
                            <g transform={`rotate(${needleRotation}, 100, 100)`}>
                                <line
                                    x1="100"
                                    y1="100"
                                    x2="100"
                                    y2="30"
                                    stroke={getRiskColor(riskLevel)}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <circle cx="100" cy="100" r="8" fill={getRiskColor(riskLevel)} />
                                <circle cx="100" cy="100" r="4" fill="var(--color-bg-primary)" />
                            </g>

                            {/* Labels */}
                            <text x="20" y="108" className="gauge-label" fill="var(--color-text-muted)">0</text>
                            <text x="100" y="15" className="gauge-label" textAnchor="middle" fill="var(--color-text-muted)">50</text>
                            <text x="180" y="108" className="gauge-label" textAnchor="end" fill="var(--color-text-muted)">100</text>
                        </svg>

                        <div className="gauge-value-display">
                            <span className="gauge-percentage" style={{ color: getRiskColor(riskLevel) }}>
                                {riskPercentage}%
                            </span>
                            <span className="gauge-label-text">Combined Risk</span>
                        </div>
                    </div>

                    <div className="risk-breakdown">
                        <div className="breakdown-item">
                            <div className="breakdown-header">
                                <span className="breakdown-icon">📹</span>
                                <span className="breakdown-label">CCTV Risk</span>
                            </div>
                            <div className="breakdown-bar">
                                <div
                                    className="breakdown-fill cctv"
                                    style={{ width: `${(summary?.cctv?.escalation || 0) * 100}%` }}
                                ></div>
                            </div>
                            <span className="breakdown-value">
                                {((summary?.cctv?.escalation || 0) * 100).toFixed(1)}%
                            </span>
                        </div>

                        <div className="breakdown-item">
                            <div className="breakdown-header">
                                <span className="breakdown-icon">💬</span>
                                <span className="breakdown-label">Sentiment Risk</span>
                            </div>
                            <div className="breakdown-bar">
                                <div
                                    className="breakdown-fill sentiment"
                                    style={{ width: `${Math.max(0, (1 - (summary?.sentiment?.avgCompound || 0)) / 2 * 100)}%` }}
                                ></div>
                            </div>
                            <span className="breakdown-value">
                                {((1 - (summary?.sentiment?.avgCompound || 0)) / 2 * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="risk-chart-section">
                    <h3 className="chart-title">Risk Trend Over Time</h3>
                    {historyLoading ? (
                        <div className="chart-loading">
                            <div className="loading-skeleton" style={{ height: 200 }}></div>
                        </div>
                    ) : historyData.length > 0 ? (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={200}>
                                <ComposedChart data={historyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="time"
                                        stroke="var(--color-text-muted)"
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis
                                        stroke="var(--color-text-muted)"
                                        tick={{ fontSize: 11 }}
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine y={70} stroke="var(--color-danger)" strokeDasharray="5 5" opacity={0.5} />
                                    <ReferenceLine y={40} stroke="var(--color-warning)" strokeDasharray="5 5" opacity={0.5} />
                                    <Area
                                        type="monotone"
                                        dataKey="combined"
                                        fill="url(#riskGradient)"
                                        stroke="var(--color-accent-primary)"
                                        strokeWidth={2}
                                        name="Combined"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="cctv"
                                        stroke="var(--color-info)"
                                        strokeWidth={1.5}
                                        dot={false}
                                        name="CCTV"
                                        strokeDasharray="3 3"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="sentiment"
                                        stroke="var(--color-warning)"
                                        strokeWidth={1.5}
                                        dot={false}
                                        name="Sentiment"
                                        strokeDasharray="3 3"
                                    />
                                    <defs>
                                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-accent-primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <span className="icon">📈</span>
                            <p className="message">No historical data available</p>
                            <p className="hint">Risk history will appear as data is collected</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RiskPanel;
