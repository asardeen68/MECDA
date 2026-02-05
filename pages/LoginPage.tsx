
import React, { useState } from 'react';
import { useStore } from '../store';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { academyInfo } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        localStorage.setItem('mecda_auth', 'true');
        onLogin();
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-10 text-center bg-indigo-600 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse"></div>
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
             
             <div className="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-xl mb-6 transform rotate-3 hover:rotate-0 transition-transform p-2 overflow-hidden">
                {academyInfo.logoUrl ? (
                  <img src={academyInfo.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <i className="fa-solid fa-graduation-cap text-indigo-600 text-4xl"></i>
                )}
             </div>
             <h1 className="text-3xl font-black tracking-tight uppercase">{academyInfo.name}</h1>
             <p className="text-indigo-100 font-medium text-xs mt-1 opacity-80 uppercase tracking-widest">Secure Access Portal</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-black flex items-center gap-3 animate-shake">
                <i className="fa-solid fa-circle-exclamation text-lg"></i>
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Username</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                  <input 
                    type="text" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-gray-700 transition-all"
                    placeholder="Enter username"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-gray-700 transition-all"
                    placeholder="Enter password"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  Sign In
                </>
              )}
            </button>
            
            <div className="pt-4 text-center border-t border-gray-50 mt-4">
               <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-relaxed">
                 Developed by : Mohamed Asarudeen (SLTS)<br/>
                 NDT in ICT, HNDIT
               </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
