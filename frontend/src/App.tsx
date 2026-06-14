import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/dashboard/Dashboard';
import { GroupList } from './pages/groups/GroupList';
import { GroupDetails } from './pages/groups/GroupDetails';
import { GroupExpenses } from './pages/expenses/GroupExpenses';
import { GroupSettlements } from './pages/expenses/GroupSettlements';
import { ImportCsv } from './pages/imports/ImportCsv';
import { ImportReport } from './pages/imports/ImportReport';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0F172A',
              color: '#F8FAFC',
              border: '1px solid #1E293B',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
            },
          }} 
        />
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Main Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/groups" element={<GroupList />} />
            <Route path="/groups/:groupId" element={<GroupDetails />} />
            <Route path="/groups/:groupId/expenses" element={<GroupExpenses />} />
            <Route path="/groups/:groupId/settlements" element={<GroupSettlements />} />
            <Route path="/groups/:groupId/import" element={<ImportCsv />} />
            <Route path="/groups/:groupId/imports/:importId" element={<ImportReport />} />
            
            {/* Catch-all redirected to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
