"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, BookOpen, Calendar as CalendarIcon, Calculator, ChevronRight, GraduationCap } from "lucide-react";
import { Subject } from "@/types";

interface Nota {
  id: string;
  alumno_dni: string;
  clase_id: string;
  materia: string;
  evaluacion: string;
  nota: number;
  fecha: string;
}

interface GradesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: { dni: string; name: string } | null;
  classroomId: string;
  subjects: Subject[];
  onUpdate?: () => void; // Call after adding/deleting to refresh main panel
}

export function GradesManagerModal({ isOpen, onClose, student, classroomId, subjects, onUpdate }: GradesManagerModalProps) {
  const [history, setHistory] = useState<Nota[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newNota, setNewNota] = useState({
    materia: subjects[0]?.name || "",
    evaluacion: "",
    nota: 10,
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen && student) {
      fetchHistory();
      if (subjects.length > 0 && !newNota.materia) {
          setNewNota(prev => ({ ...prev, materia: subjects[0].name }));
      }
    }
  }, [isOpen, student, subjects]);

  const fetchHistory = async () => {
    if (!student) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notas?dni=${student.dni}&classroomId=${classroomId}`);
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error("Failed to fetch history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNota = async () => {
    if (!newNota.materia || !newNota.evaluacion || !student) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newNota,
          alumno_dni: student.dni,
          clase_id: classroomId
        }),
      });
      
      if (res.ok) {
        setNewNota({ ...newNota, evaluacion: "", nota: 10 });
        await fetchHistory();
        if (onUpdate) onUpdate();
      }
    } catch (e) {
      console.error("Failed to add nota:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNota = async (id: string) => {
    if (!confirm("¿Eliminar esta nota?")) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notas/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchHistory();
        if (onUpdate) onUpdate();
      }
    } catch (e) {
      console.error("Failed to delete nota:", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  // Grouping logic
  const grouped = history.reduce((acc: Record<string, Nota[]>, nota) => {
    if (!acc[nota.materia]) acc[nota.materia] = [];
    acc[nota.materia].push(nota);
    return acc;
  }, {});

  const generalAverage = history.length 
    ? (history.reduce((a, b) => a + Number(b.nota), 0) / history.length).toFixed(1)
    : "---";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-brand-navy border border-white/10 rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange border border-brand-orange/20">
                <GraduationCap size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-white font-montserrat tracking-tight uppercase">Gestión de Notas</h2>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
                   Alumno: <span className="text-white">{student.name}</span> | DNI: <span className="text-white">{student.dni}</span>
                </p>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 text-slate-500 hover:text-white rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Action Bar (Add Nota) */}
        <div className="bg-white/2 border-b border-white/5 p-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-1 space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Materia</label>
                 <select 
                   value={newNota.materia}
                   onChange={(e) => setNewNota({...newNota, materia: e.target.value})}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-orange transition-all font-bold"
                 >
                    {subjects.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                 </select>
              </div>
              <div className="md:col-span-1 space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Evaluación</label>
                 <input 
                   type="text"
                   placeholder="Ej: Prueba 1"
                   value={newNota.evaluacion}
                   onChange={(e) => setNewNota({...newNota, evaluacion: e.target.value})}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-orange transition-all font-bold"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nota</label>
                 <input 
                   type="number"
                   min="1" max="10" step="0.5"
                   value={newNota.nota}
                   onChange={(e) => setNewNota({...newNota, nota: Number(e.target.value)})}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-orange transition-all font-black text-center"
                 />
              </div>
              <button 
                onClick={handleAddNota}
                disabled={isLoading || !newNota.evaluacion}
                className="bg-brand-orange text-white h-[46px] rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-30"
              >
                 <Plus size={16} /> Agregar
              </button>
           </div>
        </div>

        {/* Body (History) */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-black/20">
           {isLoading && history.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cargando historial...</p>
             </div>
           ) : history.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-20 opacity-20 text-center space-y-6">
                <Calculator size={48} />
                <p className="font-black text-[10px] uppercase tracking-widest">No hay notas registradas para este alumno.</p>
             </div>
           ) : (
             Object.entries(grouped).map(([materia, notas]) => {
                const subAverage = (notas.reduce((a, b) => a + Number(b.nota), 0) / notas.length).toFixed(1);
                return (
                  <div key={materia} className="space-y-4">
                     <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-3">
                           <BookOpen size={14} className="text-brand-orange" />
                           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{materia}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-600 uppercase">Promedio:</span>
                           <span className={`text-sm font-black ${Number(subAverage) >= 7 ? 'text-emerald-400' : Number(subAverage) >= 4 ? 'text-brand-orange' : 'text-rose-500'}`}>
                              {subAverage}
                           </span>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 gap-2">
                        {notas.map(nota => (
                          <div key={nota.id} className="group flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-2xl hover:border-brand-orange/30 transition-all hover:bg-white/[0.07]">
                             <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 opacity-40">
                                   <CalendarIcon size={12} />
                                   <span className="text-[9px] font-black">{new Date(nota.fecha).toLocaleDateString()}</span>
                                </div>
                                <span className="text-sm font-bold text-white tracking-tight">{nota.evaluacion}</span>
                             </div>
                             <div className="flex items-center gap-6">
                                <span className={`text-lg font-black ${Number(nota.nota) >= 7 ? 'text-emerald-400' : Number(nota.nota) >= 4 ? 'text-brand-orange' : 'text-rose-500'}`}>
                                   {nota.nota}
                                </span>
                                <button 
                                  onClick={() => handleDeleteNota(nota.id)}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-500 transition-all"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                );
             })
           )}
        </div>

        {/* Footer (General Average) */}
        <div className="p-8 bg-white/5 border-t border-white/10 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <Calculator size={20} className="text-brand-orange" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio General del Alumno</span>
           </div>
           <div className="flex items-center gap-4">
              <span className={`text-4xl font-black ${Number(generalAverage) >= 7 ? 'text-emerald-400' : Number(generalAverage) >= 4 ? 'text-brand-orange' : 'text-rose-500'}`}>
                 {generalAverage}
              </span>
           </div>
        </div>

      </div>
    </div>
  );
}
