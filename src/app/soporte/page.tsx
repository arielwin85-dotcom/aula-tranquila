"use client";

import { useState } from 'react';
import { 
  LifeBuoy, 
  BookOpen, 
  MessageSquare, 
  ScrollText, 
  Camera, 
  Send, 
  Paperclip, 
  CheckCircle2, 
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  Loader2
} from 'lucide-react';

type TabType = 'tutorial' | 'ticket';

export default function SoportePage() {
  const [activeTab, setActiveTab] = useState<TabType>('tutorial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form State
  const [subject, setSubject] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('userEmail', email);
      formData.append('description', description);
      files.forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch('/api/soporte', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setSubmitted(true);
        setSubject('');
        setEmail('');
        setDescription('');
        setFiles([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tutorialTabs = [
    {
      id: 'clases',
      title: 'Mis Clases',
      icon: MessageSquare,
      desc: 'El centro de gestión de tus aulas y alumnos.',
      content: 'Acá organizás todas tus clases y alumnos en un solo lugar. Podés crear aulas por grado y año lectivo, agregar alumnos con su información pedagógica, registrar asistencia, cargar notas detalladas por tema y materia, y visualizar el promedio de cada estudiante. También podés etiquetar a los alumnos con contexto DUA (Diseño Universal para el Aprendizaje) y generar un informe PDF completo de cada clase con un solo clic.'
    },
    {
      id: 'copiloto',
      title: '✦ IA Pedagógica',
      icon: MessageSquare,
      desc: 'Tu asistente personal para el día a día.',
      content: 'La IA Pedagógica te ayuda a planificar tus clases de forma dinámica. Podés escribirle qué temas diste anteriormente y ella te sugerirá la siguiente secuencia lógica basada en los contenidos curriculares. Incluye un calendario semanal interactivo donde podés marcar feriados, editar temas y regenerar clases específicas en segundos.'
    },
    {
      id: 'normativa',
      title: 'Planificación Normativa',
      icon: ScrollText,
      desc: 'Alineación perfecta con los diseños curriculares.',
      content: 'Subí el diseño curricular de tu jurisdicción (PDF o texto). Nuestra IA analizará los contenidos obligatorios y generará un plan anual detallado, mes a mes, con objetivos de aprendizaje y ejemplos de actividades concretas que respetan estrictamente la ley educativa.'
    },
    {
      id: 'evidencias',
      title: 'Evidencias',
      icon: Camera,
      desc: 'Corrección inteligente de trabajos y exámenes.',
      content: 'Subí fotos de los exámenes realizados por tus alumnos. La IA reconocerá la escritura a mano, identificará aciertos y errores, y generará un informe pedagógico con fortalezas y áreas de mejora, sugiriendo incluso una calificación lista para registrar.'
    },
    {
      id: 'generador',
      title: 'Valuaciones y Contenidos Rápido',
      icon: Sparkles,
      desc: 'Evaluaciones y actividades en un clic.',
      content: '¿Necesitás una prueba de opción múltiple, una rúbrica o una secuencia didáctica urgente? Seleccioná la materia, el tema y el tipo de recurso. La IA redactará el documento completo listo para imprimir, adaptado al nivel y grado de tu clase.'
    }
  ];


  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white flex items-center gap-3 font-montserrat">
          <LifeBuoy className="text-brand-orange" size={40} />
          Centro de Soporte
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Estamos acá para ayudarte a potenciar tu labor docente.</p>
      </div>

      <div className="flex bg-white/5 p-1.5 rounded-[2rem] w-fit mb-10 border border-white/5">
        <button 
          onClick={() => { setActiveTab('tutorial'); setSubmitted(false); }}
          className={`px-8 py-3.5 rounded-[1.8rem] font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'tutorial' ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20' : 'text-slate-400 hover:text-white'}`}
        >
          <BookOpen size={18} />
          Cómo funciona
        </button>
        <button 
          onClick={() => { setActiveTab('ticket'); setSubmitted(false); }}
          className={`px-8 py-3.5 rounded-[1.8rem] font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'ticket' ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20' : 'text-slate-400 hover:text-white'}`}
        >
          <HelpCircle size={18} />
          Reportar Inconveniente
        </button>
      </div>

      {activeTab === 'tutorial' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {tutorialTabs.map((tab) => (
            <div key={tab.id} className="bg-brand-navy p-10 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-brand-orange/50 transition-all group">
              <div className="w-14 h-14 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-orange group-hover:text-white transition-all duration-300 shadow-inner">
                <tab.icon size={28} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 font-montserrat tracking-tight">{tab.title}</h3>
              <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-4">{tab.desc}</p>
              <p className="text-slate-400 leading-relaxed font-bold text-sm">
                {tab.content}
              </p>
              <div className="mt-8 flex items-center gap-2 text-white/40 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:text-brand-orange transition-all">
                Explorar módulo <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          {submitted ? (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-16 text-center shadow-2xl">
               <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20 animate-bounce-slow">
                  <CheckCircle2 size={48} />
               </div>
               <h2 className="text-3xl font-black text-white mb-4">¡Reporte Enviado!</h2>
               <p className="text-slate-400 font-bold mb-10 text-lg uppercase tracking-tight">
                  Gracias por tu feedback. El administrador revisará tu consulta y te contactará a <span className="text-emerald-400">{email}</span> si es necesario.
               </p>
               <button 
                 onClick={() => setSubmitted(false)}
                 className="px-10 py-5 bg-white text-brand-navy rounded-2xl font-black uppercase tracking-wider text-sm hover:bg-brand-peach transition-all shadow-xl"
               >
                  Enviar otro reporte
               </button>
            </div>
          ) : (
            <div className="bg-brand-navy rounded-[2.5rem] border border-white/5 shadow-2xl p-12">
               <div className="mb-10">
                  <h2 className="text-3xl font-black text-white mb-2 font-montserrat">Cargar Reporte</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Ayudanos a perfeccionar Aula Tranquila para todos los docentes.</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tu Email de contacto</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@docente.com"
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 focus:ring-8 focus:ring-brand-orange/5 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Asunto</label>
                    <input 
                      type="text" 
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ej: Inconveniente con el PDF de normativa"
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 focus:ring-8 focus:ring-brand-orange/5 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Descripción detallada</label>
                    <textarea 
                      required
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Contanos qué pasó o qué función te falta..."
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 focus:ring-8 focus:ring-brand-orange/5 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] p-12 text-center hover:bg-white/10 hover:border-brand-orange/50 transition-all cursor-pointer relative group">
                     <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                     />
                     <div className="w-16 h-16 bg-white/5 rounded-2xl shadow-inner text-slate-500 mx-auto mb-4 flex items-center justify-center group-hover:text-brand-orange transition-colors">
                        <Paperclip size={28} />
                     </div>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Adjuntar evidencia o archivos</p>
                     
                     {files.length > 0 && (
                       <div className="mt-6 flex flex-wrap gap-2 justify-center">
                          {files.map((file, i) => (
                            <span key={i} className="px-4 py-2 bg-brand-orange/20 text-brand-orange text-[10px] font-black rounded-xl uppercase tracking-widest border border-brand-orange/30">
                               {file.name}
                            </span>
                          ))}
                       </div>
                     )}
                  </div>

                  <div className="pt-6 flex items-center justify-end">
                     <button 
                        type="submit"
                        disabled={isSubmitting || !subject || !description || !email}
                        className="px-12 py-5 bg-brand-orange text-white rounded-[1.8rem] font-black uppercase tracking-wider text-sm flex items-center gap-3 shadow-2xl shadow-brand-orange/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50"
                     >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Enviar Reporte
                     </button>
                  </div>
               </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
