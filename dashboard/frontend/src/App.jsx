import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useUser } from './contexts/UserContext'
import Login from './components/Login'
import RoleBasedDashboard from './components/RoleBasedDashboard'
import IssueDetail from './pages/IssueDetail'

function ProtectedRoute({ children }) {
    const { user, isLoading } = useUser();
    
    if (isLoading) {
        return <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh',
            color: '#fff'
        }}>Loading...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                    path="/" 
                    element={
                        <ProtectedRoute>
                            <RoleBasedDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/issue/:id" 
                    element={
                        <ProtectedRoute>
                            <IssueDetail />
                        </ProtectedRoute>
                    } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    )
}

export default App
