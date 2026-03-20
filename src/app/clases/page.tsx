"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Classroom, Student, User } from '@/types';
import { getSubjectName } from "@/constants/subjects";
import { NewClassModal } from '@/components/NewClassModal';
import { StudentModal } from '@/components/StudentModal';
import { EditarAlumno } from '@/components/EditarAlumno';
import { 
  Users, UserPlus, FileEdit, CheckCircle2, AlertCircle, 
  BookOpen, Trash2, UserPlus2, FileDown, UserCog, ChevronDown,
  ClipboardList, Plus, FileText
} from 'lucide-react';
import { GradeHistoryModal } from '@/components/GradeHistoryModal';
import { GradesManagerModal } from '@/components/GradesManagerModal';

export default function ClasesPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedYearFilter, setSelectedYearFilter] = useState<number | 'Todos'>(new Date().getFullYear());
  
  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  
  // BUG 2 & 4: Rebuilt Edit Flow (v4.1.4)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [alumnoAEditar, setAlumnoAEditar] = useState<Student | null>(null);
  
  // Grade History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);

  // Grades Manager Modal State
  const [isGradesManagerOpen, setIsGradesManagerOpen] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<Student | null>(null);

  // Loading state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClassrooms = async () => {
    try {
      const res = await fetch('/api/classrooms');
      const data = await res.json();
      setClassrooms(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch classrooms", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        setUser(meData.user);
        await fetchClassrooms();
      } catch (err) {
        console.error("Initialization failed", err);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const availableYears = Array.from(new Set(classrooms.map(c => c.year || new Date().getFullYear()))).sort((a, b) => b - a);
  const filteredClassrooms = classrooms.filter(c => selectedYearFilter === 'Todos' || (c.year || new Date().getFullYear()) === selectedYearFilter);

  const selectedClass = classrooms.find(c => c.id === selectedClassId) || filteredClassrooms[0];

  const handleSaveClass = async (classData: Classroom) => {
    try {
      if (editingClass) {
        await fetch(`/api/classrooms/${classData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(classData),
        });
      } else {
        await fetch('/api/classrooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(classData),
        });
        setSelectedClassId(classData.id);
      }
      await fetchClassrooms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar esta clase y todos sus alumnos?")) return;
    try {
      await fetch(`/api/classrooms/${id}`, { method: 'DELETE' });
      const nextClasses = classrooms.filter(c => c.id !== id);
      if (selectedClassId === id && nextClasses.length > 0) {
        setSelectedClassId(nextClasses[0].id);
      } else if (nextClasses.length === 0) {
        setSelectedClassId(null);
      }
      await fetchClassrooms();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditClassModal = () => {
    if (selectedClass) {
      setEditingClass(selectedClass);
      setIsClassModalOpen(true);
    }
  };

  const openNewClassModal = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleSaveStudent = async (studentData: Partial<Student>) => {
    if (!selectedClassId) return;
    setIsLoading(true);
    try {
      const payload = {
        classroomId: selectedClassId,
        userId: user?.id,
        ...studentData
      };

      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      await fetchClassrooms();
      setIsStudentModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditarAlumno = (alumno: Student) => {
    if (!alumno || !alumno.dni) {
      console.error('Alumno inválido:', alumno);
      return;
    }
    setAlumnoAEditar(alumno);
    setModalEditarAbierto(true);
  };

  const openHistoryModal = async (student: Student) => {
    // BUG 1 Fix: Fetch real-time grades from DB before opening modal
    setIsLoading(true);
    try {
      const dni = student.dni || (student as any).id;
      const res = await fetch(`/api/notas?dni=${dni}&classroomId=${selectedClassId}`);
      if (!res.ok) throw new Error("Error al obtener notas");
      const grades = await res.json();
      
      // Update the student object with the latest grades
      setSelectedStudentForHistory({
        ...student,
        detailedGrades: grades
      });
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error("Failed to load grades:", err);
      // Fallback: use whatever we have in memory
      setSelectedStudentForHistory(student);
      setIsHistoryModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const openGradesManager = (student: Student) => {
    setGradingStudent(student);
    setIsGradesManagerOpen(true);
  };

  const refreshTableData = async () => {
    await fetchClassrooms();
  };

  const openNewStudentModal = () => {
    setIsStudentModalOpen(true);
  };

  const handleDownloadClassReport = async () => {
    if (!selectedClass) return;
    setIsLoading(true);
    
    try {
      // BUG 3 Fix: Pre-fetch ALL notes for all students in the class
      const studentsWithGrades = await Promise.all(
        selectedClass.students.map(async (s) => {
          const dni = s.dni || (s as any).id;
          const res = await fetch(`/api/notas?dni=${dni}&classroomId=${selectedClassId}`);
          const grades = res.ok ? await res.json() : [];
          return { ...s, detailedGrades: grades };
        })
      );

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const html = `
        <html>
          <head>
            <title>Informe Pedagógico - ${selectedClass.name}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; color: #1e293b; line-height: 1.6; }
              h1 { color: #f97316; font-family: 'Montserrat', sans-serif; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; font-size: 28px; letter-spacing: -0.02em; }
              .header-info { margin-bottom: 40px; border-bottom: 4px solid #f97316; padding-bottom: 20px; }
              .class-meta { color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; }
              
              .student-card { margin-bottom: 40px; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; page-break-inside: avoid; }
              .student-header { background: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
              .student-name { font-family: 'Montserrat', sans-serif; font-weight: 900; color: #0f172a; font-size: 18px; text-transform: uppercase; }
              .student-dni { color: #f97316; font-weight: 800; font-size: 12px; }
              
              .content-section { padding: 20px; }
              .subject-group { margin-bottom: 25px; }
              .subject-title { font-weight: 900; text-transform: uppercase; font-size: 12px; color: #64748b; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; }
              .subject-avg { color: #f97316; }
              
              .grade-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; color: #475569; }
              .grade-topic { font-weight: 600; }
              .grade-score { font-weight: 800; color: #0f172a; }
              
              .dua-tags { margin-top: 15px; display: flex; gap: 5px; flex-wrap: wrap; }
              .tag { background: #fff7ed; color: #c2410c; padding: 4px 10px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase; border: 1px solid #ffedd5; }
              
              .general-avg-box { background: #0f172a; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
              .general-avg-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; }
              .general-avg-value { font-size: 20px; font-weight: 900; }
              
              .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em; }
            </style>
          </head>
          <body>
            <div class="header-info">
              <h1>Aula Pro</h1>
              <div class="class-meta">Informe Pedagógico de Clase | ${selectedClass.name} | Ciclo ${selectedClass.year}</div>
            </div>

            ${studentsWithGrades.map(s => {
              const gradesBySubject: Record<string, any[]> = {};
              const detailed = s.detailedGrades || [];
              
              detailed.forEach((g: any) => {
                // BUG 3 Fix: Use the correct 'materia' field from Supabase
                const sName = g.materia || "Materia Desconocida";
                if (!gradesBySubject[sName]) gradesBySubject[sName] = [];
                gradesBySubject[sName].push(g);
              });

              const genAvg = detailed.length 
                ? (detailed.reduce((a: number, b: any) => a + (Number(b.nota) || b.score || 0), 0) / detailed.length).toFixed(1)
                : "0.0";

              return `
                <div class="student-card">
                  <div class="student-header">
                    <div class="student-name">${s.name}</div>
                    <div class="student-dni">DNI: ${s.dni || (s as any).id || "S/D"}</div>
                  </div>
                  
                  <div class="content-section">
                    ${Object.entries(gradesBySubject).map(([sub, gs]: [string, any[]]) => {
                      const subAvg = (gs.reduce((a: number, b: any) => a + (Number(b.nota) || b.score || 0), 0) / gs.length).toFixed(1);
                      return `
                        <div class="subject-group">
                          <div class="subject-title">
                            <span>📚 ${sub}</span>
                            <span class="subject-avg">Promedio: ${subAvg}</span>
                          </div>
                          ${gs.map((g: any) => `
                            <div class="grade-item">
                              <span class="grade-topic">${g.evaluacion || 'Evaluación'} <span style="font-size: 9px; opacity: 0.5; font-weight: normal;">(${new Date(g.fecha || g.date).toLocaleDateString()})</span></span>
                              <span class="grade-score">${g.nota ?? (g.score || '—')}</span>
                            </div>
                          `).join('')}
                        </div>
                      `;
                    }).join('')}

                    ${Object.keys(gradesBySubject).length === 0 ? '<p style="color: #94a3b8; font-size: 12px; font-style: italic;">Sin notas registradas aún.</p>' : ''}

                    <div class="dua-tags">
                      ${(s.duaContextTags || []).map(t => `<span class="tag">${t}</span>`).join('')}
                    </div>
                  </div>

                  <div class="general-avg-box">
                    <span class="general-avg-label">Promedio General</span>
                    <span class="general-avg-value">${genAvg}</span>
                  </div>
                </div>
              `;
            }).join('')}

            <div class="footer">Generado por Aula Pro v4.1.3 • ${new Date().toLocaleDateString()}</div>
            <script>window.print();</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Error al generar el PDF. Verifica la conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!selectedClassId) return;
    if (!confirm("¿Eliminar este alumno de la clase?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}?classroomId=${selectedClassId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Error al eliminar alumno");
      await fetchClassrooms();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el alumno.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-slate-500 space-y-6">
        <div className="w-16 h-16 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
        <p className="font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Cargando tus clases...</p>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-7xl mx-auto pb-20 relative animate-in fade-in duration-700">
      {/* Visible Version Marker to help diagnose cache issues */}
      <div className="fixed top-2 right-2 z-[9999] px-3 py-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-[8px] font-black uppercase tracking-widest text-white/40 pointer-events-none">
        PRODUCTION BUILD v4.1.4 • PANEL STABLE
      </div>
      
      <NewClassModal 
        isOpen={isClassModalOpen} 
        onClose={() => setIsClassModalOpen(false)} 
        onSave={handleSaveClass}
        initialData={editingClass}
        userId={user?.id || ''}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        onCerrar={() => setIsStudentModalOpen(false)}
        onGuardar={handleSaveStudent}
        subjects={selectedClass?.subjects || []}
      />

      {modalEditarAbierto && alumnoAEditar && (
        <EditarAlumno
          alumno={alumnoAEditar}
          userId={user?.id || ''}
          classroomId={selectedClassId || ''}
          onCerrar={() => {
            setModalEditarAbierto(false);
            setAlumnoAEditar(null);
          }}
          onGuardado={() => {
            setModalEditarAbierto(false);
            setAlumnoAEditar(null);
            fetchClassrooms();
          }}
        />
      )}

      <GradeHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        student={selectedStudentForHistory}
        subjects={selectedClass?.subjects || []}
      />

      <GradesManagerModal
        isOpen={isGradesManagerOpen}
        onClose={() => setIsGradesManagerOpen(false)}
        student={gradingStudent}
        classroomId={selectedClassId || ""}
        subjects={selectedClass?.subjects || []}
        onUpdate={refreshTableData}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
           <h1 className="text-4xl font-black text-white mb-2 font-montserrat tracking-tight">Mis Clases</h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Gestioná las notas y seguimiento DUA de tus alumnos.</p>
        </div>
        <button 
          onClick={openNewClassModal}
          className="flex items-center justify-center gap-3 bg-brand-orange text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-2xl shadow-brand-orange/20 group w-full md:w-auto"
        >
           <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
           Crear Nueva Clase
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Panel Lateral: Lista de Aulas */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6 max-h-[300px] lg:max-h-none overflow-y-auto lg:overflow-visible custom-scrollbar">
          <div className="bg-brand-navy rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
             <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aulas Activas</h2>
                <div className="relative">
                   <select 
                     value={selectedYearFilter} 
                     onChange={(e) => setSelectedYearFilter(e.target.value === 'Todos' ? 'Todos' : Number(e.target.value))}
                     className="bg-black/20 text-[9px] font-black uppercase tracking-widest text-slate-400 py-2 px-4 rounded-xl border border-white/10 outline-none hover:border-brand-orange transition-all appearance-none pr-8"
                   >
                     <option value="Todos">Todos</option>
                     {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                   <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                </div>
             </div>
             
             <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {filteredClassrooms.length === 0 ? (
                   <p className="text-center py-10 text-[10px] uppercase font-black text-slate-700">Sin aulas en este ciclo</p>
                ) : (
                   filteredClassrooms.map(classroom => (
                      <button
                        key={classroom.id}
                        onClick={() => setSelectedClassId(classroom.id)}
                        className={`w-full flex items-center gap-4 p-5 rounded-[1.8rem] transition-all text-left border ${
                           selectedClassId === classroom.id 
                             ? 'bg-brand-orange border-brand-orange shadow-xl shadow-brand-orange/20 scale-[1.02] text-white' 
                             : 'bg-white/5 border-transparent hover:border-white/10 text-slate-500'
                        }`}
                      >
                         <div className={`w-10 h-10 rounded-xl flex shrink-0 items-center justify-center ${selectedClassId === classroom.id ? 'bg-white/20' : 'bg-black/20'}`}>
                            <Users size={18} />
                         </div>
                         <div className="min-w-0">
                            <p className="font-black text-sm tracking-tight truncate uppercase">{classroom.name}</p>
                            <div className="flex flex-col gap-0.5 mt-1">
                               <p className={`text-[9px] font-black uppercase tracking-widest ${selectedClassId === classroom.id ? 'text-white/70' : 'text-slate-600'}`}>{classroom.grade}</p>
                               {classroom.description && (
                                 <p className={`text-[8px] font-bold truncate ${selectedClassId === classroom.id ? 'text-white/50' : 'text-slate-500 italic'}`}>{classroom.description}</p>
                               )}
                            </div>
                         </div>
                      </button>
                   ))
                )}
             </div>
          </div>
        </div>

        {/* Panel Principal: Detalle y Alumnos */}
        <div className="flex-1 w-full bg-brand-navy rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
           {selectedClass ? (
             <div className="flex flex-col flex-1">
                {/* Header Classroom */}
                <div className="p-6 md:p-12 border-b border-white/5 bg-white/5 flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="flex-1">
                       <div className="flex flex-col mb-4">
                         <div className="flex items-center gap-4 mb-2">
                           <span className="bg-brand-orange text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-orange/20">Ciclo {selectedClass.year}</span>
                           <h2 className="text-3xl font-black text-white font-montserrat tracking-tight">{selectedClass.name}</h2>
                         </div>
                         {selectedClass.description && (
                           <p className="text-brand-peach font-bold text-sm tracking-wide uppercase italic ml-1 opacity-80">{selectedClass.description}</p>
                         )}
                       </div>
                      <div className="flex flex-wrap gap-2">
                         {selectedClass.subjects?.map(subject => (
                           <span key={subject.id} className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                              <BookOpen size={12} className="text-brand-orange" />
                              {subject.name}
                           </span>
                         ))}
                      </div>
                   </div>

                   <div className="flex gap-3 shrink-0">
                      <button 
                        onClick={handleDownloadClassReport}
                        className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-navy transition-all shadow-xl"
                      >
                         <FileDown size={18} />
                         PDF
                      </button>
                      <button 
                        onClick={openEditClassModal}
                        className="p-4 bg-white/5 text-slate-500 hover:text-white hover:bg-brand-orange rounded-2xl transition-all border border-white/10"
                      >
                         <FileEdit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClass(selectedClass.id)}
                        className="p-4 bg-white/5 text-slate-500 hover:text-white hover:bg-red-600 rounded-2xl transition-all border border-white/10"
                      >
                         <Trash2 size={18} />
                      </button>
                   </div>
                </div>

                {/* Toolbar Estudiantes */}
                <div className="px-8 md:p-10 py-6 flex justify-between items-center bg-black/10 border-b border-white/5">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Panel de Estudiantes</h3>
                   <button 
                     onClick={openNewStudentModal}
                     className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-white transition-all bg-brand-orange/10 hover:bg-brand-orange px-6 py-3 rounded-[1.2rem] border border-brand-orange/20"
                   >
                      <UserPlus2 size={16} />
                      Agregar Alumno
                   </button>
                </div>

                {/* Grid / Lista de Alumnos */}
                <div className="flex-1 table-responsive-container">
                   {!selectedClass.students || selectedClass.students.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-20">
                         <div className="w-24 h-24 bg-white/5 rounded-[3rem] flex items-center justify-center">
                            <Users size={48} />
                         </div>
                         <p className="font-black uppercase tracking-[0.3em] text-[11px] leading-loose">No hay alumnos registrados <br/> en esta clase aún.</p>
                      </div>
                   ) : (
                      <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                               <tr className="bg-white/2 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5">
                                  <th className="p-8">Alumno</th>
                                  <th className="p-8">Promedio</th>
                                  <th className="p-8">Seguimiento DUA</th>
                                  <th className="p-8 w-24">Acciones</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                               {selectedClass.students.map(student => (
                                  <tr key={student.dni || (student as any).id} className="hover:bg-white/2 transition-colors group">
                                     <td className="p-8">
                                        <div className="flex items-center gap-5">
                                           <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-slate-400 font-black shrink-0">
                                              {(student.name || "?").charAt(0)}
                                           </div>
                                           <div className="flex flex-col">
                                              <span className="font-black text-white tracking-tight">{student.name}</span>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                  {student.detailedGrades && student.detailedGrades.slice(0, 3).map((grade, idx) => {
                                                     const rawId = (grade.subject_id || grade.subjectId || "").toString();
                                                     const subject = selectedClass.subjects.find(s => 
                                                       (s.id && String(s.id) === rawId) || 
                                                       (s.name && String(s.name).toLowerCase() === rawId.toLowerCase())
                                                     );
                                                     const subjectName = subject?.name || getSubjectName(rawId);
                                                     let displayName = subjectName.substring(0, 4);
                                                     if (!displayName || displayName.trim() === '') displayName = 'MAT';
                                                     
                                                     return (
                                                        <span key={idx} className="text-[8px] bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase">
                                                           {displayName}: {grade.score}
                                                        </span>
                                                     );
                                                  })}
                                                 {student.detailedGrades && student.detailedGrades.length > 3 && (
                                                     <span className="text-[8px] text-brand-orange font-black">+{student.detailedGrades.length - 3}</span>
                                                 )}
                                              </div>
                                           </div>
                                        </div>
                                     </td>
                                      <td className="p-8">
                                         <span className="font-black text-slate-400">
                                            {student.detailedGrades?.length ? 
                                              (student.detailedGrades.reduce((a, b) => a + b.score, 0) / student.detailedGrades.length).toFixed(1) : 
                                              (student.grades?.length ? (student.grades.reduce((a, b) => a + b, 0) / student.grades.length).toFixed(1) : '---')
                                            }
                                         </span>
                                      </td>
                                      <td className="p-8">
                                        <div className="flex gap-2 flex-wrap max-w-xs">
                                           {student.duaContextTags?.length ? (
                                              student.duaContextTags.map(tag => (
                                                 <span key={tag} className="px-3 py-1 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-lg text-[9px] font-black uppercase tracking-widest">{tag}</span>
                                              ))
                                           ) : <span className="text-[9px] font-bold text-slate-700 uppercase italic">Sin tags</span>}
                                        </div>
                                     </td>
                                      <td className="p-8">
                                         <div className="flex gap-2 transition-all">
                                            <button 
                                              onClick={() => openHistoryModal(student)} 
                                              className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl hover:scale-105 transition-all shadow-lg text-[10px] font-black uppercase tracking-widest"
                                            >
                                               <ClipboardList size={14} />
                                               Ver Notas
                                            </button>
                                            <button 
                                              onClick={() => openGradesManager(student)} 
                                              className="p-3 bg-white/5 text-brand-orange hover:text-white hover:bg-brand-orange rounded-xl border border-white/10 transition-all shadow-md active:scale-95"
                                              title="Gestionar Notas (Gear)"
                                            >
                                               <div className="relative">
                                                  <UserCog size={16} />
                                                  <Plus size={8} className="absolute -top-1 -right-1 font-black" />
                                               </div>
                                            </button>
                                            <button onClick={() => handleEditarAlumno(student)} className="p-3 bg-white/5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-xl border border-white/10 transition-all" title="Editar Perfil"><FileText size={16} /></button>
                                            <button onClick={() => handleDeleteStudent(student.dni || (student as any).id)} className="p-3 bg-white/5 text-slate-500 hover:text-white hover:bg-red-600 rounded-xl border border-white/10 transition-all"><Trash2 size={16} /></button>
                                         </div>
                                      </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   )}
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20 text-center space-y-8">
                <div className="w-32 h-32 bg-white/5 rounded-[4rem] flex items-center justify-center border border-white/5 shadow-inner">
                   <Users size={64} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white font-montserrat tracking-tight mb-2 uppercase">Sin Aula Seleccionada</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Seleccioná una clase del panel lateral para <br/> comenzar con el seguimiento.</p>
                </div>
             </div>
           )}
            <div className="mt-8 pt-8 border-t border-white/5 opacity-10 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
               <span>Aula Pro v4.1.4 - Panel Stable</span>
               <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
