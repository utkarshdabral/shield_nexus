import { useUser, canAccess, ACCESS_RULES } from '../contexts/UserContext';
import './AccessIndicator.css';

function AccessIndicator({ dataName, children }) {
    const { user } = useUser();
    const hasAccess = canAccess(dataName, user);
    const dataInfo = ACCESS_RULES[dataName];

    if (!dataInfo) {
        return children;
    }

    if (!hasAccess) {
        return (
            <div className="access-denied">
                <div className="access-denied-content">
                    <div className="access-icon">🔒</div>
                    <h3>Access Denied</h3>
                    <p className="access-reason">
                        This data is classified as <strong>{dataInfo.classification}</strong> and is owned by <strong>{dataInfo.owner}</strong>.
                    </p>
                    <p className="access-detail">
                        Your agency ({user?.agency}) does not have permission to access this data.
                    </p>
                    {user?.role !== 'Coordinator' && (
                        <p className="access-note">
                            Contact an Inter-Agency Coordinator to request access.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="access-granted">
            <div className="access-header">
                <div className="access-badge access-allowed">
                    ✅ Access Granted
                </div>
                <div className="access-info">
                    <span className="data-source">Source: {dataInfo.owner}</span>
                    <span className="data-classification">Classification: {dataInfo.classification}</span>
                    {dataInfo.owner !== user?.agency && (
                        <span className="access-reason-text">
                            Shared with {user?.agency} via inter-agency policy
                        </span>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
}

export default AccessIndicator;

