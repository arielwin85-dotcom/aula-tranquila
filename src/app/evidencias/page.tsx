"use client";

export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Check, FileCheck, Loader2, AlertCircle, Printer, X, User, Trash2 } from 'lucide-react';
import { Classroom, Evidencia } from '@/types';
import { descontarTokens } from '@/lib/tokens';
import { SinTokens } from '@/components/SinTokens';
import { TokenBadge } from '@/components/TokenBadge';
import { useTokens } from '@/lib/TokenContext';
import { createClient } from '@/lib/supabase/client';

export default function EvidenciasPage() {
  const supabase = createClient();
  const { tokens, refrescarTokens } = useTokens();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<Evidencia[]>([]);
  const [savedEvidencias, setSavedEvidencias] = useState<Evidencia[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeTab, setActiveTab] = useState<'nuevo' | 'historial'>('nuevo');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchClassrooms = async () => {
    const res = await fetch('/api/classrooms');
    if (res.ok) setClassrooms(await res.json());
  };

  const fetchSavedEvidencias = async () => {
    const res = await fetch('/api/evidencias');
    if (res.ok) setSavedEvidencias(await res.json());
  };

  useState(() => {
    fetchClassrooms();
    fetchSavedEvidencias();
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (tokens < 1) return;

    setIsAnalyzing(true);
    setResults([]);
    
    const fileList = Array.from(files);
    const base64Images = await Promise.all(fileList.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }));

    try {
      const res = await fetch('/api/evidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images })
      });

      if (res.ok) {
        const data = await res.json();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           const result = await descontarTokens(user.id, 1, 'uso_evidencias', `Corrección de Evidencias (x${fileList.length})`);
           if (result.ok) {
             setResults(data.results);
             setSelectedResultIndex(0);
             setActiveTab('nuevo');
             await refrescarTokens();
           }
        }
      }
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (evidencia: Evidencia) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/evidencias/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evidencia)
      });

      if (res.ok) {
        await fetchSavedEvidencias();
        alert('Evidencia guardada en el registro correctamente.');
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
    try {
      const res = await fetch(`/api/evidencias/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchSavedEvidencias();
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handlePrint = (evidencia?: Evidencia) => {
    const toPrint = evidencia ? [evidencia] : results;
    if (toPrint.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = toPrint.map(res => `
      <div style="page-break-after: always; padding: 40px; border: 1px solid #eee; margin-bottom: 20px; border-radius: 20px; font-family: sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #7c3aed; padding-bottom: 20px;">
          <div>
            <h1 style="margin: 0; color: #1e293b;">Informe de Evaluación IA</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-weight: bold;">Alumno: ${res.studentName || 'SIN IDENTIFICAR'}</p>
          </div>
          <div style="background: #7c3aed; color: white; padding: 15px 25px; border-radius: 15px; text-align: center;">
            <div style="font-size: 10px; text-transform: uppercase;">Nota Sugerida</div>
            <div style="font-size: 24px; font-weight: bold;">${res.score}/10</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: #f0fdf4; border: 1px solid #dcfce7; padding: 20px; border-radius: 15px;">
            <h2 style="font-size: 14px; margin-top: 0; color: #166534;">Fortalezas</h2>
            <ul style="font-size: 13px; color: #15803d; padding-left: 20px;">
              ${res.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 15px;">
            <h2 style="font-size: 14px; margin-top: 0; color: #92400e;">Oportunidades</h2>
            <ul style="font-size: 13px; color: #b45309; padding-left: 20px;">
              ${res.weaknesses.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 14px; color: #1e293b;">Análisis de Ejercicios</h2>
          <p style="font-size: 13px; color: #475569; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">${res.exercisesAnalyzed}</p>
        </div>

        <div>
          <h2 style="font-size: 14px; color: #1e293b;">Devolución Sugerida</h2>
          <p style="font-size: 14px; color: #7c3aed; font-style: italic; border-left: 4px solid #7c3aed; padding-left: 15px;">"${res.feedback}"</p>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Evaluación - Aula Pro</title>
          <style>body { font-family: sans-serif; }</style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const currentResult = (activeTab === 'nuevo' ? results : savedEvidencias)[selectedResultIndex];

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 px-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-2 font-montserrat tracking-tight pt-14 md:pt-0">Evidencias IA</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Corrección inteligente de pruebas y seguimiento pedagógico.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <TokenBadge />
          {results.length > 0 && activeTab === 'nuevo' && (
            <button 
              onClick={() => handlePrint()}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-brand-navy rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-brand-peach transition-all shadow-2xl"
            >
              <Printer size={18} />
              Imprimir Lote ({results.length})
            </button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 px-4 mb-8">
        <button 
          onClick={() => { setActiveTab('nuevo'); setSelectedResultIndex(0); }}
          className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'nuevo' ? 'bg-brand-orange text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
        >
          Nuevo Análisis
        </button>
        <button 
          onClick={() => { setActiveTab('historial'); setSelectedResultIndex(0); }}
          className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === 'historial' ? 'bg-brand-orange text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
        >
          Historial Guardado ({savedEvidencias.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Lado Izquierdo: Selección/Carga */}
         <div className="lg:col-span-5 flex flex-col gap-6 px-4 sm:px-0">
            {activeTab === 'nuevo' ? (
              <>
                <h2 className="text-[10px] font-black text-brand-orange uppercase tracking-widest ml-4">1. Cargar Documentación</h2>
                {tokens === 0 ? (
                   <SinTokens accion="analizar evidencias con IA" />
                ) : (
                  <div 
                    onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[3rem] p-12 flex flex-col items-center justify-center text-center transition-all min-h-[350px] relative overflow-hidden group ${isAnalyzing ? 'border-brand-orange/30 bg-brand-orange/5 cursor-wait' : 'border-white/10 bg-brand-navy hover:bg-white/5 hover:border-brand-orange/50 cursor-pointer shadow-2xl'}`}
                  >
                     <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />
                     {!isAnalyzing ? (
                        <>
                           <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] shadow-inner flex items-center justify-center text-slate-600 mb-6 group-hover:text-brand-orange group-hover:scale-110 transition-all">
                              <UploadCloud size={48} />
                           </div>
                           <p className="font-black text-white mb-2 text-xl tracking-tight">Escanear Evidencias</p>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-[220px] leading-loose">Seleccioná las fotos de las pruebas manuscritas</p>
                        </>
                     ) : (
                        <div className="flex flex-col items-center gap-8 py-10">
                           <div className="relative">
                             <Loader2 size={80} className="text-brand-orange animate-spin" />
                             <Sparkles size={32} className="text-brand-peach absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                           </div>
                           <div className="text-center">
                             <p className="font-black text-white text-2xl tracking-tighter mb-2">IA ANALIZANDO...</p>
                             <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">Extrayendo texto y métricas pedagógicas</p>
                           </div>
                        </div>
                     )}
                  </div>
                )}
                
                {results.length > 0 && (
                  <div className="mt-4 space-y-3 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                    {results.map((res, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedResultIndex(idx)}
                        className={`w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all ${selectedResultIndex === idx ? 'border-brand-orange bg-brand-orange/10 shadow-xl scale-[1.02]' : 'border-white/5 bg-brand-navy hover:border-white/10'}`}
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${res.identified ? 'bg-brand-blue/20 text-brand-blue' : 'bg-red-500/20 text-red-500'}`}>
                            <User size={18} />
                          </div>
                          <div>
                            <p className="font-black text-white text-xs">{res.studentName || 'Sin Identificar'}</p>
                            <p className="text-[8px] text-slate-500 uppercase font-black">Documento {idx + 1}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-brand-orange text-sm">{res.score}/10</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-[10px] font-black text-brand-orange uppercase tracking-widest ml-4">Historial de Registros</h2>
                {savedEvidencias.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 text-center">
                    <AlertCircle className="mx-auto text-slate-600 mb-4" size={40} />
                    <p className="text-slate-400 font-bold text-sm">No hay registros guardados aún.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                    {savedEvidencias.map((res, idx) => (
                      <div key={res.id} className="relative group">
                        <button 
                          onClick={() => setSelectedResultIndex(idx)}
                          className={`w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all ${selectedResultIndex === idx ? 'border-brand-orange bg-brand-orange/10 shadow-xl scale-[1.02]' : 'border-white/5 bg-brand-navy hover:border-white/10'}`}
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                              <FileCheck size={18} />
                            </div>
                            <div>
                              <p className="font-black text-white text-xs">{res.studentName}</p>
                              <p className="text-[8px] text-slate-500 font-black uppercase">
                                {res.createdAt ? new Date(res.createdAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <p className="font-black text-brand-orange text-sm">{res.score}/10</p>
                          </div>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(res.id!); }}
                          className="absolute -right-2 -top-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20 hover:scale-110"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
         </div>

         {/* Resultados de la IA */}
         <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
            <h2 className="text-[10px] font-black text-brand-orange uppercase tracking-widest ml-4">2. Diagnóstico del Agente IA</h2>
            <div className={`bg-brand-navy rounded-[3.5rem] border shadow-2xl p-10 flex-1 transition-all min-h-[700px] flex flex-col relative overflow-hidden ${currentResult ? 'border-white/10 ring-8 ring-brand-orange/5' : 'border-white/5 bg-black/20'}`}>
               
               {currentResult ? (
                  <div className="animate-in fade-in slide-in-from-right-12 duration-1000 flex flex-col h-full relative z-10">
                     <div className="flex flex-col md:flex-row items-center justify-between mb-10 pb-10 border-b border-white/5 gap-8 font-montserrat">
                        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                           <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0 ${currentResult.identified ? 'bg-brand-orange text-white' : 'bg-red-500 text-white'}`}>
                              <User size={40} />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Análisis de Alumno</p>
                              <h3 className="font-black text-white text-2xl md:text-3xl tracking-tight uppercase">
                                {currentResult.studentName || 'IDENTIFICACIÓN PENDIENTE'}
                              </h3>
                           </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 text-white p-8 rounded-[2.5rem] text-center shadow-inner min-w-[160px] relative overflow-hidden group">
                           <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange opacity-50 group-hover:opacity-100 transition-all" />
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nota Sugerida</p>
                           <p className="font-black text-5xl tracking-tighter text-brand-orange">{currentResult.score}<span className="text-xl text-slate-600 opacity-60 ml-0.5">/10</span></p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className="bg-emerald-500/5 rounded-[2.5rem] p-8 border border-emerald-500/10 relative group transition-all hover:bg-emerald-500/10">
                           <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-all">
                             <Check size={24} strokeWidth={3} />
                           </div>
                           <h4 className="font-black text-emerald-400 text-xs mb-4 uppercase tracking-[0.2em]">Fortalezas Detectadas</h4>
                           <ul className="text-sm font-bold text-slate-300 space-y-4">
                              {currentResult.strengths.map((s, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                                  <span className="leading-relaxed">{s}</span>
                                </li>
                              ))}
                           </ul>
                        </div>
                        <div className="bg-amber-500/5 rounded-[2.5rem] p-8 border border-amber-500/10 relative group transition-all hover:bg-amber-500/10">
                           <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-all">
                             <AlertCircle size={24} strokeWidth={3} />
                           </div>
                           <h4 className="font-black text-amber-400 text-xs mb-4 uppercase tracking-[0.2em]">Áreas de Mejora</h4>
                           <ul className="text-sm font-bold text-slate-300 space-y-4">
                              {currentResult.weaknesses.map((w, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                                  <span className="leading-relaxed">{w}</span>
                                </li>
                              ))}
                           </ul>
                        </div>
                     </div>

                     <div className="mb-10 p-8 bg-black/40 rounded-[2.5rem] border border-white/5">
                        <h4 className="font-black text-slate-500 text-[10px] mb-4 uppercase tracking-[0.3em] flex items-center gap-2">
                           <FileCheck size={14} className="text-brand-orange" />
                           Análisis Técnico:
                        </h4>
                        <div className="font-bold text-slate-400 text-xs leading-relaxed italic">
                           {currentResult.exercisesAnalyzed}
                        </div>
                     </div>

                     <div className="mb-12 flex-1">
                        <h4 className="font-black text-slate-500 text-[10px] mb-4 uppercase tracking-[0.3em] flex items-center gap-2">
                           <Sparkles size={14} className="text-brand-orange" />
                           Devolución IA:
                        </h4>
                        <div className="p-8 bg-brand-orange/5 border-2 border-dashed border-brand-orange/20 rounded-[2.5rem] text-white text-xl font-serif italic relative shadow-inner px-12 text-center leading-relaxed">
                           <Sparkles size={32} className="absolute -right-4 -top-4 text-brand-orange animate-pulse" />
                           &ldquo;{currentResult.feedback}&rdquo;
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row gap-5 mt-auto">
                        <button 
                          onClick={() => handlePrint(currentResult)}
                          className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-4 transition-all hover:bg-white/10"
                        >
                          <Printer size={18} />
                          Imprimir Informe
                        </button>
                        
                        {activeTab === 'nuevo' && (
                          <button 
                            onClick={() => handleSave(currentResult)}
                            disabled={isSaving}
                            className="flex-1 py-5 bg-white text-brand-navy rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-4 transition-all shadow-2xl hover:bg-brand-peach hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                          >
                            <FileCheck size={20} />
                            {isSaving ? 'GUARDANDO...' : 'CONFIRMAR Y GUARDAR EN REGISTRO'}
                          </button>
                        )}
                     </div>
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-20 relative">
                     <div className="w-32 h-32 bg-white/5 rounded-[3rem] flex items-center justify-center text-slate-700 mb-10 shadow-inner group transition-all">
                       <ImageIcon size={64} className="opacity-20 group-hover:opacity-40" />
                     </div>
                     <h3 className="text-3xl font-black text-white mb-4 font-montserrat tracking-tight">Bandeja Vacía</h3>
                     <p className="text-[11px] font-black text-slate-500 max-w-[300px] leading-loose uppercase tracking-widest">
                       {activeTab === 'nuevo' ? 'Subí las fotos de las pruebas para que la IA inicie el procesamiento automático.' : 'Seleccioná un registro del historial para ver el diagnóstico.'}
                     </p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  )
}
