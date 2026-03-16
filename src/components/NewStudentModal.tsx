"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface NewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: {
    name: string;
    attendance: number;
    grades: number[];
    duaContextTags: string[];
  }) => void;
}

export function NewStudentModal({ isOpen, onClose, onSave }: NewStudentModalProps) {
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState(100);
  const [gradesInput, setGradesInput] = useState("");
  const [duaTagsInput, setDuaTagsInput] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const grades = gradesInput
      .split(",")
      .map((g) => parseFloat(g.trim()))
      .filter((g) => !isNaN(g));
      
    const duaContextTags = duaTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave({
      name: name.trim(),
      attendance: Number(attendance),
      grades,
      duaContextTags,
    });

    // Reset Form
    setName("");
    setAttendance(100);
    setGradesInput("");
    setDuaTagsInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h2 className="text-xl font-bold text-slate-800">Agregar Alumno</h2>
             <p className="text-sm text-slate-500">Ingresá los datos del nuevo estudiante.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
             <input
               type="text"
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
               placeholder="Ej: Juan Pérez"
             />
          </div>
          
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Asistencia (%)</label>
             <input
               type="number"
               min="0"
               max="100"
               value={attendance}
               onChange={(e) => setAttendance(Number(e.target.value))}
               className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Notas Iniciales (separadas por coma)</label>
             <input
               type="text"
               value={gradesInput}
               onChange={(e) => setGradesInput(e.target.value)}
               className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
               placeholder="Ej: 8, 9, 8.5"
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Contexto DUA (separado por coma)</label>
             <input
               type="text"
               value={duaTagsInput}
               onChange={(e) => setDuaTagsInput(e.target.value)}
               className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
               placeholder="Ej: TDAH, Dislexia"
             />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
           onClick={onClose}
           className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button 
           onClick={handleSave}
           disabled={!name.trim()}
           className="px-6 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            Guardar Alumno
          </button>
        </div>

      </div>
    </div>
  );
}
