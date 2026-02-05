
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useStore } from './store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TeacherManagement = lazy(() => import('./pages/TeacherManagement'));
const StudentManagement = lazy(() => import('./pages/StudentManagement'));
const ClassManagement = lazy(() => import('./pages/ClassManagement'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Payments = lazy(() => import('./pages/Payments'));
const SalarySlips = lazy(() => import('./pages/SalarySlips'));
const Reports = lazy(() => import('./pages/Reports'));
const AcademicInfo = lazy(() => import('./pages/AcademicInfo'));

const AppContent: React.FC = () => {
  const { loading } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('mecda_auth') === 'true';
    setIsAuthenticated(authStatus);
    setCheckingAuth(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('mecda_auth');
    setIsAuthenticated(false);
  };

  if (loading || checkingAuth) {
    return (
      <div className="fixed inset-0 bg-indigo-600 flex flex-col items-center justify-center text-white z-[9999]">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold">Initializing System...</h2>
        <p className="text-indigo-100 opacity-75">Configuring secure workspace</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/academic" element={<AcademicInfo />} />
            <Route path="/teachers" element={<TeacherManagement />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/classes" element={<ClassManagement />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/salary-slips" element={<SalarySlips />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<div className="p-20 text-center text-gray-400">Settings module is currently under maintenance.</div>} />
            <Route path="/logout" element={<LogoutAction onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
}

const LogoutAction: React.FC<{onLogout: () => void}> = ({onLogout}) => {
  useEffect(() => {
    onLogout();
  }, [onLogout]);
  return <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
