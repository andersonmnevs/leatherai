import React from 'react';
import { signOut } from '@firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed w-full z-50 top-0 transition-all duration-300 border-b border-white/20 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group cursor-pointer">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-all duration-300">
                 {/* Ícone de Lupa/Inspeção */}
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
                Leather<span className="text-brand-600">AI</span>
              </span>
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center space-x-2">
                <Link 
                    to="/" 
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive('/') 
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    Nova Análise
                </Link>
                <Link 
                    to="/history" 
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive('/history') 
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    Histórico
                </Link>
                <Link 
                    to="/analytics" 
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        isActive('/analytics') 
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Dashboard
                </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
                 <span className="text-xs font-semibold text-slate-700">{auth.currentUser?.email?.split('@')[0]}</span>
                 <span className="text-[10px] text-slate-400">Enterprise Plan</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              title="Sair"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;