"use client";

import { useState, useEffect } from "react";
import { X, GraduationCap, Save, AlertCircle } from "lucide-react";
import { Student, Subject } from "@/types";

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

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || "");
        setDni(initialData.dni || (initialData as any).id || "");
        setAttendance(initialData.attendance || 100);
        setDuaTagsInput((initialData.duaContextTags || []).join(", "));
      } else {
        setName("");
        setDni("");
        setAttendance(100);
        setDuaTagsInput("");
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const safeName = (name || "").trim();
    const safeDni = (dni || "").trim();

    if (!safeName || !safeDni) return;
    
    const duaContextTags = duaTagsInput.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    
    if (onSave) {
      onSave({ 
        dni: safeDni, 
        name: safeName, 
        attendance: Number(attendance), 
        duaContextTags, 
      });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-brand-navy border border-white/10 rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                   Contexto DUA <span className="text-brand-orange text-[8px] italic">(IA Adaptativa)</span>
                </label>
                <input
                  type="text"
                  value={duaTagsInput}
                  onChange={(e) => setDuaTagsInput(e.target.value)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-700 focus:border-brand-orange outline-none transition-all shadow-inner"
                  placeholder="Ej: TDAH, Dislexia, Altas Capacidades"
                />
             </div>
          </div>

          <div className="p-6 bg-brand-orange/5 border border-brand-orange/10 rounded-3xl flex items-start gap-4">
             <AlertCircle className="text-brand-orange shrink-0 mt-1" size={20} />
             <div>
                <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
                   Las calificaciones se gestionan ahora desde el botón de <span className="text-white">engranaje ⚙️</span> en la lista de alumnos. 
                   Este panel es exclusivo para datos de perfil y configuración DUA.
                </p>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-10 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-5 bg-black/20 mt-auto">
          <button onClick={onClose} className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:text-white transition-all">Cancelar</button>
          <button 
            onClick={handleSave}
            disabled={!name.trim() || !dni.trim()}
            className="px-12 py-5 bg-white text-brand-navy rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-brand-orange hover:text-white hover:scale-105 active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-3"
          >
            <Save size={18} />
            {initialData ? "GRABAR CAMBIOS" : "Confirmar Ingreso"}
          </button>
        </div>

      </div>
    </div>
  );
}
