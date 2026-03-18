"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Sparkles, FileText, CheckCircle2, ChevronDown, Download, Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { Classroom, Subject, Student } from '@/types';

const RESOURCE_TYPES = [
  "Evaluación Multiple Choice",
  "Evaluación a Desarrollar",
  "Rúbrica de Corrección",
  "Trabajo Práctico",
  "Actividad de Clase",
  "Secuencia Didáctica"
];

export default function GeneradorPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [resourceType, setResourceType] = useState<string>(RESOURCE_TYPES[0]);
  const [topic, setTopic] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await fetch('/api/classrooms');
        if (res.ok) {
          const data = await res.json();
          setClassrooms(data);
          if (data.length > 0) {
            setSelectedClassId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch classrooms", err);
      }
    };
    fetchClassrooms();
  }, []);

  const selectedClass = classrooms.find(c => c.id === selectedClassId);
  const subjects = selectedClass?.subjects || [];
  
  useEffect(() => {
    if (subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    } else {
      setSelectedSubjectId("");
    }
  }, [selectedClassId, subjects]);

  const duaTags = selectedClass?.students?.flatMap(s => s.duaContextTags || []) || [];
  const uniqueDuaTags = Array.from(new Set(duaTags));

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSubjectId || !topic) return;

    setIsGenerating(true);
    setResultReady(false);
    
    try {
      const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
      const res = await fetch('/api/generador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroom: selectedClass,
          subjectName: selectedSubject?.name,
          resourceType,
          topic,
          instructions,
          duaTags: uniqueDuaTags
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedContent(data.reply);
        setResultReady(true);
      }
    } catch (err) {
      console.error("Generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Recurso Pedagógico - ${topic}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #000; line-height: 1.5; }
            .exam-header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; }
            .exam-header p { margin: 5px 0; font-size: 14px; font-weight: bold; }
            .line { border-bottom: 1px solid #000; display: inline-block; width: 300px; margin-left: 10px; }
            .content { font-size: 14px; }
            h2 { font-size: 18px; margin-top: 20px; text-transform: uppercase; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="exam-header">
            <div style="display: flex; justify-content: space-between;">
              <p>MATERIA: ${subjects.find(s => s.id === selectedSubjectId)?.name || ''}</p>
              <p>CURSO: ${selectedClass?.name || ''}</p>
            </div>
            <p>NOMBRE Y APELLIDO: <span class="line"></span></p>
            <p style="text-align: right; margin-top: 10px;">FECHA: ____/____/2026</p>
          </div>
          <div class="content">
            ${generatedContent.replace(/\n/g, '<br/>')}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-white mb-3 font-montserrat tracking-tight">Valuaciones y Contenidos</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] max-w-xl mx-auto">Dejá que el Super Agente IA redacte el material perfecto.</p>
      </div>

      {!resultReady ? (
         <div className="bg-brand-navy rounded-[3rem] border border-white/5 shadow-2xl p-10 md:p-14 group">
            <form onSubmit={handleGenerate} className="flex flex-col gap-8">
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* STEP 1: CLASS */}
                  <div className="flex flex-col gap-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">1. Elegí la Clase</label>
                     <div className="relative">
                        <select 
                          value={selectedClassId}
                          onChange={(e) => setSelectedClassId(e.target.value)}
                          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all appearance-none"
                        >
                           {classrooms.map(c => (
                              <option key={c.id} value={c.id} className="bg-brand-navy">{c.name} - {c.grade}</option>
                           ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                     </div>
                  </div>

                  {/* STEP 2: SUBJECT */}
                  <div className="flex flex-col gap-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">2. Elegí la Materia</label>
                     <div className="relative">
                        <select 
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all appearance-none disabled:opacity-30"
                          disabled={!selectedClassId}
                        >
                           {subjects.map(s => (
                              <option key={s.id} value={s.id} className="bg-brand-navy">{s.name}</option>
                           ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                     </div>
                  </div>
               </div>

               {/* STEP 3: RESOURCE TYPE */}
               <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">3. Tipo de Recurso</label>
                  <div className="flex flex-wrap gap-3 p-1.5 bg-white/5 rounded-[2.5rem] border border-white/5">
                    {RESOURCE_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setResourceType(type)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          resourceType === type 
                            ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20 scale-105' 
                            : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Tema Principal</label>
                  <input 
                     type="text" 
                     value={topic}
                     onChange={(e) => setTopic(e.target.value)}
                     placeholder="Ej: Sumas llevando o la Revolución de Mayo"
                     className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-slate-700 focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all"
                  />
               </div>

               <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Instrucciones Adicionales (Opcional)</label>
                  <textarea 
                     rows={3}
                     value={instructions}
                     onChange={(e) => setInstructions(e.target.value)}
                     placeholder="Ej: Incluir un mínimo de 10 ejercicios, usar lenguaje sencillo."
                     className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-slate-700 focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all resize-none"
                  ></textarea>
               </div>

               {uniqueDuaTags.length > 0 && (
                 <div className="bg-brand-orange/5 border border-brand-orange/20 p-6 rounded-3xl flex items-start gap-4 mt-2 animate-in zoom-in-95 group-hover:scale-[1.02] transition-all">
                    <Sparkles className="text-brand-orange mt-1 flex-shrink-0 animate-pulse" size={24} />
                    <div>
                        <h4 className="font-black text-white text-xs uppercase tracking-widest mb-1 italic">Adaptación DUA Detectada</h4>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                           Alumnos con <span className="text-brand-orange">{uniqueDuaTags.join(', ')}</span> identificados. El material se adaptará automáticamente.
                        </p>
                    </div>
                 </div>
               )}

               <button 
                  type="submit" 
                  disabled={isGenerating || !topic}
                  className="mt-6 w-full py-6 bg-brand-orange text-white rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-2xl shadow-brand-orange/20 hover:scale-[1.03] active:scale-95 disabled:opacity-50"
               >
                  {isGenerating ? (
                     <>
                        <Loader2 size={24} className="animate-spin" />
                        IA GENERANDO MATERIAL...
                     </>
                  ) : (
                     <>
                        <Sparkles size={24} />
                        REDACTAR MATERIAL
                     </>
                  )}
               </button>
            </form>
         </div>
      ) : (
         <div className="bg-brand-navy rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-gradient-to-r from-brand-orange to-brand-peach p-8 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                     <CheckCircle2 size={32} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-white font-montserrat tracking-tight">¡Material Listo!</h2>
                     <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">El Super Agente IA ha finalizado tu recurso.</p>
                  </div>
               </div>
               <div className="flex gap-3">
                 <button 
                   onClick={handlePrint}
                   className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-2xl transition-all shadow-inner"
                   title="Imprimir"
                 >
                   <Printer size={24} />
                 </button>
               </div>
            </div>
            
            <div className="p-10 max-h-[600px] overflow-y-auto custom-scrollbar">
               <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap font-bold text-slate-300 leading-relaxed text-sm">
                    {generatedContent}
                  </div>
               </div>
            </div>
            
            <div className="p-8 bg-black/40 border-t border-white/5 flex gap-5">
               <button 
                 onClick={() => setResultReady(false)} 
                 className="flex items-center gap-3 px-8 py-5 bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all transition-all"
               >
                  <ArrowLeft size={18} />
                  Generar otro
               </button>
               <button 
                 onClick={handlePrint}
                 className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-white text-brand-navy rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-brand-peach hover:shadow-2xl transition-all hover:scale-[1.02]"
               >
                  <Download size={20} />
                  Descargar e Imprimir
               </button>
            </div>
         </div>
      )}

    </div>
  )
}
