"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { Student } from "@/types";
import { supabase } from "@/lib/supabase";

interface EditarAlumnoProps {
  alumno: Student;
  onCerrar: () => void;
  onGuardado: () => void;
}

export function EditarAlumno({ alumno, onCerrar, onGuardado }: EditarAlumnoProps) {
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [duaTagsInput, setDuaTagsInput] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Cargando datos del alumno para editar:", alumno);
    setName(alumno.name || "");
    setDni(alumno.dni || "");
    const tags = Array.isArray(alumno.duaContextTags) ? alumno.duaContextTags : [];
    setDuaTagsInput(tags.join(", "));
  }, [alumno]);

  const handleGuardarCambios = async () => {
    // 1. Validar que el DNI existe
    if (!dni) {
      console.error('Error: DNI no encontrado en los datos locales');
      setError("Error interno: DNI no encontrado");
      return;
    }

    const safeName = (name || "").trim();
    if (!safeName) {
      setError("El nombre es obligatorio");
      return;
    }

    const dua_context_tags = (duaTagsInput || "")
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setGuardando(true);
    setError(null);

    // 2. Armar el objeto a actualizar SIN el DNI (no se modifica)
    const datosAActualizar = {
      name: safeName,              // ← Columna original en Supabase
      dua_context_tags: dua_context_tags // ← Columna original en Supabase
    };

    console.log("Intentando UPDATE en Supabase para DNI:", dni);
    console.log("Datos a enviar:", datosAActualizar);

    try {
      // 3. Hacer UPDATE en Supabase
      const { data, error: supabaseError } = await supabase
        .from('students')               // ← Tabla verificada
        .update(datosAActualizar)
        .eq('dni', dni)                 // ← PK verificada
        .select();                      // .select() para confirmar impacto

      if (supabaseError) {
        console.error('Error en el UPDATE de Supabase:', supabaseError);
        setError("Error al guardar: " + supabaseError.message);
        setGuardando(false);
        return;
      }

      if (!data || data.length === 0) {
        console.error('UPDATE no impactó ningún registro. Verificar que el DNI existe en la tabla students.');
        setError("No se encontró el registro para actualizar (DNI: " + dni + ")");
        setGuardando(false);
        return;
      }

      console.log('Alumno actualizado correctamente:', data);
      setGuardando(false);
      onGuardado(); // cerrar modal y recargar lista
    } catch (err: any) {
      console.error('Excepción al intentar guardar:', err);
      setError("Error inesperado: " + err.message);
      setGuardando(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-brand-navy border border-white/10 rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-2xl font-black text-white font-montserrat tracking-tight">
              Editar Alumno
            </h2>
            <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mt-2 italic">
              Actualizando registro: {alumno.name}
            </p>
          </div>
          <button onClick={onCerrar} className="w-12 h-12 flex items-center justify-center bg-white/5 text-slate-500 hover:text-white rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">DNI (no editable)</label>
              <input
                type="text"
                value={dni}
                readOnly
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold opacity-40 cursor-not-allowed"
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

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                Contexto DUA <span className="text-brand-orange text-[8px] italic">(IA Adaptativa)</span>
              </label>
              <input
                type="text"
                value={duaTagsInput}
                onChange={(e) => setDuaTagsInput(e.target.value)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-700 focus:border-brand-orange outline-none transition-all"
                placeholder="Ej: TDAH, Dislexia, Altas Capacidades"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <AlertCircle className="text-red-400 shrink-0" size={18} />
              <p className="text-xs font-bold text-red-400">{error}</p>
            </div>
          )}

          <div className="p-6 bg-brand-orange/5 border border-brand-orange/10 rounded-3xl flex items-start gap-4">
            <AlertCircle className="text-brand-orange shrink-0 mt-1" size={20} />
            <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
              Las calificaciones se gestionan desde el botón <span className="text-white">⚙️ engranaje</span> en la lista de alumnos.
              Este panel es exclusivo para datos de perfil y configuración DUA.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-10 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-5 bg-black/20 mt-auto">
          <button onClick={onCerrar} className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:text-white transition-all">
            Cancelar
          </button>
          <button
            onClick={handleGuardarCambios}
            disabled={!name.trim() || guardando}
            className="px-12 py-5 bg-white text-brand-navy rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-brand-orange hover:text-white hover:scale-105 active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-3"
          >
            <X size={18} className="rotate-45" />
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

      </div>
    </div>
  );
}
