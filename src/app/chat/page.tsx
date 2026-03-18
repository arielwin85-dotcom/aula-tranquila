"use client";

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User as UserIcon, Calendar, CheckCircle2, AlertCircle, RefreshCw, FileText, ChevronRight, Clock, Loader2, Trash2, X } from 'lucide-react';
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
  const [isRegeneratingDay, setIsRegeneratingDay] = useState<string | null>(null);

  const currentMessages = allMessages[getContextKey()] || [{
    id: 'welcome',
    userId: 'system',
    role: 'assistant',
    content: `¡Hola! Soy tu Mentor Pedagógico de Aula Tranquila. Estoy posicionado en **${currentClass?.name || ''} (${currentClass?.grade || ''})** para trabajar **${selectedSubject}**.\n\nComo experto, he analizado los Diseños Curriculares y los NAP. ¿Querés que diseñemos la planificación para las ${numClasses} clases solicitadas o preferís contarme algún tema específico que ya estés trabajando?`,
    timestamp: mounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  }];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredHistory = allPlans.filter(p => 
    p.classroomId === selectedClassId && p.subjectId === selectedSubjectId
  ).reverse();

  // Timezone-robust date formatter
  const formatLocalDate = (dateStr: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', options);
  };

  const getDayName = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { weekday: 'long' });
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
    
    // Use ID to avoid loop if object reference changes but content is same
    if (matchedPlan && matchedPlan.id !== activePlan?.id) {
      setActivePlan(matchedPlan);
      
      // Only sync messages if they exist and are different from current view
      if (matchedPlan.messages && matchedPlan.messages.length > 0) {
        const key = `${matchedPlan.classroomId}-${matchedPlan.subjectId}`;
        const currentMsgs = allMessages[key];
        
        // Prevent setting messages if they match the existing ones (to avoid loop)
        if (!currentMsgs || currentMsgs.length <= 1 || JSON.stringify(currentMsgs) !== JSON.stringify(matchedPlan.messages)) {
          setAllMessages(prev => ({
            ...prev,
            [key]: matchedPlan.messages || []
          }));
        }
      }
    } else if (!matchedPlan && activePlan !== null) {
      setActivePlan(null);
    }
  }, [selectedSubjectId, selectedClassId, allPlans, startDate, activePlan?.id]);

  // Sidebar Suggestions
  useEffect(() => {
    const fetchSidebarDocs = async () => {
      if (!selectedClassId || !selectedSubjectId || classrooms.length === 0) return;
      const currentClass = classrooms.find(c => c.id === selectedClassId);
      const gradeToken = currentClass ? currentClass.grade : '';
      const subjects = currentClass?.subjects || [];
      const subjectName = subjects.find((s: any) => s.id === selectedSubjectId)?.name || '';
      try {
        const query = encodeURIComponent(`${subjectName} ${gradeToken}`);
        const res = await fetch(`/api/biblioteca/search?q=${query}`);
        if (res.ok) {
          const docs = await res.json();
          setRecommendedDocs(docs.slice(0, 3));
        }
      } catch (err) {
        console.error("Sidebar hydrate failed", err);
      }
    };
    fetchSidebarDocs();
  }, [activePlan?.id, selectedClassId, selectedSubjectId, classrooms]);

  // Individual Day Resources
  useEffect(() => {
    const hydrateDayResources = async () => {
      if (!activePlan || classrooms.length === 0 || !selectedClassId || !selectedSubjectId) return;
      
      // Optimization: Only run if there are days that actually need resources
      const needsHydration = activePlan.days.some(day => !day.isHoliday && (!day.resources || day.resources.length === 0));
      if (!needsHydration) return;

      const currentClass = classrooms.find(c => c.id === selectedClassId);
      const gradeToken = currentClass ? currentClass.grade : '';
      const subjects = currentClass?.subjects || [];
      const subjectName = subjects.find((s: any) => s.id === selectedSubjectId)?.name || '';
      let needsUpdate = false;
      const updatedDays = await Promise.all(activePlan.days.map(async (day) => {
        if (!day.isHoliday && (!day.resources || day.resources.length === 0)) {
           try {
             const res = await fetch(`/api/biblioteca/search?q=${encodeURIComponent(day.topic + ' ' + gradeToken)}`);
             if (res.ok) {
               const docs = await res.json();
               needsUpdate = true;
               return { ...day, resources: docs.slice(0, 2) };
             }
           } catch (e) {
             console.error(`Failed to hydrate resources for day ${day.id}`, e);
           }
        }
        return day;
      }));
      if (needsUpdate) {
        const updatedPlan = { ...activePlan, days: updatedDays };
        setActivePlan(updatedPlan);
        setAllPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
        try {
          await fetch(`/api/weeklyPlans/${updatedPlan.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPlan)
          });
        } catch (err) {
          console.error('Failed to persist hydrated day resources', err);
        }
      }
    };
    hydrateDayResources();
  }, [activePlan?.id, selectedClassId, selectedSubjectId, classrooms]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, selectedClassId, selectedSubjectId]);

  // Update selectedSubjectId when classroom changes
  useEffect(() => {
    if (currentClass && currentClass.subjects && currentClass.subjects.length > 0) {
      if (!currentClass.subjects.find((s: any) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(currentClass.subjects[0].id);
      }
    }
  }, [selectedClassId, currentClass]);

  const handleSend = async (overrideValue?: string) => {
    const messageToSend = overrideValue || inputValue;
    if (!messageToSend.trim()) return;

    const key = getContextKey();
    const newUserMsg: ChatMessage = {
      id: uuidv4(),
      userId: 'profe-1',
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAllMessages(prev => ({
      ...prev,
      [key]: [...(prev[key] || currentMessages), newUserMsg]
    }));
    
    setInputValue('');
    setIsGenerating(true);
    setRecommendedDocs([]);

    const selectedClass = classrooms.find(c => c.id === selectedClassId);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...currentMessages, newUserMsg],
          classroomId: selectedClassId,
          classroom: selectedClass,
          subjectId: selectedSubjectId,
          subjectName: selectedClass?.subjects?.find((s: any) => s.id === selectedSubjectId)?.name || 'Materia',
          config: { startDate, numClasses }
        }),
      });

      if (!response.ok) throw new Error('Error al conectar con el Asistente');

      const data = await response.json();
      let rawText = data.reply;
      let extractedDays: any[] = [];
      let chatReplyText = rawText;

      if (rawText.includes('[GENERAR_PLAN_JSON]')) {
        const parts = rawText.split('[GENERAR_PLAN_JSON]');
        chatReplyText = parts[0].trim();
        const jsonCandidate = parts[1].trim();
        const firstBracket = jsonCandidate.indexOf('[');
        const lastBracket = jsonCandidate.lastIndexOf(']');
        try {
          extractedDays = JSON.parse(jsonCandidate.substring(firstBracket, lastBracket + 1));
        } catch (e) {
          console.error("Failed to parse tagged JSON", e);
        }
      } else if (rawText.includes('```json')) {
        const parts = rawText.split('```json');
        chatReplyText = parts[0].trim();
        const jsonBlockPart = parts[1].split('```')[0].trim();
        try {
          extractedDays = JSON.parse(jsonBlockPart);
        } catch (e) {
          console.error("Failed to parse markdown JSON block", e);
        }
      }

      if (extractedDays.length > 0) {
        const planStartDate = new Date(startDate + 'T12:00:00'); 
        const newPlanId = uuidv4();
        let currentDate = new Date(planStartDate);
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const mappedDays: PlanDay[] = extractedDays.map((d: any) => {
          const classDate = new Date(currentDate);
          const dayObj: PlanDay = {
             id: uuidv4(),
             date: classDate.toISOString(),
             dayOfWeek: classDate.toLocaleDateString('es-AR', { weekday: 'long' }),
             topic: d.topic || "⚠️ Sin Tema Asignado",
             description: d.description || "Sin descripción.",
             isHoliday: d.isHoliday || false,
             status: 'Pendiente',
             resources: []
          };
          currentDate.setDate(currentDate.getDate() + 1);
          while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          return dayObj;
        });

        const planPayload: WeeklyPlan = {
          id: newPlanId,
          userId: user?.id,
          classroomId: selectedClassId,
          subjectId: selectedSubjectId,
          aula_grado: selectedClass?.name || 'Aula',
          area_materia: selectedSubject || 'Materia',
          weekStartDate: new Date(startDate).toISOString(),
          numClasses: numClasses,
          days: mappedDays,
          messages: [...(allMessages[key] || currentMessages), newUserMsg],
          createdAt: new Date().toISOString()
        };

        await fetch('/api/weeklyPlans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planPayload)
        });

        setAllPlans(prev => [...prev, planPayload]);
        setActivePlan(planPayload);

        const botMsg: ChatMessage = {
          id: uuidv4(), role: 'assistant', userId: 'system',
          content: chatReplyText || 'He generado tu planificación.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAllMessages(prev => ({
          ...prev,
          [key]: [...(prev[key] || []), botMsg]
        }));
      } else {
        const botMsg: ChatMessage = {
          id: uuidv4(), role: 'assistant', userId: 'system',
          content: rawText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAllMessages(prev => ({
          ...prev,
          [key]: [...(prev[key] || []), botMsg]
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const res = await fetch(`/api/weeklyPlans/${planId}`, { method: 'DELETE' });
      if (res.ok) {
        setAllPlans(prev => prev.filter(p => p.id !== planId));
        setActivePlan(null);
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

  const handleDownloadPDF = () => {
    if (!activePlan) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Use current state to build the print version
    const html = `
      <html>
        <head>
          <title>Planificación - Aula Tranquila</title>
          <style>
             body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
             h1 { color: #f97316; margin-bottom: 5px; font-weight: 900; }
             .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
             .clase { margin-bottom: 30px; padding: 25px; border-radius: 20px; border: 1px solid #f1f5f9; background: #fff; page-break-inside: avoid; }
             .fecha { font-weight: 800; color: #f97316; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; font-family: monospace; }
             .titulo { font-size: 20px; font-weight: 900; margin-bottom: 12px; color: #0f172a; }
             .desc { font-size: 14px; line-height: 1.7; color: #475569; white-space: pre-wrap; }
             .estado { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-top: 15px; color: #94a3b8; border-top: 1px dashed #f1f5f9; pt: 10px; display: block; }
             .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 2px solid #f97316; padding-top: 20px; font-weight: bold; }
             @media print {
               body { padding: 20px; }
               .clase { border: none; border-bottom: 1px solid #e2e8f0; border-radius: 0; padding: 20px 0; }
               .no-print { display: none; }
             }
          </style>
        </head>
        <body>
          <div class="header">
             <h1>Planificación de Clases</h1>
             <p style="font-size: 14px; font-weight: 700; color: #64748b; margin: 0;">Materia: ${selectedSubject} • Ciclo Lectivo</p>
             <p style="font-size: 12px; font-weight: 600; color: #94a3b8; margin: 4px 0 0 0;">Semana del ${formatLocalDate(activePlan.weekStartDate, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          
          ${activePlan.days.map(day => `
            <div class="clase">
              <div class="fecha">📅 ${day.dayOfWeek} ${new Date(day.date).getDate()}</div>
              <div class="titulo">📌 ${day.topic}</div>
              <div class="desc">${day.description}</div>
              <span class="estado">Estado: ${day.status}</span>
            </div>
          `).join('')}

          <div class="footer">
            GENERADO POR AULA TRANQUILA - SOFTWARE DE GESTIÓN PEDAGÓGICA • ${new Date().toLocaleDateString()}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:h-[calc(100vh-160px)] animate-in fade-in duration-700">
      
      {/* Columna Izquierda: Chat e Historial */}
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

        {/* Configuration Header - PEDAGOGICAL POSITIONING */}
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

            {recommendedDocs.length > 0 && (
              <div className="px-6 py-4 bg-black/40 border-t border-white/5 overflow-x-auto">
                <div className="flex gap-3">
                  {recommendedDocs.map(doc => (
                    <a key={doc.id} href={doc.webViewLink} target="_blank" rel="noreferrer" className="flex-shrink-0 bg-brand-navy p-3 rounded-xl border border-white/5 flex items-center gap-2 hover:border-brand-orange transition-all">
                      <FileText size={14} className="text-brand-orange" />
                      <span className="text-[10px] font-black text-slate-300 truncate max-w-[120px] uppercase">{doc.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

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
             {filteredHistory.map(plan => (
                <div 
                   key={plan.id}
                   onClick={() => setActivePlan(plan)}
                   className="p-5 bg-white/5 border border-white/5 rounded-3xl hover:border-brand-orange transition-all cursor-pointer group flex justify-between items-center"
                >
                   <div>
                      <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">{formatLocalDate(plan.weekStartDate, { month: 'long', year: 'numeric' })}</p>
                      <h4 className="text-white font-black group-hover:text-brand-orange transition-colors">Semana del {new Date(plan.weekStartDate).getDate()}</h4>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} className="p-3 text-slate-700 hover:text-red-500 transition-colors">
                     <Trash2 size={16} />
                   </button>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Columna Derecha: Calendario y Plan Detallado */}
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
                    <h2 className="text-xl font-black text-white font-montserrat truncate max-w-[200px]">{selectedSubject}</h2>
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
                    <div key={day.id} className={`p-6 bg-white/5 border border-white/5 rounded-[2rem] transition-all ${day.isHoliday ? 'opacity-40 grayscale' : 'hover:border-brand-orange'}`}>
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="bg-brand-orange text-white w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-black">
                                <span>{day.dayOfWeek.substring(0, 3)}</span>
                                <span className="text-sm -mt-1">{new Date(day.date).getDate()}</span>
                             </div>
                             <h4 className="font-black text-white text-sm tracking-tight">{day.topic}</h4>
                          </div>
                       </div>
                       {!day.isHoliday && (
                         <div className="space-y-4">
                             <p className="text-xs text-slate-400 font-bold leading-relaxed line-clamp-3">{day.description}</p>
                             
                             {/* CAMBIO 5: Recursos sugeridos de Mi Biblioteca */}
                             {day.resources && day.resources.length > 0 && (
                               <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                  <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest flex items-center gap-1.5">
                                    📎 Recursos sugeridos
                                  </p>
                                  <div className="flex flex-col gap-2">
                                     {day.resources.map((res: any) => (
                                       <a 
                                         key={res.id} 
                                         href={res.webViewLink} 
                                         target="_blank" 
                                         rel="noreferrer" 
                                         className="flex items-center gap-3 p-2 bg-black/20 border border-white/5 rounded-xl hover:border-brand-orange transition-all group"
                                       >
                                          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all">
                                             <FileText size={12} />
                                          </div>
                                          <span className="text-[9px] font-bold text-slate-300 truncate uppercase tracking-tight">{res.name}</span>
                                       </a>
                                     ))}
                                  </div>
                               </div>
                             )}
                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                               <button 
                                 onClick={() => handleUpdateDay(day.id, { status: day.status === 'Completado' ? 'Pendiente' : 'Completado' })}
                                 className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${day.status === 'Completado' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500 border border-white/10'}`}
                               >
                                 {day.status === 'Completado' ? 'Listo' : 'Pendiente'}
                               </button>
                               <button 
                                 onClick={() => setIsEditing(day.id)}
                                 className="text-[9px] font-black text-brand-orange uppercase tracking-widest hover:underline"
                               >
                                 Ver detalle
                               </button>
                            </div>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>
          )}
      </div>

      {/* Modal de Detalle del Día */}
      {isEditing && activePlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
           <div className="bg-brand-navy border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-brand-orange/10 to-transparent">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                       <Calendar size={24} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-white font-montserrat tracking-tight">Detalle de Clase</h2>
                       <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">Revisión y Recursos</p>
                    </div>
                 </div>
                 <button onClick={() => setIsEditing(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-white transition-all">
                    <X size={24} />
                 </button>
              </div>
              <div className="p-10 space-y-8">
                 {activePlan && isEditing && (() => {
                    const day = activePlan.days.find(d => d.id === isEditing);
                    if (!day) return <p className="text-slate-500 font-bold">No se encontró información para este día.</p>;
                    
                    return (
                       <>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tema de la clase</label>
                             <h3 className="text-xl font-black text-white">{day.topic}</h3>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Desarrollo Pedagógico</label>
                             <div className="p-6 bg-white/5 border border-white/5 rounded-3xl text-slate-300 font-bold leading-relaxed whitespace-pre-wrap">
                                {day.description}
                             </div>
                          </div>
                          {day.resources && day.resources.length > 0 && (
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recursos Recomendados</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   {day.resources.map((res: any) => (
                                      <a key={res.id} href={res.webViewLink} target="_blank" rel="noreferrer" className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-brand-orange transition-all group">
                                         <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all">
                                            <FileText size={18} />
                                          </div>
                                         <span className="text-xs font-black text-white truncate uppercase tracking-tight">{res.name}</span>
                                      </a>
                                   ))}
                                </div>
                             </div>
                          )}
                       </>
                    );
                 })()}
              </div>
              <div className="p-10 border-t border-white/5 bg-black/20 flex justify-end">
                 <button onClick={() => setIsEditing(null)} className="px-10 py-4 bg-brand-orange text-white font-black uppercase tracking-widest text-[11px] rounded-[1.2rem] shadow-xl shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all">Cerrar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
