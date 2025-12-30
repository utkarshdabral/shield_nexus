import { useUser } from '../contexts/UserContext';
import { useParams } from 'react-router-dom';
import IssueDetail from '../pages/IssueDetail';

// Police Department Views
import PoliceFieldOfficerDashboard from './dashboards/PoliceFieldOfficerDashboard';
import PoliceAnalystDashboard from './dashboards/PoliceAnalystDashboard';
import PoliceSupervisorDashboard from './dashboards/PoliceSupervisorDashboard';

// Fire Department Views
import FireFieldOfficerDashboard from './dashboards/FireFieldOfficerDashboard';
import FireAnalystDashboard from './dashboards/FireAnalystDashboard';

// Medical Services Views
import MedicalFieldOfficerDashboard from './dashboards/MedicalFieldOfficerDashboard';
import MedicalAnalystDashboard from './dashboards/MedicalAnalystDashboard';

// Environment Department Views
import EnvironmentAnalystDashboard from './dashboards/EnvironmentAnalystDashboard';

// Coordinator View
import CoordinatorDashboard from './dashboards/CoordinatorDashboard';

function RoleBasedDashboard() {
    const { user } = useUser();
    const { id: issueId } = useParams();

    if (!user) {
        return null;
    }

    // If viewing a specific issue, use the standard IssueDetail
    // This handles /issue/:id routes
    if (issueId) {
        return <IssueDetail />;
    }

    const { agency, role } = user;

    // Police Department
    if (agency === 'Police Department') {
        if (role === 'Field Officer') {
            return <PoliceFieldOfficerDashboard />;
        }
        if (role === 'Data Analyst') {
            return <PoliceAnalystDashboard />;
        }
        if (role === 'Supervisor' || role === 'Agency Admin') {
            return <PoliceSupervisorDashboard />;
        }
    }

    // Fire & Emergency
    if (agency === 'Fire & Emergency') {
        if (role === 'Field Officer') {
            return <FireFieldOfficerDashboard />;
        }
        if (role === 'Data Analyst' || role === 'Supervisor' || role === 'Agency Admin') {
            return <FireAnalystDashboard />;
        }
    }

    // Medical Services
    if (agency === 'Medical Services') {
        if (role === 'Field Officer') {
            return <MedicalFieldOfficerDashboard />;
        }
        if (role === 'Data Analyst' || role === 'Supervisor' || role === 'Agency Admin') {
            return <MedicalAnalystDashboard />;
        }
    }

    // Environment Department
    if (agency === 'Environment Department') {
        return <EnvironmentAnalystDashboard />;
    }

    // Disaster Management
    if (agency === 'Disaster Management') {
        return <CoordinatorDashboard />;
    }

    // Inter-Agency Coordinator
    if (agency === 'Inter-Agency Coordinator' || role === 'Coordinator') {
        return <CoordinatorDashboard />;
    }

    // Default fallback - should not reach here, but show a message if it does
    return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>
            <h2>Dashboard Loading...</h2>
            <p>Please contact system administrator if this message persists.</p>
        </div>
    );
}

export default RoleBasedDashboard;

