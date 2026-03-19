import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'UserId required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('planificaciones')
    .select(`
      id, aula_grado, area_materia, fecha_inicio, cant_clases, created_at,
      planificacion_clases (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, aulaGrado, areaMateria, fechaInicio, cantClases, clases } = body;

    if (!userId || !clases || !clases.length) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // --- VALIDACIÓN DE DUPLICADOS ---
    // Verificar si alguna de las fechas ya tiene clases para este docente/grado/materia
    const fechasNuevas = clases.map((c: any) => c.fecha);
    
    // Deberíamos buscar en planificacion_clases vinculando con planificaciones por id
    const { data: existentes, error: errorCheck } = await supabase
      .from('planificacion_clases')
      .select('fecha, planificaciones!inner(user_id, aula_grado, area_materia)')
      .eq('planificaciones.user_id', userId)
      .eq('planificaciones.aula_grado', aulaGrado)
      .eq('planificaciones.area_materia', areaMateria)
      .in('fecha', fechasNuevas);

    if (errorCheck) {
       console.error('Error verificando duplicados:', errorCheck);
    } else if (existentes && existentes.length > 0) {
      const fechasDups = existentes.map(e => e.fecha.split('-').reverse().join('/'));
      return NextResponse.json({ 
        error: `Ya existen clases planificadas para las siguientes fechas: ${fechasDups.join(', ')}. No se puede duplicar la planificación.` 
      }, { status: 409 }); // 409 Conflict
    }

    // 1. Insertar Cabezal
    const { data: plan, error: errorPlan } = await supabase
      .from('planificaciones')
      .insert([{
        user_id: userId,
        aula_grado: aulaGrado,
        area_materia: areaMateria,
        fecha_inicio: fechaInicio,
        cant_clases: parseInt(cantClases)
      }])
      .select().single();

    if (errorPlan) throw errorPlan;

    // 2. Insertar Clases
    const { error: errorClases } = await supabase.from('planificacion_clases').insert(clases.map((c: any) => ({
      planificacion_id: plan.id,
      numero_clase: c.numero_clase,
      fecha: c.fecha,
      dia_semana: c.dia_semana,
      titulo: c.titulo,
      objetivo: c.objetivo || '',
      contenido: c.contenido || '',
      actividades: c.actividades || '',
      recursos: c.recursos || '',
      evaluacion: c.evaluacion || '',
      ejemplos_orientativos: c.ejemplos_orientativos || '',
      estado: 'PENDIENTE'
    })));

    if (errorClases) throw errorClases;

    // 3. Insertar Contenidos Dados (Historial pedagógico)
    await supabase.from('contenidos_dados').upsert(clases.map((c: any) => ({
      user_id: userId,
      aula_grado: aulaGrado,
      area_materia: areaMateria,
      tema: c.titulo,
      fecha_dada: c.fecha
    })), { onConflict: 'user_id,aula_grado,area_materia,tema' });

    return NextResponse.json({ success: true, planId: plan.id });

  } catch (error: any) {
    console.error('Error en POST /api/planificaciones:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
