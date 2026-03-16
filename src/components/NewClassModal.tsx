"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Classroom, Subject } from "@/types";

interface NewClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newClass: Classroom) => void;
  initialData?: Classroom | null;
}

const PRIMARY_GRADES = [
  "1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado", "7mo Grado",
];

const PRIMARY_SUBJECTS = [
  { id: "sub-mate", name: "Matemática" },
  { id: "sub-leng", name: "Prácticas del Lenguaje" },
  { id: "sub-nat", name: "Ciencias Naturales" },
  { id: "sub-soc", name: "Ciencias Sociales" },
  { id: "sub-ing", name: "Inglés" },
  { id: "sub-ef", name: "Educación Física" },
  { id: "sub-plast", name: "Educación Plástica" },
  { id: "sub-mus", name: "Educación Musical" },
];

export function NewClassModal({ isOpen, onClose, onSave, initialData }: NewClassModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGrade, setSelectedGrade] = useState<string>(initialData?.grade || "");
  const [selectedYear, setSelectedYear] = useState<number>(initialData?.year || new Date().getFullYear());
  const [selectedDescription, setSelectedDescription] = useState<string>(initialData?.description || "");
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>(initialData?.subjects || []);

  useEffect(() => {
    if (initialData) {
      setSelectedGrade(initialData.grade);
      setSelectedYear(initialData.year || new Date().getFullYear());
      setSelectedDescription(initialData.description || "");
      setSelectedSubjects(initialData.subjects || []);
      setStep(1);
    } else {
      setSelectedGrade("");
      setSelectedYear(new Date().getFullYear());
      setSelectedDescription("");
      setSelectedSubjects([]);
      setStep(1);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => { if (selectedGrade) setStep(2); };

  const toggleSubject = (subject: Subject) => {
    const exists = selectedSubjects.find((s) => s.id === subject.id);
    if (exists) {
      setSelectedSubjects(selectedSubjects.filter((s) => s.id !== subject.id));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleSave = () => {
    if (!selectedGrade || selectedSubjects.length === 0) return;
    const newClassroom: Classroom = {
      id: initialData?.id || `grado-${Date.now()}`,
      userId: initialData?.userId || "profe-1",
      name: `${selectedGrade} ${selectedYear}`, 
      grade: selectedGrade,
      year: selectedYear,
      description: selectedDescription,
      subjects: selectedSubjects,
      students: initialData?.students || [], 
    };
    onSave(newClassroom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-brand-navy border border-white/10 rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
             <h2 className="text-2xl font-black text-white font-montserrat tracking-tight">
               {initialData ? "Configurar Clase" : "Nueva Clase"}
             </h2>
             <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mt-2">
               {step === 1 ? "Paso 1: Identificación" : "Paso 2: Materias y Carga"}
             </p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 text-slate-500 hover:text-white rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Body Step 1 */}
        {step === 1 && (
          <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ciclo Lectivo</label>
                <input 
                  type="number" 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black focus:border-brand-orange outline-none transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Institución / Referencia</label>
                <input 
                  type="text" 
                  value={selectedDescription}
                  onChange={(e) => setSelectedDescription(e.target.value)}
                  placeholder="Ej: Colegio San Martín"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-700 focus:border-brand-orange outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seleccionar Nivel / Grado</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRIMARY_GRADES.map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedGrade === grade
                        ? "bg-brand-orange border-brand-orange text-white shadow-xl shadow-brand-orange/20 scale-105"
                        : "bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Body Step 2 */}
        {step === 2 && (
          <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
               Dictado de materias para <span className="text-brand-orange">{selectedGrade}</span>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRIMARY_SUBJECTS.map((subject) => {
                const isSelected = selectedSubjects.some(s => s.id === subject.id);
                return (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject)}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-brand-orange/10 border-brand-orange text-white"
                        : "bg-white/5 border-white/5 text-slate-500 hover:border-white/20"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{subject.name}</span>
                    {isSelected && <div className="w-5 h-5 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg"><Check size={12} /></div>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-10 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-5 bg-black/20">
          <button onClick={onClose} className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:text-white transition-all">Cancelar</button>
          
          <div className="flex gap-4">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="px-8 py-4 bg-white/5 text-slate-400 rounded-2xl border border-white/10 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white">Atrás</button>
            )}
            <button 
              onClick={step === 1 ? handleNext : handleSave}
              disabled={step === 1 ? !selectedGrade : selectedSubjects.length === 0}
              className="px-10 py-4 bg-brand-orange text-white font-black uppercase tracking-widest text-[11px] rounded-[1.2rem] shadow-xl shadow-brand-orange/20 hover:scale-105 active:scale-95 disabled:opacity-20 transition-all flex-1 sm:flex-none"
            >
              {step === 1 ? "Continuar" : (initialData ? "Actualizar" : "Crear Clase")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
