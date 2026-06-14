import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Placeholders for Dashboard and Groups until we code them
const DashboardPlaceholder = () => (
  <MainLayout>
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">Financial Dashboard</h1>
          <p className="text-on-surface-variant mt-1">Real-time overview of your active debts, settlements, and summaries.</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-level-1 card-hover">
          <p className="text-xs font-semibold text-outline tracking-wider uppercase">Total Balance</p>
          <p className="text-3xl font-mono font-semibold text-secondary mt-2">$0.00</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-level-1 card-hover">
          <p className="text-xs font-semibold text-outline tracking-wider uppercase">You Owe</p>
          <p className="text-3xl font-mono font-semibold text-error mt-2">$0.00</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-level-1 card-hover">
          <p className="text-xs font-semibold text-outline tracking-wider uppercase">You Are Owed</p>
          <p className="text-3xl font-mono font-semibold text-success mt-2">$0.00</p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl border border-border-subtle">
        <h2 className="text-lg font-semibold mb-4 text-primary">Recent Activity</h2>
        <p className="text-sm text-outline">You are fully settled up! Create or join a group to start adding expenses.</p>
      </div>
    </div>
  </MainLayout>
);

const GroupsPlaceholder = () => (
  <MainLayout>
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">My Groups</h1>
          <p className="text-on-surface-variant mt-1">Manage, add members, and split expenses inside your groups.</p>
        </div>
      </header>
      <div className="bg-white p-8 rounded-2xl border border-border-subtle text-center max-w-lg mx-auto mt-12">
        <p className="text-outline mb-6">No groups joined yet. Create your first group to start splitting costs.</p>
        <button className="btn-transition bg-secondary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-secondary-dark shadow-level-2">
          Create New Group
        </button>
      </div>
    </div>
  </MainLayout>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #E2E8F0',
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
            <Route path="/dashboard" element={<DashboardPlaceholder />} />
            <Route path="/groups" element={<GroupsPlaceholder />} />
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
