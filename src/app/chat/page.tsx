"use client";

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User as UserIcon, Calendar, CheckCircle2, AlertCircle, RefreshCw, FileText, ChevronRight, Clock, Loader2, Trash2, X, ClipboardList, BookOpen } from 'lucide-react';
import { ChatMessage, WeeklyPlan, PlanDay, DayStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
  // Classroom and Subject Context
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<WeeklyPlan | null>(null);
  const [allPlans, setAllPlans] = useState<WeeklyPlan[]>([]);
  const [chatView, setChatView] = useState<'chat' | 'history'>('chat');
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const getContextKey = () => `${selectedClassId}-${selectedSubjectId}`;
  
  const currentClass = classrooms.find(c => c.id === selectedClassId);
  const subjects = currentClass?.subjects || [];
  const selectedSubject = subjects.find((s: any) => s.id === selectedSubjectId)?.name || 'Materia';

  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [numClasses, setNumClasses] = useState(5);
  const [recommendedDocs, setRecommendedDocs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null); // dayId

  const currentMessages = allMessages[getContextKey()] || [{
    id: 'welcome',
    userId: 'system',
    role: 'assistant',
    content: `¡Hola! Soy tu Mentor Pedagógico de Aula Tranquila. Estoy posicionado en **${currentClass?.name || ''} (${currentClass?.grade || ''})** para trabajar **${selectedSubject}**.\n\nComo experto, he analizado los Diseños Curriculares y los NAP. ¿Querés que diseñemos la planificación para las ${numClasses} clases solicitadas o preferís contarme algún tema específico que ya estés trabajando?`,
    timestamp: mounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  }];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timezone-robust date formatter
  const formatLocalDate = (dateStr: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-AR', options);
  };

  // Load classrooms and plans
  useEffect(() => {
    const initData = async () => {
      try {
        const [classRes, plansRes] = await Promise.all([
          fetch('/api/classrooms'),
          fetch('/api/weeklyPlans')
        ]);
        
        if (classRes.ok) {
          const classes = await classRes.json();
          setClassrooms(classes);
          if (classes.length > 0) setSelectedClassId(classes[0].id);
        }

        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        }

        if (plansRes.ok) {
          const plans = await plansRes.json();
          setAllPlans(plans);
        }
      } catch (e) {
        console.error('Error initializing data:', e);
      }
    };
    initData();
  }, []);

  // Update active plan when subject, classroom or date changes
  useEffect(() => {
    const matchedPlan = allPlans.find((p: WeeklyPlan) => 
      p.classroomId === selectedClassId && 
      p.subjectId === selectedSubjectId &&
      p.weekStartDate.split('T')[0] === startDate
    );
    
    if (matchedPlan && matchedPlan.id !== activePlan?.id) {
      setActivePlan(matchedPlan);
      if (matchedPlan.messages && matchedPlan.messages.length > 0) {
        const key = `${matchedPlan.classroomId}-${matchedPlan.subjectId}`;
        const currentMsgs = allMessages[key];
        if (!currentMsgs || currentMsgs.length <= 1 || JSON.stringify(currentMsgs) !== JSON.stringify(matchedPlan.messages)) {
          setAllMessages(prev => ({ ...prev, [key]: matchedPlan.messages || [] }));
        }
      }
    } else if (!matchedPlan && activePlan !== null) {
      setActivePlan(null);
    }
  }, [selectedSubjectId, selectedClassId, allPlans, startDate, activePlan?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, selectedClassId, selectedSubjectId]);

  const generarFechasHabilesDesde = (fechaInicio: string, cantClases: number) => {
    const fechas: string[] = [];
    let fecha = new Date(fechaInicio + 'T12:00:00');
    while (fechas.length < cantClases) {
      const dia = fecha.getDay();
      if (dia !== 0 && dia !== 6) {
        fechas.push(fecha.toISOString().split('T')[0]);
      }
      fecha.setDate(fecha.getDate() + 1);
    }
    return fechas;
  };

  const handleSend = async (overrideValue?: string) => {
    const messageToSend = overrideValue || inputValue;
    if (!messageToSend.trim()) return;

    const key = getContextKey();
    const newUserMsg: ChatMessage = {
      id: uuidv4(),
      userId: user?.id || 'docente',
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const actualMessages = [...(allMessages[key] || currentMessages), newUserMsg];
    setAllMessages(prev => ({
      ...prev,
      [key]: actualMessages
    }));
    
    setInputValue('');
    setIsGenerating(true);
    setRecommendedDocs([]);

    const selectedClass = classrooms.find(c => c.id === selectedClassId);
    const subjectName = selectedClass?.subjects?.find((s: any) => s.id === selectedSubjectId)?.name || 'Materia';

    try {
      // 1. Obtener contenidos previos para memoria
      let contenidosPrevios = 'Ninguno aún.';
      try {
        const resPrev = await fetch(`/api/weeklyPlans?aula_grado=${encodeURIComponent(selectedClass?.name || '')}&area_materia=${encodeURIComponent(subjectName)}`);
        if (resPrev.ok) {
           const plans = await resPrev.json();
           if (plans.length > 0) {
             const topics = plans.flatMap((p: any) => p.days.map((d: any) => `- ${d.topic} (${d.date.split('T')[0]})`));
             contenidosPrevios = topics.slice(-10).join('\n'); 
           }
        }
      } catch (e) { console.error("Error fetching prev contents", e); }

      // 2. Llamada a la IA
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: actualMessages,
          context: {
            aula_grado: selectedClass?.name,
            area_materia: subjectName,
            fecha_inicio: startDate,
            cant_clases: numClasses,
            contenidos_previos: contenidosPrevios
          }
        }),
      });

      if (!response.ok) throw new Error('Error al conectar con el Asistente');

      const data = await response.json();
      const rawText = data.reply;

      // 3. Procesar Respuesta (Lógica Silenciosa)
      const jsonMatch = rawText.match(/\{[\s\S]*"planificacion"[\s\S]*\}/);

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.planificacion && Array.isArray(parsed.planificacion)) {
            const planId = uuidv4();
            const fechasHabiles = generarFechasHabilesDesde(startDate, parsed.planificacion.length);

            const mappedDays: PlanDay[] = parsed.planificacion.map((d: any, idx: number) => ({
              id: uuidv4(),
              numero_clase: d.numero_clase || (idx + 1),
              date: fechasHabiles[idx] || startDate,
              dayOfWeek: d.dia_semana || new Date(fechasHabiles[idx] + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long' }),
              topic: d.titulo || "Clase",
              objetivo: d.objetivo || '',
              contenido: d.contenido || d.description || '',
              actividades: d.actividades || d.actividad || '',
              recursos: d.recursos || '',
              evaluacion: d.evaluacion || '',
              status: 'Pendiente',
              isHoliday: false,
              resources: []
            }));

            const botMsg: ChatMessage = {
              id: uuidv4(), role: 'assistant', userId: 'system',
              content: 'Planificación finalizada ✅',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            const planPayload: WeeklyPlan = {
              id: planId,
              userId: user?.id,
              classroomId: selectedClassId,
              subjectId: selectedSubjectId,
              aula_grado: selectedClass?.name || 'Aula',
              area_materia: subjectName,
              weekStartDate: startDate,
              numClasses: parsed.planificacion.length,
              days: mappedDays,
              messages: [...actualMessages, botMsg],
              createdAt: new Date().toISOString()
            };

            await fetch('/api/weeklyPlans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(planPayload)
            });

            setAllPlans(prev => [planPayload, ...prev]);
            setActivePlan(planPayload);
            setAllMessages(prev => ({ ...prev, [key]: planPayload.messages as ChatMessage[] }));
          } else {
            throw new Error("El formato de planificación no contiene la lista de clases esperada.");
          }
        } catch (parseError: any) {
          console.error("Error al procesar JSON de la IA:", parseError);
          throw new Error("La IA generó una respuesta pero hubo un error al procesar el plan pedagógico.");
        }
      } else {
        const botMsg: ChatMessage = {
          id: uuidv4(), role: 'assistant', userId: 'system',
          content: rawText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAllMessages(prev => ({ ...prev, [key]: [...actualMessages, botMsg] }));
      }
    } catch (err: any) {
      console.error(err);
      const errorBotMsg: ChatMessage = {
        id: uuidv4(), role: 'assistant', userId: 'system',
        content: `❌ ${err.message || 'Error en la comunicación con el Asistente.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setAllMessages(prev => ({ ...prev, [key]: [...actualMessages, errorBotMsg] }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta planificación?')) return;
    try {
      const res = await fetch(`/api/weeklyPlans/${planId}`, { method: 'DELETE' });
      if (res.ok) {
        setAllPlans(prev => prev.filter(p => p.id !== planId));
        if (activePlan?.id === planId) setActivePlan(null);
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleUpdateDay = async (dayId: string, updates: Partial<PlanDay>) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map(d => d.id === dayId ? { ...d, ...updates } : d);
    const updatedPlan = { ...activePlan, days: updatedDays };
    setActivePlan(updatedPlan);
    setAllPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    await fetch(`/api/weeklyPlans/${activePlan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: updatedDays })
    });
  };

  const handleDownloadPDF = async () => {
    if (!activePlan) return;
    
    // Problema 6: Asegurar que se lee desde la DB real
    try {
      const res = await fetch(`/api/weeklyPlans?classroomId=${activePlan.classroomId}`);
      const plans = await res.json();
      const planFromDb = plans.find((p: any) => p.id === activePlan.id);
      
      const planToPrint = planFromDb || activePlan;
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const html = `
        <html>
          <head>
            <title>Planificación - Aula Tranquila</title>
            <style>
               body { font-family: Arial, sans-serif; padding: 40px; color: #000; max-width: 850px; margin: 0 auto; }
               .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
               .title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; text-transform: uppercase; }
               .info-grid { display: grid; grid-cols: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 14px; font-weight: bold; }
               .clase { border: 1px solid #000; padding: 15px; margin-bottom: 20px; page-break-inside: avoid; border-radius: 8px; }
               .clase-header { font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 10px; padding-bottom: 5px; display: flex; justify-content: space-between; }
               .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #444; margin-top: 10px; display: block; }
               .content { font-size: 13px; line-height: 1.5; white-space: pre-wrap; margin-bottom: 5px; }
               @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
               <div class="title">Planificación Pedagógica</div>
               <div class="info-grid">
                  <div>MATERIA: ${planToPrint.area_materia}</div>
                  <div>CURSO: ${planToPrint.aula_grado}</div>
                  <div>DOCENTE: ${user?.name || '____________________'}</div>
                  <div>SEMANA DEL: ${formatLocalDate(planToPrint.weekStartDate, { day: '2-digit', month: 'long', year: 'numeric' })}</div>
               </div>
            </div>
            
            ${planToPrint.days.map((day: any) => `
              <div class="clase">
                <div class="clase-header">
                  <span>CLASE ${day.numero_clase} — ${day.dayOfWeek}</span>
                  <span>FECHA: ${formatLocalDate(day.date)}</span>
                </div>
                <div class="label">TEMA</div>
                <div class="content"><strong>${day.topic}</strong></div>
                <div class="label">OBJETIVO</div>
                <div class="content">${day.objetivo}</div>
                <div class="label">CONTENIDO</div>
                <div class="content">${day.contenido}</div>
                <div class="label">ACTIVIDADES</div>
                <div class="content">${day.actividades || 'No especificadas'}</div>
                <div class="label">RECURSOS</div>
                <div class="content">${day.recursos || 'No especificados'}</div>
                <div class="label">EVALUACIÓN</div>
                <div class="content">${day.evaluacion || 'No especificada'}</div>
              </div>
            `).join('')}
            
            <script>window.onload = () => { window.print(); setTimeout(window.close, 500); }</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("Hubo un error al generar el PDF. Por favor, intentá de nuevo.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:h-[calc(100vh-160px)] animate-in fade-in duration-700">
      
      <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-0 bg-brand-navy rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="flex bg-black/40 p-1.5 border-b border-white/5">
              <button 
                onClick={() => setChatView('chat')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chatView === 'chat' ? 'bg-brand-orange text-white' : 'text-slate-500 hover:text-white'}`}
              >
                Chat
              </button>
              <button 
                onClick={() => setChatView('history')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chatView === 'history' ? 'bg-brand-orange text-white' : 'text-slate-500 hover:text-white'}`}
              >
                Historial
              </button>
        </div>

        {chatView === 'chat' && (
          <div className="px-6 py-4 bg-white/5 border-b border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Aula / Grado</label>
                <select 
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2.5 bg-brand-navy border border-white/10 rounded-xl text-white text-[10px] font-bold outline-none focus:border-brand-orange"
                >
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Área / Materia</label>
                <select 
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full p-2.5 bg-brand-navy border border-white/10 rounded-xl text-white text-[10px] font-bold outline-none focus:border-brand-orange"
                >
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha de Inicio</label>
                <input 
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-brand-navy border border-white/10 rounded-xl text-white text-[10px] font-bold outline-none focus:border-brand-orange"
                />
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Cant. de Clases</label>
                <select 
                  value={numClasses}
                  onChange={(e) => setNumClasses(Number(e.target.value))}
                  className="w-full p-2.5 bg-brand-navy border border-white/10 rounded-xl text-white text-[10px] font-bold outline-none focus:border-brand-orange"
                >
                  {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Clases</option>)}
                </select>
             </div>
          </div>
        )}

        {chatView === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {currentMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-2xl ${msg.role === 'assistant' ? 'bg-brand-navy border border-white/10 text-brand-orange' : 'bg-brand-blue text-white'}`}>
                    {msg.role === 'assistant' ? <Sparkles size={18} /> : <UserIcon size={18} />}
                  </div>
                  <div className={`max-w-[85%] rounded-[2rem] p-5 shadow-2xl text-sm font-bold leading-relaxed ${msg.role === 'user' ? 'bg-brand-orange text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'}`}>
                    {msg.role === 'assistant' 
                      ? msg.content.split('[GENERAR_PLAN_JSON]')[0].split('```json')[0].trim() 
                      : msg.content}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex items-center gap-3 text-brand-orange font-black p-4 bg-brand-orange/10 rounded-2xl w-fit animate-pulse border border-brand-orange/20">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-[9px] uppercase tracking-widest">Generando...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 sm:p-6 bg-black/20 border-t border-white/5">
              <div className="flex gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/10 focus-within:border-brand-orange transition-all">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribí tu tema..."
                  className="flex-1 bg-transparent px-4 py-2 text-white font-bold text-sm outline-none"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={isGenerating || !inputValue.trim()}
                  className="bg-brand-orange text-white p-3 rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
             {allPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center opacity-30">
                  <ClipboardList size={40} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No hay planificaciones guardadas</p>
                </div>
             ) : (
                allPlans.map(plan => (
                  <div 
                    key={plan.id}
                    onClick={() => setActivePlan(plan)}
                    className={`p-6 bg-white/5 border rounded-[2rem] transition-all cursor-pointer group space-y-4 hover:bg-white/10 ${activePlan?.id === plan.id ? 'border-brand-orange shadow-xl' : 'border-white/5'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-white font-black text-sm group-hover:text-brand-orange transition-colors">
                          {plan.aula_grado} — {plan.area_materia}
                        </h4>
                        <div className="flex items-center gap-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">
                           <span className="flex items-center gap-1"><Calendar size={10} /> {formatLocalDate(plan.weekStartDate)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} 
                        className="p-2 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
             )}
          </div>
        )}
      </div>

      <div className="w-full lg:w-[480px] flex flex-col bg-brand-navy rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden min-h-[600px] lg:min-h-0">
         {!activePlan ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
               <Calendar size={48} className="mb-6" />
               <h3 className="text-xl font-black text-white mb-2">Sin plan activo</h3>
               <p className="text-[10px] font-black uppercase tracking-widest">Iniciá un chat para generar tu semana.</p>
            </div>
         ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
               <div className="p-6 sm:p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <div>
                    <h2 className="text-xl font-black text-white font-montserrat truncate max-w-[200px]">{activePlan.area_materia}</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Semana del {formatLocalDate(activePlan.weekStartDate)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDownloadPDF} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white hover:text-brand-navy transition-all">
                       <FileText size={18} />
                    </button>
                    <button onClick={() => handleDeletePlan(activePlan.id)} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all">
                       <Trash2 size={18} />
                    </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                  {activePlan.days.map((day) => (
                    <div key={day.id} className={`p-6 bg-white/5 border border-white/5 rounded-[2rem] transition-all hover:border-brand-orange`}>
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="bg-brand-orange text-white w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-black">
                                <span>{day.dayOfWeek.substring(0, 3)}</span>
                                <span className="text-sm -mt-1">{new Date(day.date + 'T12:00:00').getDate()}</span>
                             </div>
                             <h4 className="font-black text-white text-sm tracking-tight">{day.topic}</h4>
                          </div>
                       </div>
                       <div className="space-y-4">
                           <div className="space-y-2">
                             <p className="text-[10px] font-black text-brand-orange uppercase tracking-tight italic">🎯 Objetivo</p>
                             <p className="text-xs text-white font-bold leading-relaxed line-clamp-2">{day.objetivo}</p>
                           </div>
                           <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight italic">📝 Contenido</p>
                             <p className="text-xs text-slate-300 font-bold leading-relaxed line-clamp-3">{day.contenido}</p>
                           </div>
                           <div className="flex justify-between items-center pt-3 border-t border-white/5">
                              <button 
                                onClick={() => handleUpdateDay(day.id, { status: day.status === 'Completado' ? 'Pendiente' : 'Completado' })}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${day.status === 'Completado' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500 border border-white/10'}`}
                              >
                                {day.status === 'Completado' ? 'Listo' : 'Pendiente'}
                              </button>
                              <button onClick={() => setIsEditing(day.id)} className="p-2.5 bg-brand-orange/10 rounded-xl text-brand-orange hover:bg-brand-orange hover:text-white transition-all">
                                <ChevronRight size={18} />
                              </button>
                           </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         )}
      </div>

      {isEditing && activePlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
           {(() => {
              const day = activePlan.days.find(d => d.id === isEditing);
              if (!day) return null;
              return (
                 <div className="bg-brand-navy border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
                    <div className="p-10 flex items-center justify-between border-b border-white/5">
                       <div>
                          <h2 className="text-2xl font-black text-white">Detalle de Clase</h2>
                          <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">{day.dayOfWeek} — {formatLocalDate(day.date)}</p>
                       </div>
                       <button onClick={() => setIsEditing(null)} className="p-4 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={24} /></button>
                    </div>
                    <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                       <div>
                          <label className="text-[10px] font-black text-brand-orange uppercase">🎯 Objetivo</label>
                          <p className="text-white font-bold leading-relaxed">{day.objetivo}</p>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase">📚 Contenido</label>
                          <p className="text-slate-300 font-bold leading-relaxed whitespace-pre-wrap">{day.contenido}</p>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-emerald-500 uppercase">🎮 Actividades</label>
                          <p className="text-emerald-100/80 font-bold leading-relaxed whitespace-pre-wrap">{day.actividades}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                          <div>
                             <label className="text-[10px] font-black text-slate-500 uppercase">🛠️ Recursos</label>
                             <p className="text-xs text-slate-400 font-bold">{day.recursos || 'No especificados'}</p>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-500 uppercase">📊 Evaluación</label>
                             <p className="text-xs text-slate-400 font-bold">{day.evaluacion || 'No especificada'}</p>
                          </div>
                       </div>
                    </div>
                    <div className="p-10 border-t border-white/5 flex justify-end">
                       <button onClick={() => setIsEditing(null)} className="px-10 py-4 bg-brand-orange text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:scale-105 transition-all">Cerrar</button>
                    </div>
                 </div>
              );
           })()}
        </div>
      )}
    </div>
  );
}
