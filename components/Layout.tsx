
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', path: '/', icon: 'fa-gauge' },
  { name: 'Academic Info', path: '/academic', icon: 'fa-building-columns' },
  { name: 'Teachers', path: '/teachers', icon: 'fa-chalkboard-user' },
  { name: 'Students', path: '/students', icon: 'fa-user-graduate' },
  { name: 'Classes', path: '/classes', icon: 'fa-calendar-days' },
  { name: 'Attendance', path: '/attendance', icon: 'fa-clipboard-user' },
  { name: 'Payments', path: '/payments', icon: 'fa-credit-card' },
  { name: 'Salary Slips', path: '/salary-slips', icon: 'fa-file-invoice-dollar' },
  { name: 'Reports', path: '/reports', icon: 'fa-file-invoice' },
  { name: 'Settings', path: '/settings', icon: 'fa-sliders' },
  { name: 'Logout', path: '/logout', icon: 'fa-right-from-bracket' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-tight">MECDA</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-2xl">
          <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-indigo-700 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h2 className="text-2xl font-bold border-b border-indigo-500 pb-4">MECDA</h2>
        </div>
        <nav className="mt-4 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                ${location.pathname === item.path ? 'bg-white text-indigo-700 font-bold shadow-md' : 'hover:bg-indigo-600'}
                ${item.name === 'Logout' ? 'mt-8 text-red-100 hover:text-white hover:bg-red-600/20' : ''}
              `}
            >
              <i className={`fa-solid ${item.icon} w-6 text-center`}></i>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
