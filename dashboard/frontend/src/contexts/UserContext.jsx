import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within UserProvider');
    }
    return context;
};

// Agency and role definitions
export const AGENCIES = [
    'Police Department',
    'Fire & Emergency',
    'Medical Services',
    'Environment Department',
    'Disaster Management',
    'Inter-Agency Coordinator'
];

export const ROLES = {
    'Police Department': ['Field Officer', 'Data Analyst', 'Supervisor', 'Agency Admin'],
    'Fire & Emergency': ['Field Officer', 'Data Analyst', 'Supervisor', 'Agency Admin'],
    'Medical Services': ['Field Officer', 'Data Analyst', 'Supervisor', 'Agency Admin'],
    'Environment Department': ['Field Officer', 'Data Analyst', 'Supervisor', 'Agency Admin'],
    'Disaster Management': ['Field Officer', 'Data Analyst', 'Supervisor', 'Agency Admin'],
    'Inter-Agency Coordinator': ['Coordinator']
};

// Access rules for different data types
export const ACCESS_RULES = {
    cctv_heatmap: {
        owner: 'Police Department',
        classification: 'RESTRICTED',
        sharedWith: ['Fire & Emergency', 'Medical Services', 'Disaster Management', 'Inter-Agency Coordinator']
    },
    sentiment_analysis: {
        owner: 'Environment Department',
        classification: 'RESTRICTED',
        sharedWith: ['Police Department', 'Medical Services', 'Disaster Management', 'Inter-Agency Coordinator']
    },
    risk_index: {
        owner: 'Inter-Agency Coordinator',
        classification: 'RESTRICTED',
        sharedWith: ['Police Department', 'Fire & Emergency', 'Medical Services', 'Disaster Management', 'Environment Department']
    },
    hospital_capacity: {
        owner: 'Medical Services',
        classification: 'CONFIDENTIAL',
        sharedWith: ['Disaster Management', 'Inter-Agency Coordinator']
    },
    fire_resources: {
        owner: 'Fire & Emergency',
        classification: 'RESTRICTED',
        sharedWith: ['Police Department', 'Disaster Management', 'Inter-Agency Coordinator']
    },
    air_quality: {
        owner: 'Environment Department',
        classification: 'PUBLIC',
        sharedWith: ['Police Department', 'Fire & Emergency', 'Medical Services', 'Disaster Management', 'Inter-Agency Coordinator']
    }
};

// Check if user can access a data type
export const canAccess = (dataName, user) => {
    if (!user) return false;
    
    const data = ACCESS_RULES[dataName];
    if (!data) return false;
    
    // Coordinators have full access
    if (user.role === 'Coordinator' || user.agency === 'Inter-Agency Coordinator') {
        return true;
    }
    
    // Own agency always has access
    if (data.owner === user.agency) {
        return true;
    }
    
    // Check if shared with user's agency
    if (data.sharedWith.includes(user.agency)) {
        return true;
    }
    
    return false;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load user from localStorage on mount
        const savedUser = localStorage.getItem('nexus_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Failed to parse saved user:', e);
            }
        }
        setIsLoading(false);
    }, []);

    const login = (agency, role) => {
        const newUser = {
            username: `${agency.toLowerCase().replace(/\s+/g, '.')}.${role.toLowerCase().replace(/\s+/g, '.')}`,
            agency,
            role,
            clearanceLevel: role === 'Coordinator' ? 4 : role === 'Agency Admin' ? 3 : role === 'Supervisor' ? 2 : 1,
            permissions: getPermissions(agency, role),
            loginTime: new Date().toISOString()
        };
        
        setUser(newUser);
        localStorage.setItem('nexus_user', JSON.stringify(newUser));
        
        // Log activity
        logActivity('LOGIN', `Logged in as ${role} from ${agency}`, 'SUCCESS');
    };

    const logout = () => {
        if (user) {
            logActivity('LOGOUT', `Logged out from ${user.agency}`, 'SUCCESS');
        }
        setUser(null);
        localStorage.removeItem('nexus_user');
    };

    const getPermissions = (agency, role) => {
        const basePermissions = ['READ_OWN'];
        
        if (role === 'Coordinator') {
            return ['READ_OWN', 'READ_SHARED', 'READ_ALL', 'CREATE_ALERTS', 'BROADCAST_ALERTS', 'MANAGE_ACCESS'];
        }
        
        if (role === 'Agency Admin') {
            return ['READ_OWN', 'READ_SHARED', 'CREATE_ALERTS', 'EXPORT_DATA'];
        }
        
        if (role === 'Supervisor') {
            return ['READ_OWN', 'READ_SHARED', 'CREATE_ALERTS'];
        }
        
        if (role === 'Data Analyst') {
            return ['READ_OWN', 'READ_SHARED', 'EXPORT_DATA'];
        }
        
        return basePermissions;
    };

    const logActivity = (action, resource, status) => {
        const logs = JSON.parse(localStorage.getItem('nexus_activity_log') || '[]');
        const logEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            user: user?.username || 'system',
            agency: user?.agency || 'system',
            action,
            resource,
            status
        };
        
        logs.unshift(logEntry);
        logs.splice(100); // Keep only last 100 entries
        localStorage.setItem('nexus_activity_log', JSON.stringify(logs));
    };

    return (
        <UserContext.Provider value={{ user, login, logout, isLoading, logActivity }}>
            {children}
        </UserContext.Provider>
    );
};

