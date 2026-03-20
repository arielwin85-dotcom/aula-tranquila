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
  GraduationCap,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type TabType = 'perfil' | 'seguridad' | 'notificaciones' | 'facturacion';

export default function ConfiguracionPage() {
  const supabase = createClient();

  // ── Estados ────────────────────────────────────────────────────────────
  const [tabActiva, setTabActiva] = useState<TabType>('perfil');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [nivelEducativo, setNivelEducativo] = useState('');
  const [zonaHoraria, setZonaHoraria] = useState('America/Argentina/Buenos_Aires');
  const [creditos, setCreditos] = useState(0);
  const [plan, setPlan] = useState('gratuito');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  // ── Inicialización ─────────────────────────────────────────────────────
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        // 1. Obtener la sesión actual desde nuestra API de auth
        const res = await fetch('/api/auth/me');
        const { user } = await res.json();

        if (!user) {
          setIsLoading(false);
          // Redirigir si no hay sesión (opcional, pero recomendado)
          return;
        }

        // 2. Establecer datos iniciales desde la API
        setEmail(user.email || '');
        setNombre(user.full_name || user.name || '');
        setNivelEducativo(user.nivel_educativo || user.level || '');
        setZonaHoraria(user.zona_horaria || 'America/Argentina/Buenos_Aires');
        setCreditos(user.credits || 0);
        setPlan(user.plan || 'gratuito');

        // 3. Intentar cargar datos frescos directamente desde Supabase si es posible
        // (Esto satisface el requerimiento de "lógica directa de Supabase")
        try {
          const { data: perfil, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!profileError && perfil) {
            setNombre(perfil.full_name || perfil.name || user.full_name || user.name || '');
            setNivelEducativo(perfil.nivel_educativo || perfil.level || '');
            setZonaHoraria(perfil.zona_horaria || 'America/Argentina/Buenos_Aires');
            setCreditos(perfil.credits || 0);
            setPlan(perfil.plan || 'gratuito');
          }
        } catch (sErr) {
          console.warn('Fallo el fetch directo de Supabase, usando datos de la API:', sErr);
        }

      } catch (err) {
        console.error('Error cargando perfil:', err);
        setError('Error al cargar datos del servidor.');
      } finally {
        setIsLoading(false);
      }
    };

    cargarPerfil();
  }, []);

  // ── Manejadores ────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No hay sesión activa');
        return;
      }

      setIsSaving(true);
      setError('');
      setExito('');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: nombre.trim(),
          nivel_educativo: nivelEducativo,
          zona_horaria: zonaHoraria,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setExito('Cambios guardados correctamente ✓');
      setTimeout(() => setExito(''), 3000);
    } catch (err: any) {
      console.error('Error guardando:', err);
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCambiarPassword = async () => {
    if (!nuevaPassword) {
      setError('Ingresá una nueva contraseña');
      return;
    }
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setExito('');

      const { error: authError } = await supabase.auth.updateUser({
        password: nuevaPassword
      });

      if (authError) throw authError;

      setExito('Contraseña actualizada correctamente ✓');
      setNuevaPassword('');
      setConfirmarPassword('');
      setTimeout(() => setExito(''), 3000);
    } catch (err: any) {
      console.error('Error actualizando contraseña:', err);
      setError('Error al actualizar contraseña. Intentá de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const obtenerIniciales = (n: string) => {
    if (!n) return '?';
    return n
      .split(' ')
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-brand-orange">
        <Loader2 className="animate-spin" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Cargando Configuración...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="mb-10 pt-10 md:pt-0">
        <h1 className="text-4xl font-black text-white mb-2 font-montserrat tracking-tight">Configuración</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Gestioná tu perfil, preferencias y suscripción en Aula Pro.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-3 flex flex-col gap-2">
          {[
            { id: 'perfil', label: 'Mi Perfil', icon: User },
            { id: 'seguridad', label: 'Seguridad', icon: Lock },
            { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
            { id: 'facturacion', label: 'Facturación', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setTabActiva(tab.id as TabType);
                setError('');
                setExito('');
              }}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                tabActiva === tab.id 
                  ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20' 
                  : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-9">
          <div className="bg-[var(--color-background-secondary)] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden min-h-[500px]">
            {tabActiva === 'perfil' ? (
              <div className="p-8 md:p-12 animate-in slide-in-from-right-4 duration-500">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                  <div 
                    className="flex-shrink-0 flex items-center justify-center text-white shadow-2xl ring-4 ring-white/5 transition-transform hover:scale-105"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: '#e85d2f',
                      fontSize: '32px',
                      fontWeight: 900,
                    }}
                  >
                    {obtenerIniciales(nombre)}
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-white font-montserrat tracking-tight mb-2">{nombre || 'Docente'}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <span className="px-5 py-1.5 bg-brand-orange text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                        {plan.toUpperCase()}
                      </span>
                      <span className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <MapPin size={14} className="text-brand-orange" /> Argentina
                      </span>
                    </div>
                  </div>
                </div>

                {error && tabActiva === 'perfil' && (
                  <div className="mb-8 p-4 bg-[var(--color-background-danger)] border border-[var(--color-border-danger)] text-[var(--color-text-danger)] rounded-xl text-xs font-bold flex items-center gap-3">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
                {exito && tabActiva === 'perfil' && (
                  <div className="mb-8 p-4 bg-[var(--color-background-success)] border border-[var(--color-border-success)] text-[var(--color-text-success)] rounded-xl text-xs font-bold flex items-center gap-3">
                    <CheckCircle2 size={16} /> {exito}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] text-white text-sm font-bold p-4 rounded-xl focus:ring-4 ring-brand-orange/10 focus:border-brand-orange outline-none transition-all"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      disabled
                      className="bg-[var(--color-background-tertiary)] border border-[var(--color-border-tertiary)] text-slate-500 text-sm font-bold p-4 rounded-xl cursor-not-allowed opacity-60 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Nivel Educativo</label>
                    <div className="relative">
                      <select 
                        value={nivelEducativo}
                        onChange={(e) => setNivelEducativo(e.target.value)}
                        className="w-full bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] text-white text-sm font-bold p-4 rounded-xl focus:ring-4 ring-brand-orange/10 focus:border-brand-orange outline-none transition-all appearance-none"
                      >
                        <option value="" className="bg-brand-navy">Seleccionar nivel</option>
                        <option value="Nivel Inicial" className="bg-brand-navy">Nivel Inicial</option>
                        <option value="Nivel Primario" className="bg-brand-navy">Nivel Primario</option>
                        <option value="Nivel Secundario" className="bg-brand-navy">Nivel Secundario</option>
                        <option value="Nivel Superior / Universitario" className="bg-brand-navy">Nivel Superior / Universitario</option>
                      </select>
                      <GraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Zona Horaria</label>
                    <div className="relative">
                      <select 
                        value={zonaHoraria}
                        onChange={(e) => setZonaHoraria(e.target.value)}
                        className="w-full bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] text-white text-sm font-bold p-4 rounded-xl focus:ring-4 ring-brand-orange/10 focus:border-brand-orange outline-none transition-all appearance-none"
                      >
                        <option value="America/Argentina/Buenos_Aires" className="bg-brand-navy">(GMT-03:00) Buenos Aires</option>
                        <option value="America/Argentina/Cordoba" className="bg-brand-navy">(GMT-03:00) Córdoba</option>
                        <option value="America/Argentina/Mendoza" className="bg-brand-navy">(GMT-03:00) Mendoza</option>
                        <option value="America/Argentina/Salta" className="bg-brand-navy">(GMT-03:00) Salta</option>
                      </select>
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-6 bg-white/5 p-4 rounded-[2rem] border border-white/5">
                    <div className="w-14 h-14 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center shadow-inner">
                      <Rocket size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Créditos de IA</p>
                      <p className="text-xl font-black text-white font-montserrat tracking-tight">{creditos} disponibles</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleGuardar}
                    disabled={isSaving}
                    className="w-full md:w-auto px-10 py-5 bg-brand-orange text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-orange/20 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            ) : tabActiva === 'seguridad' ? (
              <div className="p-8 md:p-12 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                  <div className="w-12 h-12 bg-brand-orange/10 text-brand-orange rounded-xl flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white font-montserrat tracking-tight uppercase">Seguridad de la Cuenta</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Protegé tu acceso y gestioná tu contraseña.</p>
                  </div>
                </div>

                {error && tabActiva === 'seguridad' && (
                  <div className="mb-8 p-4 bg-[var(--color-background-danger)] border border-[var(--color-border-danger)] text-[var(--color-text-danger)] rounded-xl text-xs font-bold flex items-center gap-3">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
                {exito && tabActiva === 'seguridad' && (
                  <div className="mb-8 p-4 bg-[var(--color-background-success)] border border-[var(--color-border-success)] text-[var(--color-text-success)] rounded-xl text-xs font-bold flex items-center gap-3">
                    <CheckCircle2 size={16} /> {exito}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-8 max-w-md">
                  <div className="flex flex-col gap-2 opacity-80">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Tu Email de Acceso</label>
                    <div className="flex items-center gap-3 p-4 bg-[var(--color-background-tertiary)] border border-[var(--color-border-tertiary)] text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed">
                      <Mail size={16} className="text-slate-600" />
                      {email}
                    </div>
                    <p className="text-[9px] text-slate-600 font-bold mt-1 px-2 italic">El email es el identificador único de tu cuenta y no puede ser modificado por seguridad.</p>
                  </div>

                  <div className="border-t border-white/5 pt-8 mt-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Lock size={14} className="text-brand-orange" /> Cambiar Contraseña
                    </h4>
                    
                    <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Nueva Contraseña</label>
                        <input 
                          type="password" 
                          value={nuevaPassword}
                          onChange={(e) => setNuevaPassword(e.target.value)}
                          className="bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] text-white text-sm font-bold p-4 rounded-xl focus:ring-4 ring-brand-orange/10 focus:border-brand-orange outline-none transition-all placeholder:text-slate-700"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Confirmar Nueva Contraseña</label>
                        <input 
                          type="password" 
                          value={confirmarPassword}
                          onChange={(e) => setConfirmarPassword(e.target.value)}
                          className="bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] text-white text-sm font-bold p-4 rounded-xl focus:ring-4 ring-brand-orange/10 focus:border-brand-orange outline-none transition-all placeholder:text-slate-700"
                          placeholder="Repetí la contraseña"
                        />
                      </div>

                      <button 
                        onClick={handleCambiarPassword}
                        disabled={isSaving}
                        className="w-full px-8 py-5 bg-brand-orange text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-orange/20 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                        {isSaving ? 'Actualizando...' : 'Actualizar Seguridad'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 text-slate-700">
                  <Clock size={40} />
                </div>
                <h3 className="text-xl font-black text-white mb-2 font-montserrat tracking-tight uppercase tracking-wider">Próximamente</h3>
                <p className="text-xs font-bold text-slate-500 max-w-xs leading-relaxed uppercase tracking-widest">
                  Esta sección estará disponible en las próximas actualizaciones de Aula Pro.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
