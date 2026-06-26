import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AvatarCreation from './pages/AvatarCreation';
import MapPage from './pages/Map';
import Report from './pages/Report';
import Missions from './pages/Missions';
import Leaderboard from './pages/Leaderboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import ImpactDashboard from './pages/ImpactDashboard';
import Heatmap from './pages/Heatmap';
import { ErrorBoundary } from './components/ErrorBoundary';
import TopNav from './components/TopNav';
import BottomNav from './components/BottomNav';

import { Navigate } from 'react-router-dom';
import { getToken } from './api';

function ProtectedRoute({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Layout({ children }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <div style={{ flex: 1, padding: '20px', paddingBottom: '80px', marginTop: '70px' }}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/authority" element={<ErrorBoundary><AuthorityDashboard /></ErrorBoundary>} />
        
        {/* Protected Player Routes */}
        <Route path="/avatar-creation" element={<ProtectedRoute><AvatarCreation /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><ErrorBoundary><MapPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="/missions" element={<ProtectedRoute><ErrorBoundary><Missions /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><ErrorBoundary><Leaderboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/impact" element={<ProtectedRoute><ErrorBoundary><ImpactDashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/heatmap" element={<ProtectedRoute><ErrorBoundary><Heatmap /></ErrorBoundary></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
