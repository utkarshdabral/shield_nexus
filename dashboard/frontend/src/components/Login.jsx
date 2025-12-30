import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, AGENCIES, ROLES } from '../contexts/UserContext';
import './Login.css';

function Login() {
    const [selectedAgency, setSelectedAgency] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const { login } = useUser();
    const navigate = useNavigate();

    const availableRoles = selectedAgency ? ROLES[selectedAgency] || [] : [];

    const handleLogin = (e) => {
        e.preventDefault();
        if (selectedAgency && selectedRole) {
            login(selectedAgency, selectedRole);
            navigate('/');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon">🛡️</div>
                    <h1 className="login-title">NEXUS</h1>
                    <p className="login-subtitle">Inter-Agency Data Sharing Platform</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="agency">Select Agency:</label>
                        <select
                            id="agency"
                            value={selectedAgency}
                            onChange={(e) => {
                                setSelectedAgency(e.target.value);
                                setSelectedRole(''); // Reset role when agency changes
                            }}
                            required
                            className="form-select"
                        >
                            <option value="">-- Select Agency --</option>
                            {AGENCIES.map(agency => (
                                <option key={agency} value={agency}>{agency}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Select Role:</label>
                        <select
                            id="role"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            required
                            className="form-select"
                            disabled={!selectedAgency}
                        >
                            <option value="">-- Select Role --</option>
                            {availableRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={!selectedAgency || !selectedRole}
                    >
                        Login to Dashboard
                    </button>
                </form>

                <div className="login-info">
                    <p className="info-text">
                        <strong>Demo Mode:</strong> No password required. Select your agency and role to access the dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;

