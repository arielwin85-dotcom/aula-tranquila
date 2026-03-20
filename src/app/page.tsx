"use client";

import { 
  BookOpen, 
  Clock, 
  Zap, 
  Sparkles, 
  Users, 
  Library, 
  ClipboardCheck, 
  Settings, 
  Headset,
  FileText,
  GraduationCap,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Classroom, User } from '@/types'
import { currentUser } from '@/mocks/data'

export default function Dashboard() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Cargar Usuario
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(err => console.error("Error fetching user:", err));

    // 2. Cargar Clases
    fetch('/api/classrooms')
      .then(res => res.json())
      .then(data => {
        setClassrooms(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching classrooms:", err);
        setIsLoading(false);
      });
  }, []);

  const ACTIONS = [
    { name: 'Mis Clases', icon: Users, color: 'emerald-500', link: '/clases', desc: 'Gestión de alumnos y aulas.' },
    { name: 'Asistente Pedagógico', icon: Zap, color: 'brand-orange', link: '/chat', desc: 'Sugerencia de clases y secuencias.' },
    { name: 'Planificación Normativa', icon: FileText, color: 'brand-blue', link: '/normativa', desc: 'Basado en diseños curriculares.' },
    { name: 'Evaluaciones', icon: BookOpen, color: 'purple-500', link: '/generador', desc: 'Exámenes y rúbricas con IA.' },
    { name: 'Notas y Evidencias', icon: ClipboardCheck, color: 'pink-500', link: '/evidencias', desc: 'Seguimiento pedagógico.' },
    { name: 'Biblioteca', icon: Library, color: 'brand-peach', link: '/biblioteca', desc: 'Tus archivos de Google Drive.' },
    { name: 'Soporte', icon: Headset, color: 'slate-400', link: '/soporte', desc: 'Ayuda y feedback directo.' },
    { name: 'Configuración', icon: Settings, color: 'brand-navy', link: '/configuracion', desc: 'Ajustes de tu cuenta.' },
  ];

  const userName = user?.name?.split(' ')[0] || 'Docente';

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 font-montserrat tracking-tight">¡Hola, {userName}! 👋</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Es un buen día para recuperar tus tardes. ¿Qué planificamos hoy?</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-black text-white uppercase tracking-widest">Sistema Activo</span>
        </div>
      </div>
      
      {/* Sistema en Crecimiento - Banner Destacado */}
      <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="bg-brand-navy border-l-4 border-brand-orange p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={100} className="text-brand-orange rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shadow-inner">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white font-montserrat tracking-tight leading-none">Aula Pro está Creciendo</h2>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Evolución</span>
                </div>
              </div>
            </div>
            <p className="text-xs md:text-sm text-slate-400 font-bold leading-relaxed max-w-2xl">
              Nuestro sistema se está ajustando cada vez más a tus necesidades para brindarte una solución placentera en el tiempo. 
              Gracias a ustedes, seguimos evolucionando: lo que hoy no está, se irá incorporando a través de tu necesidad y el feedback directo de la gente.
            </p>
            <div className="mt-6">
               <Link 
                 href="/soporte" 
                 className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-brand-orange uppercase tracking-widest hover:bg-brand-orange hover:text-white transition-all shadow-xl"
               >
                 Dejar mi Sugerencia / Feedback <ArrowRight size={14} />
               </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Solapas / Accesos Directos */}
      <h2 className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-6 px-2">Nuestras Solapas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {ACTIONS.map((action) => (
          <Link 
            key={action.name} 
            href={action.link} 
            className="group relative bg-brand-navy p-6 rounded-[2rem] border border-white/5 shadow-2xl hover:border-white/20 transition-all overflow-hidden"
          >
            <div className={`absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`}>
               <action.icon size={80} />
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-${action.icon === Zap ? 'brand-orange' : action.icon === FileText ? 'brand-blue' : action.icon === Users ? 'emerald-500' : 'slate-400'}/10 flex items-center justify-center text-${action.icon === Zap ? 'brand-orange' : action.icon === FileText ? 'brand-blue' : action.icon === Users ? 'emerald-500' : 'slate-400'} mb-4 shadow-inner group-hover:scale-110 transition-transform`}>
              <action.icon size={22} />
            </div>
            <h3 className="font-black text-white text-sm mb-1 group-hover:text-brand-orange transition-colors uppercase tracking-tight">{action.name}</h3>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Tus Clases Activas */}
        <div className="lg:col-span-8 flex flex-col gap-6">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <GraduationCap size={14} className="text-brand-orange" />
                 Tus Clases Activas ({classrooms.length})
              </h2>
              <Link href="/clases" className="text-[10px] font-black text-brand-orange uppercase tracking-widest hover:underline flex items-center gap-1">
                 Administrar clases <Sparkles size={12} />
              </Link>
           </div>
           
           <div className="bg-brand-navy rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
              {isLoading ? (
                 <div className="p-20 flex flex-col items-center justify-center text-slate-600 gap-4">
                    <div className="w-10 h-10 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black text-brand-orange uppercase tracking-[.2em]">Asistente Procesando...</span>
                 </div>
              ) : classrooms.length === 0 ? (
                 <div className="p-20 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                       <Users size={32} className="text-slate-700" />
                    </div>
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Aún no tenés clases cargadas</p>
                    <Link href="/clases" className="inline-flex items-center px-8 py-4 bg-brand-orange text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-orange/20 hover:scale-105 transition-all">
                       Crear mi primera clase
                    </Link>
                 </div>
              ) : (
                 <div className="divide-y divide-white/5">
                    {classrooms.map((c) => (
                       <Link 
                         key={c.id} 
                         href={`/clases?id=${c.id}`}
                         className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-white/5 transition-colors group cursor-pointer gap-6"
                       >
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-brand-orange transition-colors shadow-inner border border-white/5">
                                <Users size={24} />
                             </div>
                             <div>
                                <h4 className="font-black text-white text-xl group-hover:text-brand-orange transition-colors">{c.grade} - {c.name}</h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{c.students?.length || 0} alumnos</span>
                                   <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{c.subjects?.length || 0} materias</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="px-5 py-2.5 bg-brand-orange/10 text-brand-orange rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-orange/10 group-hover:bg-brand-orange group-hover:text-white transition-all">
                                Gestionar
                             </div>
                          </div>
                       </Link>
                    ))}
                 </div>
              )}
           </div>
        </div>

        {/* Sidebar Status */}
        <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Créditos / Plan */}
            <div className="bg-gradient-to-br from-brand-orange to-red-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-2">Suscripción {currentUser.plan}</h3>
                <div className="text-5xl font-black mb-8 font-montserrat tracking-tight tracking-tighter">
                   {currentUser.credits} <span className="text-xs font-black opacity-60 uppercase tracking-widest block mt-1">Créditos IA Disponibles</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-3.5 mb-4 shadow-inner p-1 border border-white/10">
                   <div className="bg-white h-full rounded-full shadow-lg" style={{ width: '75%' }}></div>
                </div>
                <p className="text-[10px] text-white/80 font-black uppercase tracking-widest mb-8">Nivel de uso: Optimizado</p>
                <button className="w-full py-5 bg-white text-brand-orange hover:bg-brand-navy hover:text-white rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all shadow-2xl shadow-black/20 hover:translate-y-[-2px] active:translate-y-0">
                   Aumentar potencia
                </button>
            </div>

        </div>
      </div>
    </div>
  )
}
