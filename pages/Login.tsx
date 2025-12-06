import React, { useState } from 'react';
import { signInWithEmailAndPassword } from '@firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(err.message || 'Falha ao entrar');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100">
      {/* Visual Side - Premium Leather Experience */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-amber-950 to-slate-950">
        {/* Leather Texture Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?q=80&w=2070&auto=format&fit=crop"
            alt="Premium Leather Texture"
            className="w-full h-full object-cover opacity-40 scale-105"
            style={{ mixBlendMode: 'overlay' }}
          />
          {/* Refined Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-amber-900/60 to-slate-950/95"></div>

          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-10"
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
          </div>
        </div>

        <div className="relative z-10 w-full flex flex-col justify-between p-8 xl:p-12">
          {/* Header with Premium Branding */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-2xl shadow-2xl shadow-amber-500/30 backdrop-blur-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <span className="text-3xl font-bold text-white tracking-tight">
                  Leather<span className="text-amber-400">AI</span>
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1 w-1 rounded-full bg-amber-400"></div>
                  <span className="text-xs text-amber-200/80 font-medium tracking-wider uppercase">Analyst Pro</span>
                </div>
              </div>
            </div>

            {/* Premium Quality Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-white font-semibold">Certificado ISO 9001</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
                Excelência em <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500">
                  Classificação de Couro
                </span>
              </h1>
              <p className="text-base text-slate-200 max-w-md leading-relaxed">
                Análise automatizada com IA que identifica defeitos, classifica qualidade e gera relatórios técnicos em segundos.
              </p>
            </div>

            {/* Quality Grades Showcase */}
            <div className="grid grid-cols-3 gap-2 max-w-md">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-400/30 backdrop-blur-sm">
                <div className="text-xl font-bold text-emerald-300">AB+</div>
                <div className="text-xs text-emerald-200/80 mt-0.5">Premium</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/30 backdrop-blur-sm">
                <div className="text-xl font-bold text-blue-300">TR1 e TR2</div>
                <div className="text-xs text-blue-200/80 mt-0.5">Standard</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-400/30 backdrop-blur-sm">
                <div className="text-xl font-bold text-orange-300">TR3 e TR4 </div>
                <div className="text-xs text-orange-200/80 mt-0.5">Basic</div>
              </div>
            </div>

            {/* Key Features */}
            <div className="space-y-2.5 max-w-md">
              <div className="flex items-center gap-3 text-slate-200">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Detecção de 25+ tipos de defeitos</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Análise em tempo real (&lt;3 segundos)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Precisão de 99.2% na classificação</span>
              </div>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
            <div>
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-xs text-slate-400 mt-0.5">Análises Realizadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">99.2%</div>
              <div className="text-xs text-slate-400 mt-0.5">Precisão Média</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">2.8s</div>
              <div className="text-xs text-slate-400 mt-0.5">Tempo Médio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side - Modern & Clean */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-6 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-900">Leather<span className="text-amber-600">AI</span></span>
            </div>
            <p className="text-sm text-slate-600">Sistema de Análise de Qualidade</p>
          </div>

          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Bem-vindo de volta
              </h2>
              <p className="text-slate-600">
                Acesse sua plataforma de análise profissional
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200 flex items-center gap-3 shadow-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    className="block w-full rounded-xl border-2 border-slate-200 py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all duration-200 bg-white hover:border-slate-300"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-bold text-slate-800">
                      Senha de Acesso
                    </label>
                    <a href="#" className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full rounded-xl border-2 border-slate-200 py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all duration-200 bg-white hover:border-slate-300"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 text-base font-bold rounded-xl text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-600/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Autenticando...' : 'Acessar Plataforma'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 text-slate-500 font-medium">
                    Primeira vez aqui?
                  </span>
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-300 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Criar Conta Profissional
                </Link>
              </div>
            </form>

            {/* Security Badge */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium">Conexão criptografada e segura</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;