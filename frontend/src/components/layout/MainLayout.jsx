import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LuLayoutDashboard, 
  LuUsers, 
  LuLogOut, 
  LuWallet,
  LuMenu,
  LuX
} from 'react-icons/lu';

export const MainLayout = ({ children }) => {
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
  ];

  return (
    <div className="min-h-screen bg-bg-canvas flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-primary-container text-white z-20 shadow-level-2">
        <div className="flex items-center gap-3">
          <LuWallet className="text-2xl text-secondary" />
          <span className="font-semibold text-lg tracking-tight">SplitSmart</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1 text-white hover:text-secondary focus:outline-none"
        >
          {mobileOpen ? <LuX size={24} /> : <LuMenu size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-primary-container text-white px-6 py-8 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo */}
          <div className="hidden md:flex items-center gap-3 mb-10">
            <LuWallet className="text-3xl text-secondary" />
            <span className="font-semibold text-xl tracking-tight">SplitSmart</span>
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
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-secondary text-white shadow-level-2' 
                      : 'text-on-primary-container hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <Icon className="text-lg" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile / Logout */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center font-semibold text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-on-primary-container truncate">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error-light/20 transition-all duration-200"
          >
            <LuLogOut className="text-lg" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-container-max mx-auto w-full overflow-y-auto">
        {children}
      </main>

      {/* Backdrop for Mobile Sidebar */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-xs"
        />
      )}
    </div>
  );
};
