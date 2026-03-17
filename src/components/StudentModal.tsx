"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, GraduationCap, Calendar as CalendarIcon, BookOpen, Sparkles, CheckCircle2, Save, AlertCircle } from "lucide-react";
import { Student, Subject, GradeEntry } from "@/types";
import { getSubjectName } from "@/constants/subjects";

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Partial<Student>) => void;
  initialData?: Student | null;
  subjects: Subject[];
}

export function StudentModal({ isOpen, onClose, onSave, initialData, subjects }: StudentModalProps) {
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [attendance, setAttendance] = useState(100);
  const [duaTagsInput, setDuaTagsInput] = useState("");
  const [detailedGrades, setDetailedGrades] = useState<GradeEntry[]>([]);
  
  const [newGrade, setNewGrade] = useState({
    subjectId: subjects[0]?.id || "",
    topic: "",
    score: 10,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Determine default subject
    const defaultSubjectId = subjects[0]?.id || subjects[0]?.name || "";
    
    if (initialData) {
      setName(initialData.name || "");
      setDni(initialData.dni || (initialData as any).id || "");
      setAttendance(initialData.attendance || 100);
      setDuaTagsInput((initialData.duaContextTags || []).join(", "));
      setDetailedGrades(initialData.detailedGrades || []);
    } else {
      setName("");
      setDni("");
      setAttendance(100);
      setDuaTagsInput("");
      setDetailedGrades([]);
    }
    
    // Reset form for NEW grade
    setNewGrade({
      subjectId: defaultSubjectId,
      topic: "",
      score: 10,
      date: new Date().toISOString().split('T')[0]
    });
  }, [initialData, isOpen, subjects]);

  if (!isOpen) return null;

  const handleAddGrade = () => {
    if (!newGrade.topic || !newGrade.subjectId) return;
    
    // Check for exact duplicates (Subject + Topic + Date) - as requested by user
    const isDuplicate = (detailedGrades || []).some(g => 
      String(g.subjectId || g.subject_id) === String(newGrade.subjectId) &&
      (g.topic || "").toLowerCase().trim() === (newGrade.topic || "").toLowerCase().trim() &&
      g.date === newGrade.date
    );

    if (isDuplicate) {
      alert("Ya existe un registro con la misma materia, tema y fecha.");
      return;
    }

    const entry: GradeEntry = { 
      id: `grade-${Date.now()}`, 
      studentDni: dni || "",
      ...newGrade 
    };
    setDetailedGrades([...detailedGrades, entry]);
    setNewGrade({ ...newGrade, topic: "", score: 10 });
  };

  const handleRemoveGrade = (id: string) => { setDetailedGrades(detailedGrades.filter(g => g.id !== id)); };

  const handleSave = () => {
    const safeName = (name || "").trim();
    const safeDni = (dni || "").trim();

    if (!safeName || !safeDni) return;
    
    // Auto-add if user filled the topic but forgot to click '+'
    let finalGrades = [...detailedGrades];
    if (newGrade.topic.trim() && newGrade.subjectId) {
       const autoEntry: GradeEntry = { 
         id: `grade-auto-${Date.now()}`, 
         studentDni: dni,
         ...newGrade,
         topic: newGrade.topic.trim()
       };
       finalGrades.push(autoEntry);
    }

    const duaContextTags = duaTagsInput.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    onSave({ 
      dni: safeDni, 
      name: safeName, 
      attendance: Number(attendance), 
      detailedGrades: finalGrades, 
      duaContextTags, 
      grades: finalGrades.map(g => g.score) 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-brand-navy border border-white/10 rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
             <h2 className="text-2xl font-black text-white font-montserrat tracking-tight">
               {initialData ? "Perfil del Alumno" : "Nuevo Ingreso"}
             </h2>
             <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mt-2 italic shadow-sm">
               {initialData ? `Actualizando registro: ${initialData.name}` : "Carga de datos académicos y DUA"}
             </p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 text-slate-500 hover:text-white rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Alumno (DNI / ID Único)</label>
               <input
                 type="text"
                 value={dni}
                 onChange={(e) => setDni(e.target.value)}
                 disabled={!!initialData}
                 className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-700 focus:border-brand-orange outline-none transition-all disabled:opacity-50"
                 placeholder="Ej: 40555666"
               />
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
               <input
                 type="text"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-700 focus:border-brand-orange outline-none transition-all"
                 placeholder="Ej: Juan Pérez"
               />
            </div>
            
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asistencia (%)</label>
               <input
                 type="number"
                 min="0"
                 max="100"
                 value={attendance}
                 onChange={(e) => setAttendance(Number(e.target.value))}
                 className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-brand-orange focus:border-brand-orange outline-none transition-all"
               />
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                Contexto DUA <span className="text-brand-orange text-[8px] italic">(IA lo usará para adaptar copilot)</span>
             </label>
             <input
               type="text"
               value={duaTagsInput}
               onChange={(e) => setDuaTagsInput(e.target.value)}
               className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-700 focus:border-brand-orange outline-none transition-all shadow-inner"
               placeholder="Separar con comas: TDAH, Altas Capacidades, etc."
             />
          </div>

          {/* Grades Section */}
          <div className="bg-black/20 rounded-[2.5rem] border border-white/5 p-8 space-y-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
              <GraduationCap size={18} className="text-brand-orange" />
              Libreta de Calificaciones
            </h3>

            {/* Form */}
            <div className="flex flex-col space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1 text-xs">Materia</label>
                  <select 
                    value={newGrade.subjectId}
                    onChange={(e) => setNewGrade({...newGrade, subjectId: e.target.value})}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest outline-none appearance-none"
                  >
                    {subjects.map(s => <option key={s.id} value={s.id} className="bg-brand-navy">{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1 text-xs">Tema / Evaluación Educativa (Campo Amplio)</label>
                  <textarea 
                    placeholder="Ej: Examen integrador de Fracciones y Decimales"
                    value={newGrade.topic}
                    onChange={(e) => setNewGrade({...newGrade, topic: e.target.value})}
                    className="w-full p-5 bg-white/5 border border-brand-orange/30 rounded-2xl text-white text-base font-bold outline-none focus:border-brand-orange transition-all placeholder:text-slate-800 min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-end bg-black/30 p-6 rounded-3xl border border-white/5">
                <div className="col-span-12 sm:col-span-3 space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1 text-xs">Calificación</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="1" 
                    max="10" 
                    value={newGrade.score} 
                    onChange={(e) => setNewGrade({...newGrade, score: Number(e.target.value)})} 
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-brand-orange font-black text-center text-3xl shadow-inner" 
                    placeholder="10"
                  />
                </div>
                <div className="col-span-12 sm:col-span-5 space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1 text-xs">Fecha del Registro</label>
                  <input 
                    type="date" 
                    value={newGrade.date} 
                    onChange={(e) => setNewGrade({...newGrade, date: e.target.value})} 
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-black outline-none focus:border-brand-orange uppercase" 
                  />
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <button 
                    onClick={handleAddGrade}
                    className="w-full p-5 h-[72px] bg-brand-orange text-white rounded-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-orange/30 font-black uppercase tracking-widest text-xs"
                  >
                    <Plus size={20} />
                    Cargar
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {detailedGrades.length === 0 ? (
                <div className="text-center py-10 bg-white/5 rounded-[2rem] border border-dashed border-white/5">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sin registros disponibles</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                   {detailedGrades.map(grade => {
                    const rawId = String(grade.subject_id || grade.subjectId || '');
                    const subject = subjects.find(s => 
                      String(s.id) === rawId || 
                      (s.name && String(s.name).toLowerCase() === rawId.toLowerCase())
                    );
                    const subjectName = subject?.name || getSubjectName(rawId);
                    return (
                      <div key={grade.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="bg-brand-orange/10 text-brand-orange font-black px-3 py-1.5 rounded-xl text-xs shadow-inner">
                            {grade.score}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{subjectName}</span>
                              <span className="text-[8px] text-slate-600 font-black uppercase flex items-center gap-1 opacity-50"><CalendarIcon size={10} /> {new Date(grade.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm font-bold text-white tracking-tight">{grade.topic}</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveGrade(grade.id)} className="p-2 text-slate-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-5 bg-black/20 mt-auto">
          <button onClick={onClose} className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:text-white transition-all">Cancelar</button>
          <button 
            onClick={handleSave}
            disabled={!name.trim() || !dni.trim()}
            className="px-12 py-5 bg-white text-brand-navy rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-brand-peach hover:scale-105 active:scale-95 disabled:opacity-20 transition-all"
          >
            {initialData ? "GRABAR CAMBIOS" : "Confirmar Ingreso"}
          </button>
        </div>

      </div>
    </div>
  );
}
