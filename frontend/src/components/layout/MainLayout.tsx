import React, { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LuLayoutDashboard, 
  LuUsers, 
  LuLogOut, 
  LuWallet,
  LuMenu,
  LuX,
  LuFileSpreadsheet,
  LuHistory
} from 'react-icons/lu';

export const MainLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LuLayoutDashboard },
    { name: 'Groups', path: '/groups', icon: LuUsers },
    { name: 'CSV Import Center', path: '/imports', icon: LuFileSpreadsheet },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-on-background">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-surface text-on-surface z-20 border-b border-outline">
        <div className="flex items-center gap-3">
          <LuWallet className="text-xl text-primary animate-pulse" />
          <span className="font-semibold text-lg tracking-tight text-primary">SplitSmart</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1 text-on-surface hover:text-primary focus:outline-none btn-transition"
        >
          {mobileOpen ? <LuX size={24} /> : <LuMenu size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation - Persistent left navbar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-[260px] bg-surface text-on-surface px-6 py-8 flex flex-col justify-between
        border-r border-outline transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo */}
          <div className="hidden md:flex items-center gap-3 mb-10">
            <LuWallet className="text-2xl text-primary" />
            <span className="font-bold text-lg tracking-tight text-primary">SplitSmart</span>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                   key={item.path}
                   to={item.path}
                   onClick={() => setMobileOpen(false)}
                   className={({ isActive }) => `
                     flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                     ${isActive 
                       ? 'bg-primary-container text-primary font-semibold border-l-2 border-primary' 
                       : 'text-on-surface-variant hover:bg-surface-dim hover:text-primary'}
                   `}
                >
                  <Icon className="text-lg opacity-80" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile / Logout */}
        <div className="pt-6 border-t border-outline space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-container flex items-center justify-center font-semibold text-primary">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-primary leading-tight">{user?.name}</p>
              <p className="text-xs text-on-surface-variant truncate leading-none mt-1">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-error hover:bg-error-container hover:text-on-error-container transition-all duration-150 btn-transition cursor-pointer"
          >
            <LuLogOut className="text-lg opacity-80" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="page-container">
          {children}
        </div>
      </main>

      {/* Backdrop for Mobile Sidebar */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-xs"
        />
      )}
    </div>
  );
};

