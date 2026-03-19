'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Send, 
  Sparkles, 
  History, 
  MessageCircle, 
  Calendar, 
  BookOpen, 
  Users, 
  FileText, 
  Printer, 
  ChevronRight, 
  Loader2, 
  User, 
  Download,
  MoreVertical,
  Plus,
  Settings
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Mensaje { role: 'user' | 'assistant'; content: string; }
interface Clase {
  id?: string;
  numero_clase: number; fecha: string; dia_semana: string;
  titulo: string; objetivo: string; contenido: string;
  actividades: string; recursos: string; evaluacion: string;
  estado?: string;
}
interface Planificacion {
  id: string; aula_grado: string; area_materia: string;
  fecha_inicio: string; cant_clases: number; created_at: string;
  planificacion_clases: Clase[];
}

export default function ChatPage() {
  const supabase = createClient();

  // ── Estados ────────────────────────────────────────────────────────────
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [clasesPanelDerecho, setClasesPanelDerecho] = useState<Clase[]>([]);
  const [historial, setHistorial] = useState<Planificacion[]>([]);
  const [tabActiva, setTabActiva] = useState<'chat' | 'historial'>('chat');
  const [userId, setUserId] = useState<string>('');
  const [clasesDocente, setClasesDocente] = useState<any[]>([]);
  const [materiasDisponibles, setMateriasDisponibles] = useState<string[]>([]);
  const [aulaGradoSeleccionado, setAulaGradoSeleccionado] = useState<any>(null);

  // Combos del formulario
  const [aulaGrado, setAulaGrado] = useState('');
  const [areaMateria, setAreaMateria] = useState('');
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [cantClases, setCantClases] = useState('5');

  const chatEndRef = useRef<HTMLDivElement>(null);


  // ── Inicialización ─────────────────────────────────────────────────────
  const cargarClasesDocente = async () => {
    try {
      const res = await fetch('/api/classrooms');
      const clases = await res.json();
      
      if (clases.error) throw new Error(clases.error);

      setClasesDocente(clases || []);

      if (clases && clases.length > 0) {
        setAulaGradoSeleccionado(clases[0]);
        setAulaGrado(clases[0].name || clases[0].grade);
        
        // Adaptación para subjects que pueden ser array de strings o de objetos
        const subs = (clases[0].subjects || []).map((s: any) => typeof s === 'string' ? s : s.name);
        setMateriasDisponibles(subs);
        setAreaMateria(subs[0] || '');
      }
    } catch (error) {
      console.error('Error cargando clases desde API:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (meData.user) {
          setUserId(meData.user.id);
          await cargarClasesDocente();
          await cargarHistorial(meData.user.id);
        }
      } catch (err) {
        console.error("Initialization failed in ChatPage", err);
      }
    };
    init();
  }, []);


  // Saludo automático al cambiar combo
  useEffect(() => {
    if (!aulaGrado || !areaMateria) return;

    setMensajes([{
      role: 'assistant',
      content: `¡Bienvenido/a! Soy tu asistente pedagógico. 
Voy a ayudarte a planificar **${aulaGrado}** — **${areaMateria}**. 
¿Tenés algún tema específico en mente, o querés que proponga 
la continuación según lo que ya dimos?`
    }]);
  }, [aulaGrado, areaMateria]);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const generarFechasHabiles = (inicio: string, cantidad: number): string[] => {
    const fechas: string[] = [];
    const fecha = new Date(inicio + 'T12:00:00');
    while (fechas.length < cantidad) {
      const dia = fecha.getDay();
      if (dia !== 0 && dia !== 6) {
        fechas.push(fecha.toISOString().split('T')[0]);
      }
      fecha.setDate(fecha.getDate() + 1);
    }
    return fechas;
  };

  const nombreDia = (fechaStr: string): string => {
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    return dias[new Date(fechaStr + 'T12:00:00').getDay()];
  };

  const guardarPlanificacion = async (clases: Clase[]) => {
    if (!userId) return;
    const fechasHabiles = generarFechasHabiles(fechaInicio, clases.length);
    const clasesConFechas = clases.map((c, i) => ({
      ...c,
      fecha: fechasHabiles[i] || c.fecha,
      dia_semana: nombreDia(fechasHabiles[i] || c.fecha)
    }));

    const { data: plan, error: errorPlan } = await supabase
      .from('planificaciones')
      .insert([{
        user_id: userId,
        aula_grado: aulaGrado,
        area_materia: areaMateria,
        fecha_inicio: fechaInicio,
        cant_clases: parseInt(cantClases)
      }])
      .select().single();

    if (errorPlan) return;

    await supabase.from('planificacion_clases').insert(clasesConFechas.map(c => ({
      planificacion_id: plan.id,
      numero_clase: c.numero_clase,
      fecha: c.fecha,
      dia_semana: c.dia_semana,
      titulo: c.titulo,
      objetivo: c.objetivo || '',
      contenido: c.contenido || '',
      actividades: c.actividades || '',
      recursos: c.recursos || '',
      evaluacion: c.evaluacion || '',
      estado: 'PENDIENTE'
    })));

    await supabase.from('contenidos_dados').insert(clasesConFechas.map(c => ({
      user_id: userId, aula_grado: aulaGrado, area_materia: areaMateria,
      tema: c.titulo, fecha_dada: c.fecha
    })));

    setClasesPanelDerecho(clasesConFechas);
    await cargarHistorial(userId);
  };

  const cargarHistorial = async (uid: string) => {
    try {
      const res = await fetch(`/api/planificaciones?userId=${uid}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHistorial(data || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };


  const procesarRespuesta = async (rawText: string) => {
    try {
      const jsonMatch = rawText.match(/\[GENERAR_PLAN_JSON\]\s*(\{[\s\S]*\})/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.planificacion && Array.isArray(parsed.planificacion)) {
          await guardarPlanificacion(parsed.planificacion);
          const textoVisible = rawText.split('[GENERAR_PLAN_JSON]')[0].trim();
          agregarMensaje('assistant', textoVisible || 'Planificación finalizada ✅');
          return;
        }
      }
      agregarMensaje('assistant', rawText);
    } catch (error) {
      agregarMensaje('assistant', 'Hubo un error generando la planificación.');
    }
  };

  const enviarMensaje = async () => {
    if (!input.trim() || cargando) return;
    const mensajeUsuario = input.trim();
    setInput('');
    agregarMensaje('user', mensajeUsuario);
    setCargando(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...mensajes, { role: 'user', content: mensajeUsuario }],
          context: { aulaGrado, areaMateria, fechaInicio, cantClases: parseInt(cantClases), userId }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await procesarRespuesta(data.response);
    } catch (error) {
      agregarMensaje('assistant', 'Error de conexión.');
    } finally { setCargando(false); }
  };

  const agregarMensaje = (role: 'user' | 'assistant', content: string) => {
    setMensajes(prev => [...prev, { role, content }]);
  };

  const handlePrintPlan = (plan: Planificacion | Clase[]) => {
    const isArray = Array.isArray(plan);
    const clases = isArray ? plan : plan.planificacion_clases;
    const info = isArray ? { area_materia: areaMateria, aula_grado: aulaGrado } : plan;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Planificación - ${info.area_materia}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #000; line-height: 1.5; }
            .header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .header p { margin: 5px 0; font-size: 14px; font-weight: bold; }
            .clase { margin-bottom: 40px; page-break-inside: avoid; border: 1px solid #eee; padding: 20px; border-radius: 10px; }
            .clase-header { display: flex; justify-content: space-between; border-bottom: 1px solid #000; margin-bottom: 15px; padding-bottom: 5px; }
            .clase-title { font-size: 18px; font-weight: bold; color: #d97706; margin: 10px 0; }
            .section { margin-bottom: 15px; }
            .section-title { font-[8px]; font-weight: bold; text-transform: uppercase; color: #666; display: block; margin-bottom: 5px; }
            .section-content { font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Planificación Docente</h1>
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
              <p>MATERIA: ${info.area_materia}</p>
              <p>CURSO: ${info.aula_grado}</p>
            </div>
            <p>FECHA DE INICIO: ${!isArray ? (plan as Planificacion).fecha_inicio : fechaInicio}</p>
          </div>
          ${clases.sort((a,b)=>a.numero_clase-b.numero_clase).map(c => `
            <div class="clase">
              <div class="clase-header">
                <strong>CLASE ${c.numero_clase}</strong>
                <span>${c.dia_semana} ${c.fecha.split('-').reverse().join('/')}</span>
              </div>
              <div class="clase-title">${c.titulo}</div>
              <div class="section">
                <span class="section-title">Objetivo</span>
                <div class="section-content">${c.objetivo}</div>
              </div>
              <div class="section">
                <span class="section-title">Contenido</span>
                <div class="section-content">${c.contenido}</div>
              </div>
              <div class="section">
                <span class="section-title">Actividades</span>
                <div class="section-content">${c.actividades}</div>
              </div>
              <div class="section">
                <span class="section-title">Recursos</span>
                <div class="section-content">${c.recursos}</div>
              </div>
              <div class="section">
                <span class="section-title">Evaluación</span>
                <div class="section-content">${c.evaluacion}</div>
              </div>
            </div>
          `).join('')}
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };


  // ── Render Components ────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-4 pb-4 animate-in fade-in duration-500">
      
      {/* Panel Izquierdo: Chat / Historial */}
      <div className="flex-1 flex flex-col bg-brand-navy/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        
        {/* Header con Tabs y Selectores */}
        <div className="p-6 border-b border-white/5 bg-black/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-6">
            {/* Toggle Chat/Historial */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
              <button 
                onClick={() => setTabActiva('chat')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tabActiva === 'chat' ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-slate-500 hover:text-white'}`}
              >
                <MessageCircle size={14} /> CHAT
              </button>
              <button 
                onClick={() => setTabActiva('historial')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tabActiva === 'historial' ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-slate-500 hover:text-white'}`}
              >
                <History size={14} /> HISTORIAL
              </button>
            </div>

            {/* Status Agente */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Agente en Línea</span>
            </div>
          </div>

          {tabActiva === 'chat' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Grado</label>
                <select 
                  value={aulaGradoSeleccionado?.id} 
                  onChange={e => {
                    const clase = clasesDocente.find(c => c.id === e.target.value);
                    setAulaGradoSeleccionado(clase);
                    setAulaGrado(clase?.name || clase?.grade || '');
                    const subs = (clase?.subjects || []).map((s: any) => typeof s === 'string' ? s : s.name);
                    setMateriasDisponibles(subs);
                    setAreaMateria(subs[0] || '');
                  }} 
                  className="bg-white/5 border border-white/10 text-white text-[11px] font-bold p-3 rounded-xl focus:ring-2 ring-brand-orange/20 outline-none transition-all"
                >
                  {clasesDocente.map(c => (
                    <option key={c.id} value={c.id} className="bg-brand-navy">{c.name || c.grade}</option>
                  ))}
                  {clasesDocente.length === 0 && <option value="" className="bg-brand-navy">Sin clases</option>}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Materia</label>
                <select 
                  value={areaMateria} 
                  onChange={e => setAreaMateria(e.target.value)} 
                  className="bg-white/5 border border-white/10 text-white text-[11px] font-bold p-3 rounded-xl focus:ring-2 ring-brand-orange/20 outline-none transition-all"
                >
                  {materiasDisponibles.map(m => (
                    <option key={m} value={m} className="bg-brand-navy">{m}</option>
                  ))}
                  {materiasDisponibles.length === 0 && <option value="" className="bg-brand-navy">N/A</option>}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Inicio</label>
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="bg-white/5 border border-white/10 text-white text-[11px] font-bold p-3 rounded-xl focus:ring-2 ring-brand-orange/20 outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Clases</label>
                <select value={cantClases} onChange={e => setCantClases(e.target.value)} className="bg-white/5 border border-white/10 text-white text-[11px] font-bold p-3 rounded-xl focus:ring-2 ring-brand-orange/20 outline-none transition-all">
                  {['1','2','3','4','5'].map(n => <option key={n} className="bg-brand-navy" value={n}>{n} {n==='1'?'Clase':'Clases'}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Zona de Contenido (Chat o Historial) */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
          {tabActiva === 'chat' ? (
            <div className="space-y-6">
              {mensajes.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${m.role === 'user' ? 'bg-brand-orange text-white' : 'bg-white/10 text-brand-orange'}`}>
                      {m.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
                    </div>
                    <div className={`p-5 rounded-[2rem] text-sm leading-relaxed font-medium shadow-xl ${m.role === 'user' ? 'bg-brand-orange text-white rounded-tr-none' : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'}`}>
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
              {cargando && (
                <div className="flex justify-start animate-pulse">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-brand-orange">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                    <span className="text-[10px] font-black text-brand-orange uppercase tracking-[.2em]">IA Procesando...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {historial.length === 0 ? (
                <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-[3rem]">
                   <History size={48} className="mb-4 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Sin historial acumulado</p>
                </div>
              ) : (
                historial.map(plan => (
                  <div key={plan.id} className="bg-black/20 border border-white/5 rounded-[2.5rem] p-6 hover:border-brand-orange/30 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-orange shadow-inner group-hover:scale-110 transition-all">
                        <Calendar size={24} />
                      </div>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => { 
                             setClasesPanelDerecho(plan.planificacion_clases); 
                             setAulaGrado(plan.aula_grado);
                             setAreaMateria(plan.area_materia);
                             setTabActiva('chat'); 
                           }} 
                           className="p-3 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white rounded-xl transition-all border border-brand-orange/20 shadow-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                           title="Cargar en Panel"
                         >
                           <ChevronRight size={16} /> VER
                         </button>
                         <button 
                           onClick={() => handlePrintPlan(plan)} 
                           className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 shadow-lg"
                           title="Imprimir PDF"
                         >
                            <Printer size={16} />
                         </button>

                      </div>
                    </div>
                    <h3 className="text-white font-black text-lg font-montserrat tracking-tight mb-1">{plan.area_materia}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{plan.aula_grado}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-4">Inicia: {plan.fecha_inicio.split('-').reverse().join('/')}</p>
                    <div className="flex items-center gap-3 text-[9px] font-black text-brand-orange uppercase tracking-widest bg-brand-orange/5 px-4 py-2 rounded-xl w-fit">
                        <BookOpen size={12} /> {plan.cant_clases} Clases
                    </div>
                  </div>
                ))

              )}
            </div>
          )}
        </div>

        {/* Input Flotante */}
        {tabActiva === 'chat' && (
          <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-md">
            <div className="relative flex items-center gap-4 bg-white/5 border border-white/10 p-2 pl-6 rounded-[2rem] focus-within:border-brand-orange/50 focus-within:ring-4 ring-brand-orange/5 transition-all shadow-2xl">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviarMensaje())}
                placeholder="Pedí tu planificación o decí 'dale'..."
                className="flex-1 bg-transparent border-none text-white text-sm font-bold placeholder:text-slate-600 outline-none"
                disabled={cargando}
              />
              <button 
                onClick={enviarMensaje}
                disabled={cargando || !input.trim()}
                className="bg-brand-orange hover:bg-brand-orange/80 text-white p-4 rounded-[1.5rem] shadow-xl shadow-brand-orange/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 flex items-center justify-center"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel Derecho: Planificación Activa */}
      <div className="w-full lg:w-[450px] flex flex-col gap-6 scroll-smooth overflow-y-auto pr-2 custom-scrollbar lg:h-full">
        {clasesPanelDerecho.length === 0 ? (
          <div className="flex-1 bg-brand-navy/30 border-2 border-dashed border-white/5 rounded-[3.5rem] flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-700 mb-8 border border-white/5 shadow-inner">
               <BookOpen size={48} className="opacity-20" />
            </div>
            <h3 className="text-white font-black text-xl mb-4 font-montserrat tracking-tight">Sin plan activo</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose max-w-[200px]">Iniciá una sesión de chat para estructurar tu planificación semanal.</p>
          </div>
        ) : (
          <>
            <div className="bg-brand-navy rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-orange opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000" />
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h2 className="text-2xl font-black text-white font-montserrat tracking-tight">Planificación</h2>
                  <p className="text-[9px] font-black text-brand-orange uppercase tracking-[.3em]">IA OPTIMIZADA</p>
                </div>
                 <button 
                   onClick={() => handlePrintPlan(clasesPanelDerecho)}
                   className="p-4 bg-white text-brand-navy rounded-2xl hover:bg-brand-peach transition-all shadow-xl hover:scale-105 active:scale-95"
                 >
                    <Printer size={20} />
                 </button>

              </div>

              <div className="space-y-6 relative z-10">
                {clasesPanelDerecho.sort((a,b)=>a.numero_clase-b.numero_clase).map((clase, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 hover:bg-white/10 transition-all group/item shadow-inner">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-lg uppercase tracking-widest">CLASE {clase.numero_clase}</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{clase.dia_semana} {clase.fecha.split('-').reverse().join('/')}</span>
                    </div>
                    <h4 className="text-white font-black text-md font-montserrat mb-4 tracking-tight group-hover/item:text-brand-orange transition-colors">{clase.titulo}</h4>
                    <div className="grid gap-4">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 animate-in fade-in"><Plus size={8} /> Objetivo</span>
                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{clase.objetivo}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Plus size={8} /> Actividades</span>
                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">{clase.actividades}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

               <button 
                 onClick={() => handlePrintPlan(clasesPanelDerecho)}
                 className="w-full mt-8 py-5 bg-white text-brand-navy rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 transition-all shadow-2xl hover:bg-brand-peach hover:scale-[1.02]"
               >
                  <Download size={18} /> Descargar Paquete Completo
               </button>

            </div>
          </>
        )}
      </div>

    </div>
  );
}
