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

    if (!userId || !clases) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
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
