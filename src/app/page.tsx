"use client";

import { BookOpen, Clock, Zap, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { currentUser } from '@/mocks/data'

export default function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-2 font-montserrat tracking-tight">¡Hola, {currentUser.name.split(' ')[0]}! 👋</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Es un buen día para recuperar tus tardes. ¿Qué planificamos hoy?</p>
      </div>

      {/* Growing System Announcement */}
      <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="bg-brand-navy border-l-4 border-brand-orange p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={120} className="text-brand-orange rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <Sparkles size={22} />
              </div>
              <h2 className="text-xl font-black text-white font-montserrat tracking-tight">Aula Tranquila está Creciendo</h2>
            </div>
            <p className="text-sm text-slate-400 font-bold leading-relaxed max-w-2xl">
              Nuestro sistema se está ajustando cada vez más a tus necesidades para brindarte una solución placentera en el tiempo. 
              Recordá que estamos en constante crecimiento: si algo no funciona como debería o si sentís que falta alguna función vital, 
              por favor dejanos tu reporte en la solapa de <Link href="/soporte" className="text-brand-orange hover:underline">Soporte</Link>. 
              ¡Tu feedback construye el futuro del aula!
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions (Prompts Rapidos) */}
      <h2 className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-4 px-2">Acciones Rápidas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Link href="/chat" className="bg-brand-navy p-6 rounded-[2rem] border border-white/5 shadow-2xl hover:border-brand-orange/50 transition-all flex flex-col gap-4 group cursor-pointer hover:translate-y-[-4px]">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all shadow-inner">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="font-black text-white text-lg">Planificar Clase</h3>
            <p className="text-sm text-slate-400 font-medium mt-1">Generá la secuencia didáctica en segundos.</p>
          </div>
        </Link>
        <Link href="/generador" className="bg-brand-navy p-6 rounded-[2rem] border border-white/5 shadow-2xl hover:border-brand-blue transition-all flex flex-col gap-4 group cursor-pointer hover:translate-y-[-4px]">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all shadow-inner">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="font-black text-white text-lg">Crear Evaluación</h3>
            <p className="text-sm text-slate-400 font-medium mt-1">Multiple choice o desarrollo al instante.</p>
          </div>
        </Link>
        <Link href="/clases" className="bg-brand-navy p-6 rounded-[2rem] border border-white/5 shadow-2xl hover:border-emerald-500/50 transition-all flex flex-col gap-4 group cursor-pointer hover:translate-y-[-4px]">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-black text-white text-lg">Revisión de Notas</h3>
            <p className="text-sm text-slate-400 font-medium mt-1">Analizar fortalezas y debilidades con IA.</p>
          </div>
        </Link>
      </div>

      {/* Stats / Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6 px-2">
               <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tus Clases Activas</h2>
               <Link href="/clases" className="text-[10px] font-black text-brand-orange uppercase tracking-widest hover:underline">Ver todas</Link>
            </div>
            <div className="bg-brand-navy rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-white/5 transition-colors group cursor-pointer gap-4">
                  <div>
                    <h4 className="font-black text-white text-lg group-hover:text-brand-orange transition-colors">Matemática - 1er Año</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">4 alumnos registrados</p>
                  </div>
                  <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-inner">Al día</span>
               </div>
               <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-white/5 transition-colors group cursor-pointer gap-4">
                  <div>
                    <h4 className="font-black text-white text-lg group-hover:text-brand-orange transition-colors">Física - 3er Año</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">2 alumnos registrados</p>
                  </div>
                  <span className="px-4 py-1.5 bg-brand-orange/10 text-brand-orange rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-orange/20 shadow-inner">Requiere notas</span>
               </div>
            </div>
        </div>

        <div>
            <div className="bg-gradient-to-br from-brand-orange to-red-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Plan {currentUser.plan}</h3>
                <div className="text-4xl font-black mb-6 font-montserrat">{currentUser.credits} <span className="text-sm font-black opacity-60 uppercase">créditos</span></div>
                <div className="w-full bg-black/20 rounded-full h-3 mb-3 shadow-inner p-0.5">
                   <div className="bg-white h-full rounded-full shadow-lg" style={{ width: '75%' }}></div>
                </div>
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mb-6">15 clases restantes</p>
                <button className="w-full py-4 bg-white text-brand-orange hover:bg-brand-peach hover:text-brand-navy rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-black/20">
                   Aumentar plan
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}
