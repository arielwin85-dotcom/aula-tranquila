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
import { descontarTokens } from '@/lib/tokens';
import { SinTokens } from '@/components/SinTokens';
import { TokenBadge } from '@/components/TokenBadge';
import { useTokens } from '@/lib/TokenContext';
import { createClient } from '@/lib/supabase/client';

type PlanType = 'Anual' | 'Mensual';

// Constantes globales
const MESES = [
  { nombre: 'Marzo', valor: '03' },
  { nombre: 'Abril', valor: '04' },
  { nombre: 'Mayo', valor: '05' },
  { nombre: 'Junio', valor: '06' },
  { nombre: 'Julio', valor: '07' },
  { nombre: 'Agosto', valor: '08' },
  { nombre: 'Septiembre', valor: '09' },
  { nombre: 'Octubre', valor: '10' },
  { nombre: 'Noviembre', valor: '11' },
  { nombre: 'Diciembre', valor: '12' },
];

const FERIADOS_2026 = [
  '2026-03-24', '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-05-25', '2026-06-15',
  '2026-06-20', '2026-07-09', '2026-08-17',
  '2026-10-12', '2026-11-20', '2026-11-23',
  '2026-12-08', '2026-12-25'
];
// Receso invernal: 13 al 24 de julio 2026

export default function NormativaPage() {
  const supabase = createClient();
  const { tokens, refrescarTokens } = useTokens();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [activePlanType, setActivePlanType] = useState<PlanType>('Anual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [regulationText, setRegulationText] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Nuevos estados para Planificación Mensual
  const [mesSeleccionado, setMesSeleccionado] = useState('03');
  const [generandoMes, setGenerandoMes] = useState<string | null>(null);
  const [resultadoAnualGenerado, setResultadoAnualGenerado] = useState(false);
  const [memoriaMensual, setMemoriaMensual] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('memoria_normativa_mensual');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Persistir en localStorage
  useEffect(() => {
    localStorage.setItem('memoria_normativa_mensual', JSON.stringify(memoriaMensual));
  }, [memoriaMensual]);

  // Limpiar memoria si cambian los parámetros base
  useEffect(() => {
    setMemoriaMensual({});
    localStorage.removeItem('memoria_normativa_mensual');
    setGeneratedPlan(null);
    setResultadoAnualGenerado(false);
  }, [selectedClassId, selectedSubjectId, regulationText]);

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
      setRegulationText(`Contenido extraído del documento "${file.name}". Se utilizará como base para alinear los contenidos de la planificación.`);
    }
  };

  const generarDiasHabiles = (anio: number, mes: number) => {
    const dias = [];
    const DIAS_NOMBRES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const fecha = new Date(anio, mes - 1, 1, 12);
    const fin = new Date(anio, mes, 0, 12);

    while (fecha <= fin) {
      const d = fecha.getDay();
      const str = fecha.toISOString().split('T')[0];
      
      // Filtro Fines de semana, Feriados y Receso Invernal (13-24 Julio)
      const esFinde = d === 0 || d === 6;
      const esFeriado = FERIADOS_2026.includes(str);
      const esRecesoInvernal = mes === 7 && fecha.getDate() >= 13 && fecha.getDate() <= 24;

      if (!esFinde && !esFeriado && !esRecesoInvernal) {
        dias.push({ fecha: str, dia: DIAS_NOMBRES[d] });
      }
      fecha.setDate(fecha.getDate() + 1);
    }
    return dias;
  };

  const handleGeneratePlan = async () => {
    if (!selectedClassId || !selectedSubjectId || !regulationText) return;
    if (tokens < 1) return;

    if (activePlanType === 'Mensual') {
      await handleGenerarMensual();
      return;
    }
    
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
        
        // Descontar tokens solo si la IA generó bien
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const result = await descontarTokens(user.id, 1, 'creacion_planificacion', 'Planificación Anual Normativa');
          if (result.ok) {
             setGeneratedPlan(data.plan);
             setResultadoAnualGenerado(true);
             await refrescarTokens();
          }
        }
      }
    } catch (err) {
      console.error("Failed to generate plan", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerarMes = async (mes: any) => {
    const subjName = subjects.find(s => s.id === selectedSubjectId)?.name || 'Materia';
    
    // Verificar memoria temporal
    if (memoriaMensual[mes.valor]) {
       generarPDF(memoriaMensual[mes.valor], `Planificacion_${selectedClass?.grade}_${subjName}_${mes.nombre}`);
       return;
    }

    setGenerandoMes(mes.nombre);
    const dias = generarDiasHabiles(2026, parseInt(mes.valor));

    try {
      const res = await fetch('/api/normativa/mensual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado: selectedClass?.grade,
          materia: subjName,
          normativa: regulationText,
          mes: mes.valor,
          nombreMes: mes.nombre,
          dias
        })
      });
      const data = await res.json();
      
      // Guardar en memoria
      setMemoriaMensual(prev => ({ ...prev, [mes.valor]: data.contenido }));
      
      generarPDF(data.contenido, `Planificacion_${selectedClass?.grade}_${subjName}_${mes.nombre}`);
    } catch(error) {
      console.error('Error generando mes:', error);
      alert('Error al generar la planificación mensual');
    } finally {
      setGenerandoMes(null);
    }
  };

  const handleGenerarMensual = async () => {
    const nombreMes = MESES.find(m => m.valor === mesSeleccionado)?.nombre;
    const subjName = subjects.find(s => s.id === selectedSubjectId)?.name || 'Materia';

    // Verificar memoria temporal (ahorra tokens)
    if (memoriaMensual[mesSeleccionado]) {
       setGeneratedPlan(memoriaMensual[mesSeleccionado]);
       generarPDF(memoriaMensual[mesSeleccionado], `Planificacion_${selectedClass?.grade}_${subjName}_${nombreMes}`);
       return;
    }
    
    if (tokens < 1) return;

    const dias = generarDiasHabiles(2026, parseInt(mesSeleccionado));
    setIsGenerating(true);
    try {
      const res = await fetch('/api/normativa/mensual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado: selectedClass?.grade,
          materia: subjName,
          normativa: regulationText,
          mes: mesSeleccionado,
          nombreMes,
          dias
        })
      });
      const data = await res.json();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const result = await descontarTokens(user.id, 1, 'creacion_plan_mensual', `Planificación Mensual - ${nombreMes}`);
        if (result.ok) {
           // Guardar en memoria
           setMemoriaMensual(prev => ({ ...prev, [mesSeleccionado]: data.contenido }));
           
           setGeneratedPlan(data.contenido);
           setResultadoAnualGenerado(false); 
           await refrescarTokens();
           generarPDF(data.contenido, `Planificacion_${selectedClass?.grade}_${subjName}_${nombreMes}`);
        }
      }
    } catch(error) {
      console.error('Error:', error);
      alert('Error al generar la planificación mensual');
    } finally {
      setIsGenerating(false);
    }
  };

  const generarPDF = (contenido: string, tituloDoc: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Split por el separador de clases
    const clases = contenido.split(/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━/).filter(c => c.trim().length > 10);
    const titulosClases = clases.map(c => {
       const match = c.match(/CLASE \d+ — .+/);
       return match ? match[0] : 'Detalle de Clase';
    });
    
    const materiaName = subjects.find(s => s.id === selectedSubjectId)?.name;

    const html = `
      <html>
        <head>
          <title>${tituloDoc.replace(/_/g, ' ')}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 0; color: #1e293b; line-height: 1.6; font-size: 11pt; }
            .page { page-break-after: always; min-height: 250mm; }
            .no-break { page-break-after: avoid; }
            
            h1 { font-size: 24pt; color: #1e293b; margin-top: 50px; text-align: center; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
            h2 { font-size: 18pt; color: #475569; border-bottom: 1px solid #e2e8f0; margin-top: 40px; }
            
            .header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 30px; font-size: 9pt; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
            
            .indice { margin: 60px 0; }
            .indice-item { display: flex; justify-content: space-between; margin: 12px 0; border-bottom: 1px dotted #cbd5e1; padding-bottom: 4px; }
            
            .clase-box { margin-top: 20px; }
            .clase-badge { background: #7c3aed; color: white; display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 10pt; margin-bottom: 15px; }
            
            .section-header { font-size: 10pt; font-weight: 900; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.1em; border-left: 4px solid #7c3aed; padding-left: 10px; margin: 25px 0 10px 0; background: #f8fafc; padding-top: 5px; padding-bottom: 5px; }
            
            pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 10.5pt; color: #334155; margin-left: 5px; }
            
            .footer { position: fixed; bottom: 10mm; width: 100%; text-align: center; font-size: 9pt; color: #94a3b8; border-top: 1px solid #eee; pt: 5px; }
          </style>
        </head>
        <body>
          <div class="page">
             <div class="header">
                <span>${selectedClass?.grade} | ${materiaName} | ${tituloDoc.split('_').pop()}</span>
                <span>AULA PRO - COPILOTO IA</span>
             </div>
             <h1>${tituloDoc.replace(/Planificacion_|_/g, ' ')}</h1>
             <div style="text-align: center; color: #64748b; font-weight: bold; margin-top: -10px;">Materia: ${materiaName}</div>
             
             <div class="indice">
                <h2 style="border: none;">Índice Cronológico</h2>
                ${titulosClases.map((t, idx) => `
                   <div class="indice-item">
                      <span>${t}</span>
                      <span>Pág. ${idx + 2}</span>
                   </div>
                `).join('')}
             </div>
          </div>
          
          ${clases.map((c, i) => `
            <div class="page">
               <div class="header">
                  <span>${selectedClass?.grade} | ${materiaName}</span>
                  <span>Clase ${i+1} de ${clases.length}</span>
               </div>
               
               <div class="clase-box">
                  <div class="clase-badge">${titulosClases[i]}</div>
                  <pre>${c.replace(titulosClases[i], '').trim()}</pre>
               </div>
               
               <div class="footer">Página ${i + 2}</div>
            </div>
          `).join('')}
          
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrint = () => {
    if (activePlanType === 'Anual') {
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
                 <p style="margin:0; font-weight:bold; color:#7c3aed;">Aula Pro - Copiloto IA</p>
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
    } else {
       // Si es mensual se usa la lógica avanzada de generarPDF
       const subjName = subjects.find(s => s.id === selectedSubjectId)?.name || 'Materia';
       const nombreMes = MESES.find(m => m.valor === mesSeleccionado)?.nombre;
       generarPDF(generatedPlan, `Planificacion_${selectedClass?.grade}_${subjName}_${nombreMes}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-4xl font-black text-white mb-2 font-montserrat tracking-tight pt-14 md:pt-0">Planificación Normativa</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Generá planificaciones alineadas 100% con las resoluciones provinciales.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
          <TokenBadge />
          {generatedPlan && (
             <button 
               onClick={handlePrint}
               className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-brand-navy rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-brand-peach transition-all shadow-2xl"
             >
               <Printer size={18} />
               Imprimir
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Panel de Configuración */}
        <div className="lg:col-span-4 flex flex-col gap-8 w-full">
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
                {selectedClass?.description && (
                  <p className="text-lg text-brand-orange font-black ml-1 mt-4 italic drop-shadow-md leading-tight">
                    {selectedClass.description}
                  </p>
                )}
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
                  {(['Anual', 'Mensual'] as PlanType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setActivePlanType(type)}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activePlanType === type ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {activePlanType === 'Mensual' && (
                  <div className="mt-4 animate-in slide-in-from-top-1 duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mes a Planificar</label>
                    <div className="relative">
                      <select 
                        value={mesSeleccionado}
                        onChange={(e) => setMesSeleccionado(e.target.value)}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all appearance-none"
                      >
                        {MESES.map(m => <option key={m.valor} value={m.valor} className="bg-brand-navy">{m.nombre}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                    </div>
                  </div>
                )}
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

            {tokens === 0 ? (
               <SinTokens accion={`generar planificación ${activePlanType.toLowerCase()}`} />
            ) : (
              <button 
                disabled={!regulationText || isGenerating || tokens === 0}
                onClick={handleGeneratePlan}
                className="w-full mt-8 py-5 bg-brand-orange text-white rounded-[1.8rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-orange/20 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:hover:bg-brand-orange disabled:hover:scale-100"
              >
                {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                {
                  activePlanType === 'Mensual' 
                    ? `GENERAR ${MESES.find(m => m.valor === mesSeleccionado)?.nombre.toUpperCase()}`
                    : `Generar ${activePlanType}`
                }
              </button>
            )}
          </div>
        </div>

        {/* Panel de Resultados */}
        <div className="lg:col-span-8 w-full mt-8 lg:mt-0">
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
                    <div className="p-10 flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar bg-black/10">
                       <div className="whitespace-pre-wrap font-bold text-slate-300 leading-relaxed text-sm">
                          {generatedPlan}
                       </div>
                    </div>

                    {resultadoAnualGenerado && activePlanType === 'Anual' && (
                       <div className="p-10 border-t border-white/5 bg-white/5 animate-in slide-in-from-bottom-4 duration-700">
                          <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mb-6">
                             DESCARGAR PLANIFICACIÓN DETALLADA POR MES
                          </p>
                          <div className="flex flex-wrap gap-3">
                             {MESES.map(mes => (
                                <button
                                   key={mes.valor}
                                   onClick={() => handleGenerarMes(mes)}
                                   disabled={generandoMes === mes.nombre}
                                   className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                      generandoMes === mes.nombre
                                        ? 'bg-white/5 border-white/10 text-slate-400 cursor-wait'
                                        : memoriaMensual[mes.valor]
                                           ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                                           : 'bg-brand-navy border-white/5 text-white hover:bg-brand-orange hover:border-brand-orange shadow-lg'
                                   }`}
                                >
                                   {generandoMes === mes.nombre ? (
                                      <div className="flex items-center gap-2">
                                         <Loader2 size={12} className="animate-spin" />
                                         <span>Generando...</span>
                                      </div>
                                   ) : memoriaMensual[mes.valor] ? (
                                      <div className="flex items-center gap-2">
                                         <CheckCircle2 size={12} />
                                         <span>{mes.nombre} (Listo)</span>
                                      </div>
                                   ) : mes.nombre}
                                </button>
                             ))}
                          </div>
                       </div>
                    )}

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
