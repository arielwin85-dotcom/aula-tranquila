'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

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

  // Combos del formulario
  const [aulaGrado, setAulaGrado] = useState('1er Grado 2026');
  const [areaMateria, setAreaMateria] = useState('Lengua y Literatura');
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [cantClases, setCantClases] = useState('5');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Inicialización ─────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await cargarHistorial(user.id);
        // Saludo inicial del agente
        setMensajes([{
          role: 'assistant',
          content: `¡Hola! Estoy listo para ayudarte a planificar ${areaMateria} para ${aulaGrado}. ¿Tenés algún tema específico en mente o querés que arme la planificación para las ${cantClases} clases desde ${fechaInicio}?`
        }]);
      }
    };
    init();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // ── Helpers de fechas hábiles ──────────────────────────────────────────
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

  // ── Guardar planificación en Supabase ──────────────────────────────────
  const guardarPlanificacion = async (clases: Clase[]) => {
    if (!userId) return;

    // Asignar fechas hábiles si el agente no las calculó bien
    const fechasHabiles = generarFechasHabiles(fechaInicio, clases.length);
    const clasesConFechas = clases.map((c, i) => ({
      ...c,
      fecha: fechasHabiles[i] || c.fecha,
      dia_semana: nombreDia(fechasHabiles[i] || c.fecha)
    }));

    // Guardar cabecera
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

    if (errorPlan) {
      console.error('Error guardando planificación:', errorPlan);
      return;
    }

    // Guardar clases
    const { error: errorClases } = await supabase
      .from('planificacion_clases')
      .insert(clasesConFechas.map(c => ({
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

    if (errorClases) {
      console.error('Error guardando clases:', errorClases);
      return;
    }

    // Guardar en memoria (contenidos_dados)
    await supabase.from('contenidos_dados').insert(
      clasesConFechas.map(c => ({
        user_id: userId,
        aula_grado: aulaGrado,
        area_materia: areaMateria,
        tema: c.titulo,
        fecha_dada: c.fecha
      }))
    );

    setClasesPanelDerecho(clasesConFechas);
    await cargarHistorial(userId);
  };

  // ── Cargar historial ───────────────────────────────────────────────────
  const cargarHistorial = async (uid: string) => {
    const { data, error } = await supabase
      .from('planificaciones')
      .select(`
        id, aula_grado, area_materia, fecha_inicio, cant_clases, created_at,
        planificacion_clases (
          id, numero_clase, fecha, dia_semana,
          titulo, objetivo, contenido, actividades,
          recursos, evaluacion, estado
        )
      `)
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) { console.error('Error cargando historial:', error); return; }
    setHistorial(data || []);
  };

  // ── Procesar respuesta del agente ──────────────────────────────────────
  const procesarRespuesta = async (rawText: string) => {
    try {
      const jsonMatch = rawText.match(/\[GENERAR_PLAN_JSON\]\s*(\{[\s\S]*\})/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.planificacion && Array.isArray(parsed.planificacion)) {
          await guardarPlanificacion(parsed.planificacion);
          // Mostrar solo el texto antes del JSON en el chat
          const textoVisible = rawText.split('[GENERAR_PLAN_JSON]')[0].trim();
          agregarMensaje('assistant', textoVisible || 'Planificación finalizada ✅');
          return;
        }
      }
      // Sin JSON → mostrar respuesta normal
      agregarMensaje('assistant', rawText);

    } catch (error) {
      console.error('Error procesando respuesta:', error);
      agregarMensaje('assistant', 'Hubo un error generando la planificación. Por favor intentá de nuevo.');
    }
  };

  // ── Enviar mensaje ─────────────────────────────────────────────────────
  const enviarMensaje = async () => {
    if (!input.trim() || cargando) return;

    const mensajeUsuario = input.trim();
    setInput('');
    agregarMensaje('user', mensajeUsuario);
    setCargando(true);

    try {
      const nuevosMensajes = [
        ...mensajes,
        { role: 'user' as const, content: mensajeUsuario }
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nuevosMensajes,
          context: {
            aulaGrado,
            areaMateria,
            fechaInicio,
            cantClases: parseInt(cantClases),
            userId
          }
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      await procesarRespuesta(data.response);

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      agregarMensaje('assistant', 'Error de conexión. Por favor intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const agregarMensaje = (role: 'user' | 'assistant', content: string) => {
    setMensajes(prev => [...prev, { role, content }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  // ── Generar PDF ────────────────────────────────────────────────────────
  const generarPDF = async (planId?: string) => {
    // Si se pasa un planId específico, buscar en historial
    // Si no, usar las clases actuales del panel derecho
    const clases = planId
      ? historial.find(p => p.id === planId)?.planificacion_clases || []
      : clasesPanelDerecho;

    const plan = planId
      ? historial.find(p => p.id === planId)
      : { aula_grado: aulaGrado, area_materia: areaMateria, fecha_inicio: fechaInicio };

    if (!clases.length) {
      alert('No hay planificación para exportar.');
      return;
    }

    // Usar la librería de PDF que ya está en el proyecto
    // Generar contenido del PDF con las clases
    const contenidoPDF = clases
      .sort((a, b) => (a.numero_clase || 0) - (b.numero_clase || 0))
      .map(c => `
CLASE ${c.numero_clase} — ${c.dia_semana} ${c.fecha}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 ${c.titulo}
🎯 Objetivo: ${c.objetivo}
📖 Contenido: ${c.contenido}
🎮 Actividades: ${c.actividades}
📦 Recursos: ${c.recursos}
✅ Evaluación: ${c.evaluacion}
      `).join('\n');

    console.log('PDF generado para:', plan?.aula_grado, plan?.area_materia);
    // Conectar con la función de PDF existente en el proyecto pasándole contenidoPDF
    
    // Fallback: mostrar en una ventana nueva si no hay generador de PDF nativo configurado
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 40px;">${contenidoPDF}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a', color: 'white' }}>

      {/* Panel izquierdo — Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#1e293b' }}>
          <button onClick={() => setTabActiva('chat')}
            style={{ 
              flex: 1, padding: '15px', 
              background: tabActiva === 'chat' ? '#e85d2f' : 'transparent',
              border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer'
            }}>
            CHAT
          </button>
          <button onClick={() => setTabActiva('historial')}
            style={{ 
              flex: 1, padding: '15px', 
              background: tabActiva === 'historial' ? '#e85d2f' : 'transparent',
              border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer'
            }}>
            HISTORIAL
          </button>
        </div>

        {tabActiva === 'chat' ? (
          <>
            {/* Combos */}
            <div style={{ display: 'flex', gap: '8px', padding: '16px', flexWrap: 'wrap', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
              <select value={aulaGrado} onChange={e => setAulaGrado(e.target.value)}
                style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '8px', borderRadius: '8px' }}>
                {['1er Grado 2026','2do Grado 2026','3er Grado 2026',
                  '4to Grado 2026','5to Grado 2026','6to Grado 2026','7mo Grado 2026']
                  .map(g => <option key={g}>{g}</option>)}
              </select>

              <select value={areaMateria} onChange={e => setAreaMateria(e.target.value)}
                style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '8px', borderRadius: '8px' }}>
                {['Lengua y Literatura','Matemática','Ciencias Naturales',
                  'Ciencias Sociales','Formación Ética','Educación Física',
                  'Música','Plástica','Teatro','Tecnología']
                  .map(m => <option key={m}>{m}</option>)}
              </select>

              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '8px', borderRadius: '8px' }}
              />

              <select value={cantClases} onChange={e => setCantClases(e.target.value)}
                style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '8px', borderRadius: '8px' }}>
                {['1','2','3','4','5'].map(n => (
                  <option key={n}>{n} {n === '1' ? 'Clase' : 'Clases'}</option>
                ))}
              </select>
            </div>

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {mensajes.map((m, i) => (
                <div key={i} style={{
                  marginBottom: '16px',
                  textAlign: m.role === 'user' ? 'right' : 'left'
                }}>
                  <div style={{
                    display: 'inline-block', padding: '12px 16px',
                    borderRadius: '16px', maxWidth: '85%',
                    background: m.role === 'user' ? '#e85d2f' : '#1e293b',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    lineHeight: '1.5'
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {cargando && (
                <div style={{ textAlign: 'left', padding: '10px' }}>
                  <span style={{ color: '#e85d2f', fontWeight: 'bold' }}>Preparando planificación...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', padding: '20px', gap: '10px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí tu tema o decí 'dale' para comenzar..."
                style={{ 
                  flex: 1, padding: '12px', borderRadius: '12px', 
                  background: '#1e293b', border: '1px solid #334155', 
                  color: 'white', outline: 'none'
                }}
                disabled={cargando}
              />
              <button 
                onClick={enviarMensaje} 
                disabled={cargando || !input.trim()}
                style={{ 
                  padding: '12px 24px', background: '#e85d2f', 
                  color: 'white', border: 'none', borderRadius: '12px', 
                  fontWeight: 'bold', cursor: 'pointer', opacity: (cargando || !input.trim()) ? 0.5 : 1
                }}>
                ENVIAR
              </button>
            </div>
          </>
        ) : (
          /* Historial */
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {historial.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>
                No hay planificaciones guardadas aún.
              </p>
            ) : (
              historial.map(plan => (
                <div key={plan.id} style={{
                  marginBottom: '20px', padding: '20px',
                  background: '#1e293b', borderRadius: '16px',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '18px', display: 'block' }}>{plan.area_materia}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>{plan.aula_grado} • Inicio: {plan.fecha_inicio}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => {
                        setClasesPanelDerecho(plan.planificacion_clases);
                        setTabActiva('chat');
                      }} style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                        Ver
                      </button>
                      <button onClick={() => generarPDF(plan.id)}
                        style={{ background: '#e85d2f', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                        PDF
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '15px', display: 'grid', gap: '10px' }}>
                    {plan.planificacion_clases
                      .sort((a, b) => (a.numero_clase || 0) - (b.numero_clase || 0))
                      .map(clase => (
                        <div key={clase.id} style={{
                          padding: '10px', background: '#0f172a', borderRadius: '10px',
                          border: '1px solid #1e293b'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#e85d2f', fontWeight: 'bold' }}>CLASE {clase.numero_clase}</span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{clase.dia_semana} {clase.fecha}</span>
                          </div>
                          <div style={{ marginTop: '4px', fontWeight: 'bold' }}>{clase.titulo}</div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Panel derecho — Clases generadas */}
      <div style={{
        width: '400px', padding: '24px',
        background: '#0f172a', overflowY: 'auto',
        borderLeft: '1px solid #1e293b'
      }}>
        {clasesPanelDerecho.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#475569', marginTop: '50%' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📅</div>
            <p style={{ fontWeight: 'bold' }}>Sin plan activo</p>
            <p style={{ fontSize: '14px' }}>Iniciá un chat para generar tu semana.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Planificación Activa</h2>
              <button onClick={() => generarPDF()} 
                style={{ background: '#e85d2f', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                📄 PDF
              </button>
            </div>
            {clasesPanelDerecho
              .sort((a, b) => (a.numero_clase || 0) - (b.numero_clase || 0))
              .map((clase, i) => (
                <div key={i} style={{
                  marginBottom: '20px', padding: '20px',
                  background: '#1e293b', borderRadius: '16px',
                  border: '1px solid #e85d2f44',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#e85d2f', fontWeight: 'bold', fontSize: '13px' }}>CLASE {clase.numero_clase}</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>{clase.dia_semana} {clase.fecha}</span>
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{clase.titulo}</h3>
                  
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#e85d2f', fontWeight: 'bold', textTransform: 'uppercase' }}>Objetivo</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>{clase.objetivo}</p>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Actividades</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>{clase.actividades}</p>
                    </div>
                  </div>
                </div>
              ))}
          </>
        )}
      </div>

    </div>
  );
}
