import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from '@firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
        setError("As senhas não coincidem");
        return;
    }
    
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#2c1810]">
        <div className="absolute inset-0">
            {/* Imagem de Rolos de Couro/Hides (Industrial) */}
            <img 
            src="https://images.unsplash.com/photo-1627913312061-0f7962464738?q=80&w=2070&auto=format&fit=crop" 
            alt="Leather Hides Rolls" 
            className="w-full h-full object-cover opacity-70 scale-105"
            />
            {/* Gradiente Quente Âmbar/Café */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#3D2616] via-[#5C3A21]/70 to-[#2A1B12]/40"></div>
        </div>
        
        <div className="relative z-10 w-full flex flex-col justify-between p-16 text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                {/* Ícone Lupa */}
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight drop-shadow-sm">Leather<span className="text-amber-300">AI</span></span>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold leading-tight drop-shadow-sm">
              Padronize sua <br/>
              qualidade.
            </h1>
            <p className="text-lg text-amber-100 max-w-md font-light">
              Junte-se a líderes da indústria que já usam IA para garantir a excelência no acabamento.
            </p>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#fffaf8]">
        <div className="w-full max-w-sm space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#3D2616] tracking-tight">Criar Conta</h2>
            <p className="text-[#8C7668]">Inicie sua gestão inteligente de peles.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                 {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[#5C3A21] mb-1.5">E-mail</label>
              <input
                type="email"
                required
                className="block w-full rounded-xl border-[#E5DACE] py-3 px-4 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200 bg-white shadow-sm"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#5C3A21] mb-1.5">Senha</label>
              <input
                type="password"
                required
                className="block w-full rounded-xl border-[#E5DACE] py-3 px-4 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200 bg-white shadow-sm"
                placeholder="Crie uma senha forte"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#5C3A21] mb-1.5">Confirmar Senha</label>
              <input
                type="password"
                required
                className="block w-full rounded-xl border-[#E5DACE] py-3 px-4 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200 bg-white shadow-sm"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full py-3.5 mt-2 text-base shadow-amber-900/20 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-[#3D2616] border-transparent" isLoading={loading}>
              Cadastrar
            </Button>

            <p className="text-center text-sm text-[#8C7668] pt-2">
              Já possui acesso?{' '}
              <Link to="/login" className="font-semibold text-amber-700 hover:text-amber-900 transition-colors">
                Fazer Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;