"use client";

import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  Shield, 
  Lock, 
  Bell, 
  CreditCard,
  CheckCircle2,
  Loader2,
  Save,
  Rocket,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { User as UserType } from '@/types';

export default function ConfiguracionPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      setUser(data.user);
      setIsLoading(false);
    });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          level: user.level
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Perfil actualizado con éxito' });
      } else {
        setMessage({ type: 'error', text: 'Error al actualizar perfil' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Ocurrió un error inesperado' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">Configuración</h1>
        <p className="text-slate-500 font-medium">Gestioná tu cuenta, perfil y preferencias del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Mini - Tab Navigation Layout Style */}
        <div className="md:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-purple-600 rounded-2xl font-bold shadow-sm border border-purple-100">
            <User size={18} />
            Perfil
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-2xl font-bold transition-all">
            <Lock size={18} />
            Seguridad
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-2xl font-bold transition-all">
            <Bell size={18} />
            Notificaciones
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-2xl font-bold transition-all">
             <CreditCard size={18} />
             Facturación
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden p-8 md:p-10">
             {/* Header Perfil */}
             <div className="flex items-center gap-6 mb-10">
                <div className="relative group">
                   <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden ring-1 ring-slate-100 transition-all group-hover:ring-purple-200">
                      <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=f3e8ff&color=7c3aed&size=128`} alt="Avatar" className="w-full h-full object-cover" />
                   </div>
                   <button className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-all">
                      <Edit3 size={14} />
                   </button>
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-800">{user?.name}</h2>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest">{user?.plan}</span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold ml-2">
                         <MapPin size={12} /> Argentina
                      </span>
                   </div>
                </div>
             </div>

             <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2 md:col-span-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nombre Completo</label>
                      <input 
                         type="text" 
                         value={user?.name}
                         onChange={(e) => setUser(u => u ? {...u, name: e.target.value} : null)}
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-500/5 outline-none transition-all"
                      />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Email Institucional</label>
                      <input 
                         type="email" 
                         value={user?.email}
                         onChange={(e) => setUser(u => u ? {...u, email: e.target.value} : null)}
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-500/5 outline-none transition-all"
                      />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nivel Educativo</label>
                      <select 
                         value={user?.level}
                         onChange={(e) => setUser(u => u ? {...u, level: e.target.value} : null)}
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:bg-white focus:border-purple-300 outline-none transition-all"
                      >
                         <option>Inicial</option>
                         <option>Primaria</option>
                         <option>Secundaria</option>
                         <option>Terciario</option>
                         <option>Universidad</option>
                      </select>
                   </div>
                   <div className="col-span-2 md:col-span-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Zona Horaria</label>
                      <div className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-500">
                         (GMT-03:00) Buenos Aires
                      </div>
                   </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                  </div>
                )}

                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                         <Rocket size={20} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase">Créditos de IA</p>
                         <p className="text-sm font-black text-slate-700">{user?.credits} disponibles</p>
                      </div>
                   </div>
                   <button 
                      type="submit"
                      disabled={isSaving}
                      className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all flex items-center gap-2 hover:scale-[1.02]"
                   >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Guardar Cambios
                   </button>
                </div>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
}

