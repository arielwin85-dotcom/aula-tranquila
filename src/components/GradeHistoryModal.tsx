"use client";

import { X, Calendar as CalendarIcon, BookOpen, GraduationCap } from "lucide-react";
import { Student, Subject } from "@/types";

interface GradeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  subjects: Subject[];
}

export function GradeHistoryModal({ isOpen, onClose, student, subjects }: GradeHistoryModalProps) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-brand-navy border border-white/10 rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 flex items-center justify-center text-brand-orange">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white font-montserrat tracking-tight">
                Historial Académico
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
                Registros detallados de {student.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 text-slate-500 hover:text-white rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Legend / Stats */}
        <div className="px-10 py-4 bg-white/2 border-b border-white/5 flex gap-8">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Total Notas:</span>
            <span className="text-xs font-black text-white">{student.detailedGrades?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Promedio Actual:</span>
            <span className="text-xs font-black text-brand-orange">
              {student.detailedGrades?.length
                ? (student.detailedGrades.reduce((a, b) => a + b.score, 0) / student.detailedGrades.length).toFixed(1)
                : "---"}
            </span>
          </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {!student.detailedGrades?.length ? (
            <div className="h-60 flex flex-col items-center justify-center space-y-4 opacity-30">
              <BookOpen size={48} className="text-slate-500" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Sin registros históricos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {/* Header Grid (Hidden on mobile) */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 mb-2">
                <div className="col-span-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Fecha</div>
                <div className="col-span-3 text-[9px] font-black text-slate-600 uppercase tracking-widest">Materia</div>
                <div className="col-span-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">Tema / Evaluación</div>
                <div className="col-span-1 text-[9px] font-black text-slate-600 uppercase tracking-widest text-right">Nota</div>
              </div>

              {student.detailedGrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((grade, idx) => {
                const rawId = (grade.subject_id || grade.subjectId || '').toString();
                const subject = subjects.find(s =>
                  (s.id && String(s.id).toLowerCase() === rawId.toLowerCase()) ||
                  (s.name && String(s.name).toLowerCase() === rawId.toLowerCase())
                );
                const subjectName = subject?.name || rawId || "SIN MATERIA";
                return (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-brand-orange/30 transition-all hover:bg-brand-orange/[0.02]">
                    <div className="col-span-2 flex items-center gap-2">
                      <CalendarIcon size={12} className="text-slate-500" />
                      <span className="text-[10px] font-black text-slate-400">{new Date(grade.date).toLocaleDateString()}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="px-3 py-1 bg-white/5 rounded-xl text-[9px] font-black text-brand-orange uppercase tracking-widest border border-white/5">
                        {subject?.name || "Materia"}
                      </span>
                    </div>
                    <div className="col-span-6">
                      <p className="text-sm font-bold text-white tracking-tight leading-relaxed">{grade.topic}</p>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className={`text-xl font-black ${grade.score >= 7 ? 'text-emerald-400' : grade.score >= 4 ? 'text-brand-orange' : 'text-rose-500'}`}>
                        {grade.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-white/5 bg-black/20 text-center">
          <button
            onClick={onClose}
            className="px-10 py-4 bg-white/5 text-slate-400 hover:text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
          >
            Cerrar Historial
          </button>
        </div>

      </div>
    </div>
  );
}
