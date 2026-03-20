"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Establecer la sesión de Supabase en el cliente browser.
        // Esto permite que el Realtime funcione con la sesión JWT nativa.
        if (data.session?.access_token) {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-orange/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-blue/20 rounded-full blur-[180px]" />
      </div>

      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-1000">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-brand-orange text-white shadow-2xl shadow-brand-orange/30 mb-8 group transition-all hover:scale-110">
            <span className="text-5xl font-black font-montserrat tracking-tighter">A</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight font-montserrat">Aula Pro</h1>
          <p className="text-slate-500 font-bold mt-4 uppercase tracking-widest text-[10px]">Tu Copiloto Pedagógico Inteligente</p>
        </div>

        {/* Login Card */}
        <div className="bg-brand-navy rounded-[3rem] border border-white/5 shadow-2xl p-10 md:p-14 relative overflow-hidden group">
          {/* Subtle Accent Line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-orange shadow-lg shadow-brand-orange/40" />
          
          <h2 className="text-3xl font-black text-white mb-10 flex items-center gap-4 font-montserrat">
            Ingreso
            <Sparkles size={28} className="text-brand-orange animate-pulse" />
          </h2>

          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Email Personal</label>
              <div className="relative group/input">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-brand-orange transition-colors">
                  <Mail size={22} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="profe@ejemplo.com"
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-sm font-bold text-white placeholder:text-slate-700 focus:bg-white/10 focus:border-brand-orange/50 focus:ring-8 focus:ring-brand-orange/5 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-3 block">Contraseña</label>
              <div className="relative group/input">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-brand-orange transition-colors">
                  <Lock size={22} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-sm font-bold text-white placeholder:text-slate-700 focus:bg-white/10 focus:border-brand-orange/50 focus:ring-8 focus:ring-brand-orange/5 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-4 p-6 bg-red-500/10 text-red-400 border border-red-500/20 rounded-[1.8rem] text-xs font-black uppercase tracking-tight animate-shake">
                <AlertCircle size={22} />
                {error}
              </div>
            )}

            <button
              disabled={isLoading}
              className="w-full py-6 bg-white text-brand-navy rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl transition-all hover:scale-[1.03] hover:bg-brand-peach active:scale-[0.97] disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'ACCEDER'}
            </button>
          </form>

          <div className="mt-14 pt-10 border-t border-white/5 flex flex-col items-center text-center gap-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed max-w-sm">
              AULA PRO 2026 ® - Todos los derechos reservados. <br/>
              Este producto está protegido por leyes de propiedad intelectual. Prohibida su reproducción total o parcial. El uso de esta plataforma es estrictamente personal e intransferible.
            </div>
            <div className="flex gap-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <span className="hover:text-brand-orange cursor-pointer transition-colors">SOPORTE</span>
              <span className="hover:text-brand-orange cursor-pointer transition-colors">PRIVACIDAD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
