import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authenticateUser } from '../services/api';
import { Lock, User as UserIcon, Loader2, Truck, Package, ShieldCheck, ArrowRight, BarChart3, CheckCircle2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await authenticateUser(username, password);
      login(user);
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        setError('Usuário incorreto.');
      } else if (err.message === 'WRONG_PASSWORD') {
        setError('Senha incorreta.');
      } else {
        setError('Erro de conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Background Ambience (Subtle Animations) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-6xl h-full md:h-[700px] flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden z-10 mx-4 md:mx-8 border border-white/10 relative">
        
        {/* Left Side: Brand Visuals */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-900 p-12 flex-col justify-between text-white relative overflow-hidden">
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" 
                 style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
            </div>

            {/* Floating Icons Animation */}
            <div className="absolute top-1/4 right-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg transform rotate-6 animate-bounce" style={{animationDuration: '3s'}}>
                <Package size={48} className="text-blue-200" />
            </div>
            <div className="absolute bottom-1/3 left-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg transform -rotate-6 animate-bounce" style={{animationDuration: '4s'}}>
                <Truck size={48} className="text-blue-200" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                        <Truck size={32} className="text-blue-700" />
                    </div>
                    <span className="text-xl font-bold tracking-wide opacity-90">LOGÍSTICA INTEGRADA</span>
                </div>
                <h1 className="text-5xl font-extrabold mb-6 leading-tight">
                    Controle total <br/>
                    da sua operação.
                </h1>
                <p className="text-blue-100 text-lg font-light leading-relaxed max-w-sm opacity-80">
                    Gerencie pendências, acompanhe entregas e otimize resultados com a São Luiz Express.
                </p>
            </div>

            <div className="relative z-10 flex gap-4 mt-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm text-sm font-medium">
                    <ShieldCheck size={16} className="text-green-400" /> Seguro
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm text-sm font-medium">
                    <BarChart3 size={16} className="text-amber-400" /> Performance
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm text-sm font-medium">
                    <CheckCircle2 size={16} className="text-blue-400" /> Eficiência
                </div>
            </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center relative">
            
            {/* Mobile Header (Only visible on small screens) */}
            <div className="md:hidden mb-8 flex items-center gap-2 text-blue-700">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Truck size={24} />
                </div>
                <span className="font-bold text-xl">São Luiz Express</span>
            </div>

            <div className="max-w-md mx-auto w-full">
                <div className="mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Bem-vindo</h2>
                    <p className="text-slate-500">Insira suas credenciais para acessar o painel.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1 block">Usuário</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                            </div>
                            {/* EXPLICIT WHITE BACKGROUND AND DARK TEXT */}
                            <input 
                                type="text" 
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all duration-300 shadow-sm hover:border-slate-300"
                                placeholder="Digite seu usuário"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-sm font-semibold text-slate-700">Senha</label>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                            </div>
                            {/* EXPLICIT WHITE BACKGROUND AND DARK TEXT */}
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all duration-300 shadow-sm hover:border-slate-300"
                                placeholder="Digite sua senha"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 animate-pulse">
                            <div className="text-red-500">
                                <ShieldCheck size={20} />
                            </div>
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/30 transform transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-6 w-6" />
                        ) : (
                            <>
                                <span>Acessar Sistema</span>
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 text-center pt-6 border-t border-slate-50">
                    <p className="text-xs text-slate-400 font-medium">
                        © 2025 São Luiz Express.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;