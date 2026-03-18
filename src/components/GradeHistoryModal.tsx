"use client";

import { X, Calendar as CalendarIcon, BookOpen, GraduationCap, Calculator } from "lucide-react";
import { Student, Subject } from "@/types";
import { getSubjectName } from "@/constants/subjects";

interface GradeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  subjects: Subject[];
}

export function GradeHistoryModal({ isOpen, onClose, student, subjects }: GradeHistoryModalProps) {
  if (!isOpen || !student) return null;

  // Grouping logic
  const gradesBySubject: Record<string, any[]> = {};
  const detailedGrades = student.detailedGrades || [];

  detailedGrades.forEach(grade => {
    const rawId = (grade.subject_id || grade.subjectId || '').toString();
    const subject = subjects.find(s =>
      (s.id && String(s.id) === rawId) ||
      (s.name && String(s.name).toLowerCase() === rawId.toLowerCase())
    );
    const subjectName = subject?.name || getSubjectName(rawId);
    
    if (!gradesBySubject[subjectName]) {
      gradesBySubject[subjectName] = [];
    }
    gradesBySubject[subjectName].push(grade);
  });

  const generalAverage = detailedGrades.length
    ? (detailedGrades.reduce((a, b) => a + (b.score || 0), 0) / detailedGrades.length).toFixed(1)
    : "0.0";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-brand-navy border border-white/10 rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

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
                👤 Alumno: {student.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 text-slate-500 hover:text-white rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
          {Object.keys(gradesBySubject).length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center space-y-4 opacity-30">
              <BookOpen size={48} className="text-slate-500" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Sin registros históricos</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(gradesBySubject).map(([subjectName, grades]) => {
                const subjectAverage = (grades.reduce((a, b) => a + (b.score || 0), 0) / grades.length).toFixed(1);
                
                return (
                  <div key={subjectName} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-brand-orange/20 pb-4">
                       <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                          <BookOpen size={16} />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{subjectName}</h3>
                       </div>
                       <div className="bg-brand-orange/10 px-4 py-2 rounded-xl border border-brand-orange/20">
                         <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest mr-2">Promedio:</span>
                         <span className="text-sm font-black text-white">{subjectAverage}</span>
                       </div>
                    </div>

                    <div className="grid gap-3">
                      {grades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((grade, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/2 border border-white/5 p-4 rounded-2xl hover:bg-white/5 transition-all">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white tracking-tight">{grade.topic || 'Evaluación'}</span>
                            <div className="flex items-center gap-2 mt-1 opacity-50">
                              <CalendarIcon size={10} />
                              <span className="text-[9px] font-black uppercase tracking-widest">{new Date(grade.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span className={`text-lg font-black ${grade.score >= 7 ? 'text-emerald-400' : grade.score >= 4 ? 'text-brand-orange' : 'text-rose-500'}`}>
                            {grade.score} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Footer Stats */}
        <div className="px-10 py-8 border-t border-white/5 bg-black/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">General</span>
              <div className="flex items-center gap-2">
                <Calculator size={16} className="text-brand-orange" />
                <span className="text-2xl font-black text-white font-montserrat">Promedio: {generalAverage}</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/5 hidden md:block" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Notas</span>
              <span className="text-lg font-black text-slate-300">{detailedGrades.length}</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-full md:w-auto px-10 py-5 bg-brand-orange text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-brand-orange/20"
          >
            Cerrar Historial
          </button>
        </div>

      </div>
    </div>
  );
}
