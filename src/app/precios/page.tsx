"use client";

import { Check, Star, Zap, Building2 } from 'lucide-react';

export default function PreciosPage() {
  return (
    <div className="max-w-5xl mx-auto pb-12 pt-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Recuperá tus tardes libres</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">Elegí el plan que mejor se adapte a tus horas cátedra. Sin tarjetas para probar, cancelá cuando quieras.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto px-4">
         
         {/* Plan Básico */}
         <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:border-purple-200 transition-colors">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
               <Check size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Gratuito</h3>
            <p className="text-slate-500 text-sm mb-6 h-10">Para descubrir el poder del copiloto paso a paso.</p>
            <div className="mb-6">
               <span className="text-4xl font-extrabold text-slate-800">$0</span>
               <span className="text-slate-500"> / mes</span>
            </div>
            
            <button className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold mb-8 transition-colors">
               Tu plan actual
            </button>

            <ul className="space-y-4">
               {[
                  '20 créditos IA por mes', 
                  'Validador de coherencia base',
                  'Hasta 2 Aulas activas',
                  'Exportación simple a PDF',
                  'Soporte comunitario'
               ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                     <Check size={18} className="text-purple-500 mt-0.5" />
                     {feat}
                  </li>
               ))}
            </ul>
         </div>

         {/* Plan Docente Pro */}
         <div className="bg-gradient-to-b from-purple-600 to-purple-800 rounded-3xl p-8 border-2 border-purple-400 shadow-xl relative scale-100 md:scale-105 transform z-10 transition-transform hover:scale-110 duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider shadow-sm flex items-center gap-1">
               <Star size={12} className="fill-white" /> MÁS ELEGIDO
            </div>

            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-sm">
               <Zap size={24} className="fill-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Docente Pro</h3>
            <p className="text-purple-200 text-sm mb-6 h-10">Todo lo que necesitás para tener tus planificaciones al día.</p>
            <div className="mb-6">
               <span className="text-4xl font-extrabold text-white">$5.799</span>
               <span className="text-purple-200"> / mes</span>
            </div>
            
            <button className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-purple-700 rounded-xl font-bold mb-8 transition-colors shadow-sm">
               Mejorar a Pro
            </button>

            <ul className="space-y-4">
               {[
                  '150 créditos IA por mes', 
                  'Adaptación DUA automática',
                  'Lectura de fotos y manuscritos',
                  'Aulas y Alumnos ilimitados',
                  'Buscador avanzado de situaciones de enseñanza',
                  'Soporte prioritario'
               ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-purple-50 font-medium">
                     <Check size={18} className="text-purple-300 mt-0.5 flex-shrink-0" />
                     {feat}
                  </li>
               ))}
            </ul>
         </div>

         {/* Plan Institución */}
         <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:border-purple-200 transition-colors">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
               <Building2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Institución</h3>
            <p className="text-slate-500 text-sm mb-6 h-10">Múltiples docentes unificando criterios de evaluación.</p>
            <div className="mb-6">
               <span className="text-4xl font-extrabold text-slate-800">A Medida</span>
               <span className="text-slate-500"></span>
            </div>
            
            <button className="w-full py-3 px-4 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-bold mb-8 transition-colors">
               Contactarnos
            </button>

            <ul className="space-y-4">
               {[
                  'Créditos IA ilimitados', 
                  'Panel de administración escolar',
                  'Plantillas unificadas por colegio',
                  'Capacitación y Onboarding',
                  'Factura A/B y reportes de uso'
               ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                     <Check size={18} className="text-purple-500 mt-0.5" />
                     {feat}
                  </li>
               ))}
            </ul>
         </div>

      </div>
    </div>
  )
}
