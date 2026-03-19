"use client";

import { useState } from 'react';
import Link from 'next/link';
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
  Loader2,
  Home,
  Users,
  FolderOpen
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
      id: 'inicio',
      title: '🏠 Inicio (Tu Tablero)',
      icon: Home,
      desc: 'El control central de tu día.',
      href: '/',
      content: '• Gestión Rápida: Hacé clic directo en los nombres de tus clases para entrar a gestionarlas.\n• Créditos: Arriba a la derecha ves cuánta "magia" (créditos de IA) te queda para el mes.\n• Navegación: Abajo tenés botones gigantes para ir a cualquier parte sin perderte.'
    },
    {
      id: 'clases',
      title: '👥 Mis Clases',
      icon: Users,
      desc: 'Tu libro de temas y alumnos.',
      href: '/clases',
      content: '1. Creá tu aula: Poné el nombre (ej: 4to A) y elegí las materias.\n2. Cargá alumnos: Usá el botón "+ Nuevo Alumno". Solo necesitás el nombre.\n3. Calificá: Hacé clic en un alumno para ponerle notas. Agregá el tema y la fecha para que el sistema calcule el promedio solo.\n4. Informes: Entrá a tu clase y dale a "Descargar PDF" para tener un resumen listo para entregar a dirección.'
    },
    {
      id: 'copiloto',
      title: '✦ Asistente Pedagógico',
      icon: MessageSquare,
      desc: 'Tu compañero para armar clases.',
      href: '/chat',
      content: '1. Seleccioná arriba: Elegí para qué grado y qué materia querés ayuda.\n2. Hablale: Escribí como si fuera un colega (ej: "Mañana quiero dar los volcanes, ¿qué puedo hacer?").\n3. Revisá: A la derecha te arma las clases completas con objetivos y actividades.\n4. Guardá e Imprimí: Al final dale al botón de la impresora para llevarlo al aula.'
    },
    {
      id: 'normativa',
      title: '📄 Planificación Normativa',
      icon: ScrollText,
      desc: 'Alineación con el diseño curricular.',
      href: '/normativa',
      content: '1. Subí tu ley: Cargá el PDF del Diseño Curricular de tu provincia/jurisdicción.\n2. Elegí el modo: Podés pedir la planificación de TODO EL AÑO o de UN MES específico.\n3. Memoria: Si ya hiciste Marzo, podés saltar a Junio y el sistema sabrá qué temas ya "deberían" haber visto los chicos.\n4. PDF con Índice: Generá un documento profesional con todos los contenidos organizados.'
    },
    {
      id: 'evidencias',
      title: '📸 Evidencias (Corrector)',
      icon: Camera,
      desc: 'Corrección con solo una foto.',
      href: '/evidencias',
      content: '1. Foto clara: Sacale una foto al examen o trabajo del alumno.\n2. Subí y esperá: El sistema lee la letra cursiva o imprenta del chico.\n3. Pedagógico: Te va a decir qué hizo bien, qué hizo mal y qué nota le corresponde según su progreso.'
    },
    {
      id: 'generador',
      title: '✨ Recursos Rápidos',
      icon: Sparkles,
      desc: 'Pruebas y actividades en un clic.',
      href: '/generador',
      content: '• ¿Necesitás una prueba rápido? Elegí "Evaluación", poné el tema y el grado. Te la redacta completa.\n• ¿Rúbricas? También las hace. Elegí el tipo de recurso y ¡listo para imprimir!'
    },
    {
      id: 'biblioteca',
      title: '📚 Mi Biblioteca',
      icon: FolderOpen,
      desc: 'Buscador de tus propios archivos.',
      href: '/biblioteca',
      content: '• Escribí qué buscás (ej: "Célula") y el sistema buscará en TUS archivos de Google Drive.\n• No pierdas tiempo abriendo carpetas; buscalo acá y abrilo directo.'
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
              <p className="text-slate-400 leading-relaxed font-bold text-sm whitespace-pre-line">
                {tab.content}
              </p>
              <Link href={tab.href} className="mt-8 flex items-center gap-2 text-brand-orange font-black text-[10px] uppercase tracking-widest cursor-pointer hover:underline transition-all group-hover:translate-x-1 decoration-2 underline-offset-4">
                Explorar módulo <ChevronRight size={14} />
              </Link>
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
