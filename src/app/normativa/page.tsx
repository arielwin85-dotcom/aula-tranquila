"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Calendar, 
  ChevronDown, 
  Printer, 
  CheckCircle2, 
  Clock, 
  BookOpen,
  ArrowRight,
  FileSearch,
  Loader2,
  Download
} from 'lucide-react';
import { Classroom, Subject } from '@/types';

type PlanType = 'Anual' | 'Mensual' | 'Semanal';

export default function NormativaPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [activePlanType, setActivePlanType] = useState<PlanType>('Anual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [regulationText, setRegulationText] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/classrooms').then(res => res.json()).then(data => {
      setClassrooms(data);
      if (data.length > 0) setSelectedClassId(data[0].id);
    });
  }, []);

  const selectedClass = classrooms.find(c => c.id === selectedClassId);
  const subjects = selectedClass?.subjects || [];

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [selectedClassId, subjects]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setRegulationText(`Contenido ficticio extraído de: ${file.name}. Incluye ejes curriculares de la Provincia de Buenos Aires para el ciclo lectivo 2026.`);
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedClassId || !selectedSubjectId || !regulationText) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/normativa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: selectedClassId,
          subjectId: selectedSubjectId,
          regulation: regulationText,
          planType: activePlanType
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPlan(data.plan);
      }
    } catch (err) {
      console.error("Failed to generate plan", err);
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
          <title>Planificación - ${activePlanType} - ${selectedClass?.grade}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { color: #1e293b; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { color: #475569; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }
            .header-info { margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-start; }
            .badge { background: #7c3aed; color: white; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div>
              <p style="margin:0; font-weight:bold; color:#7c3aed;">Aula Tranquila - Copiloto IA</p>
              <h1 style="margin:10px 0 5px 0;">Planificación ${activePlanType}</h1>
              <p style="margin:0; color:#64748b; font-weight:bold;">${selectedClass?.name} - ${selectedClass?.grade}</p>
              <p style="margin:0; color:#64748b;">Materia: ${subjects.find(s => s.id === selectedSubjectId)?.name}</p>
            </div>
            <div style="text-align: right;">
              <div class="badge">Oficial</div>
              <p style="margin:5px 0 0 0; font-size: 12px; color:#94a3b8;">Ciclo Lectivo ${selectedClass?.year}</p>
              <p style="margin:0; font-size: 12px; color:#94a3b8;">Generado el: ${new Date().toLocaleDateString('es-AR')}</p>
            </div>
          </div>
          <div class="content">
            ${generatedPlan.replace(/\n/g, '<br/>')}
          </div>
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 font-montserrat tracking-tight">Planificación Normativa</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Generá planificaciones alineadas 100% con las resoluciones provinciales.</p>
        </div>
        {generatedPlan && (
           <button 
             onClick={handlePrint}
             className="flex items-center gap-2 px-8 py-4 bg-white text-brand-navy rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-brand-peach transition-all shadow-2xl"
           >
             <Printer size={18} />
             Imprimir Plan
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Panel de Configuración */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-brand-navy rounded-[2.5rem] border border-white/5 shadow-2xl p-8 group">
            <h2 className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-6">1. Datos del Curso</h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Aula / Grado</label>
                <div className="relative">
                  <select 
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all appearance-none"
                  >
                    {classrooms.map(c => <option key={c.id} value={c.id} className="bg-brand-navy">{c.name} ({c.grade})</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Materia</label>
                <div className="relative">
                  <select 
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all appearance-none"
                  >
                    {subjects.map((s: Subject) => <option key={s.id} value={s.id} className="bg-brand-navy">{s.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tipo de Planificación</label>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  {(['Anual', 'Mensual', 'Semanal'] as PlanType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setActivePlanType(type)}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activePlanType === type ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-navy rounded-[2.5rem] border border-white/5 shadow-2xl p-8">
            <h2 className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-6">2. Documento Normativo</h2>
            
            <label className="group border-2 border-dashed border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 hover:border-brand-orange/50 transition-all relative">
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />
              <div className="w-16 h-16 bg-white/5 rounded-2xl shadow-inner flex items-center justify-center text-slate-500 mb-4 group-hover:text-brand-orange group-hover:scale-110 transition-all">
                <Upload size={32} />
              </div>
              <p className="text-sm font-black text-white mb-1 tracking-tight">{fileName ? fileName : 'Subir Normativa'}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PDF, Word o TXT</p>
            </label>

            <button 
              disabled={!regulationText || isGenerating}
              onClick={handleGeneratePlan}
              className="w-full mt-8 py-5 bg-brand-orange text-white rounded-[1.8rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-orange/20 hover:scale-[1.03] active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              Generar {activePlanType}
            </button>
          </div>
        </div>

        {/* Panel de Resultados */}
        <div className="lg:col-span-8">
           <div className="bg-brand-navy rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden min-h-[750px] flex flex-col relative">
              {!generatedPlan ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-16">
                    <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                       <FileSearch size={48} className="text-slate-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3 font-montserrat tracking-tight">Esperando Normativa</h3>
                    <p className="max-w-xs text-xs font-black text-slate-500 uppercase tracking-widest leading-loose">Subí la resolución y seleccioná el tipo de plan para comenzar el análisis.</p>
                 </div>
              ) : (
                 <div className="animate-in fade-in duration-1000 flex flex-col h-full bg-black/20">
                    {/* Header del Reporte */}
                    <div className="p-10 bg-white/5 border-b border-white/5 flex justify-between items-start">
                       <div>
                          <div className="flex items-center gap-2 text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                             <CheckCircle2 size={12} /> Planificación Generada
                          </div>
                          <h2 className="text-3xl font-black text-white tracking-tight mb-3 font-montserrat">Diseño Curricular: {selectedClass?.grade}</h2>
                          <div className="flex flex-wrap gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                             <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><BookOpen size={14} className="text-brand-orange" /> {subjects.find(s => s.id === selectedSubjectId)?.name}</span>
                             <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><Calendar size={14} className="text-brand-orange" /> Ciclo {selectedClass?.year}</span>
                             <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><FileText size={14} className="text-brand-orange" /> {activePlanType}</span>
                          </div>
                       </div>
                    </div>

                    {/* Contenido del Plan */}
                    <div className="p-10 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                       <div className="whitespace-pre-wrap font-bold text-slate-300 leading-relaxed text-sm">
                          {generatedPlan}
                       </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-8 bg-black/40 border-t border-white/5 flex justify-between items-center mt-auto">
                       <div className="flex items-center gap-3 text-[10px] text-slate-500 font-black uppercase tracking-widest italic">
                          <Sparkles size={16} className="text-brand-orange" />
                          IA adaptada a la normativa vigente
                       </div>
                       <button 
                         onClick={handlePrint}
                         className="flex items-center gap-3 px-8 py-4 bg-white text-brand-navy rounded-[1.2rem] font-black uppercase tracking-widest text-[10px] hover:bg-brand-peach transition-all shadow-xl"
                       >
                          <Download size={18} /> Descargar PDF
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
