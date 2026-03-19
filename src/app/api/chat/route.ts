import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  console.log('=== API CHAT LLAMADA ===');
  try {
    const body = await req.json();
    console.log('=== API LLAMADA ===');
    console.log('GEMINI_API_KEY existe:', !!process.env.GEMINI_API_KEY);
    
    const { 
      messages, 
      context 
    } = body;
    
    const { 
      aulaGrado: nombreGrado, 
      areaMateria, 
      fechaInicio, 
      cantClases, 
      mesActual,
      userId 
    } = context;

    console.log('--- CONTEXTO RECIBIDO ---');
    console.log(`Grado: ${nombreGrado}, Materia: ${areaMateria}, Mes: ${mesActual}`);

    // 1. Obtener contenidos previos (últimos 10 temas dados)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let contenidosPrevios = 'Ninguno aún';
    let contextoMemoria = '';

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // A. Contenidos rápidos (para el prompt)
      const { data: previos } = await supabase
        .from('contenidos_dados')
        .select('tema, fecha_dada')
        .eq('user_id', userId)
        .eq('aula_grado', nombreGrado)
        .eq('area_materia', areaMateria)
        .order('fecha_dada', { ascending: false })
        .limit(10);

      if (previos && previos.length > 0) {
        contenidosPrevios = previos.map(p => `${p.tema} (${p.fecha_dada})`).join(', ');
      }

      // B. Historial detallado de últimas 5 planificaciones
      const { data: planificacionesPrevias } = await supabase
        .from('planificaciones')
        .select(`
          fecha_inicio,
          planificacion_clases (
            numero_clase, fecha, titulo
          )
        `)
        .eq('user_id', userId)
        .eq('aula_grado', nombreGrado)
        .eq('area_materia', areaMateria)
        .order('created_at', { ascending: false })
        .limit(5);

      const tieneHistorial = planificacionesPrevias && planificacionesPrevias.length > 0;

      if (tieneHistorial) {
        const resumenPrevio = planificacionesPrevias
          .slice().reverse() // cronológico
          .flatMap(plan =>
            (plan.planificacion_clases || [])
              .sort((a: any, b: any) => a.numero_clase - b.numero_clase)
              .map((c: any) => `- ${c.fecha}: ${c.titulo}`)
          ).join('\n');

        const clasesUltimoPlan = planificacionesPrevias[0].planificacion_clases
          ?.sort((a: any, b: any) => b.numero_clase - a.numero_clase);
        
        const ultimaClase = clasesUltimoPlan?.[0]?.titulo || 'N/A';
        const ultimaFecha = clasesUltimoPlan?.[0]?.fecha || 'N/A';

        contextoMemoria = `\nHISTORIAL EXISTENTE (orden cronológico):
${resumenPrevio}
Última clase dada: "${ultimaClase}" (fecha: ${ultimaFecha})\n`;
      }
    }

    const systemPrompt = `Sos un docente experto con 20 años de experiencia en 
educación primaria argentina (1° a 7° grado). Conocés 
en profundidad los Núcleos de Aprendizaje Prioritarios 
(NAP) y los Diseños Curriculares de cada provincia.

CONTEXTO ACTUAL:
- Grado: ${nombreGrado}
- Materia: ${areaMateria}  
- Fecha de inicio: ${fechaInicio}
- Cantidad de clases: ${cantClases}
- Mes del año: ${mesActual} (esto determina en qué punto 
  del año escolar argentino están — marzo=inicio, 
  julio=mitad, noviembre=cierre)
- Temas ya dados: ${contenidosPrevios}${contextoMemoria}

CONOCIMIENTO QUE DEBÉS APLICAR SIEMPRE:

Según el grado y el momento del año, sabés exactamente 
qué contenidos corresponden. Por ejemplo:
- 3er grado, Matemática, marzo: recién arranca, 
  repaso de los 1000, introducción a la multiplicación
- 3er grado, Matemática, agosto: multiplicación y 
  división consolidadas, inicio de fracciones simples
- 1er grado, Lengua, marzo: conciencia fonológica, 
  las primeras letras, no pueden leer solos todavía
- 7mo grado, Lengua, octubre: producción de textos 
  argumentativos, análisis crítico

REGLAS DE COMPORTAMIENTO — MUY IMPORTANTES:
1. Nunca hagas más de 2 preguntas. Si el docente ya 
   dio suficiente contexto, no preguntes nada.
2. Las preguntas deben ser solo para afinar el tema 
   específico si hay ambigüedad — no para pedir 
   información que ya tenés en los combos.
3. Antes de generar la planificación SIEMPRE preguntá: 
   '¿Querés que desarrolle la planificación ahora?' 
   o '¿Arrancamos?' — ese es el corte obligatorio.
4. Cuando el docente confirme (dale, sí, arrancamos, 
   ok, etc.) → generá la planificación completa 
   de inmediato sin más preguntas.
5. Respondé siempre en 2-3 líneas máximo, salvo 
   cuando generés la planificación.
6. Recordá todo lo que el docente te dijo en la 
   conversación y usalo en la planificación.
7. Siempre que haya historial previo, mencioná brevemente 
   que sabés cuál fue la última clase (ej: "Veo que la 
   clase pasada trabajaron [Tema], vamos a seguir con...") 
   para dar seguridad al docente de que tenés memoria.

CÓMO GENERAR LA PLANIFICACIÓN:
Cuando el docente confirme, respondé EXACTAMENTE así:
'Planificación finalizada ✅'
Y luego el JSON con el tag [GENERAR_PLAN_JSON]

IMPORTANTE: 
- Respondé SOLO la frase de éxito y el tag.
- NO uses bloques de código con triple comilla (\` \` \`json).
- El JSON debe ir pegado inmediatamente después del tag.

El JSON debe tener esta estructura con contenido 
MUY DETALLADO — no es un resumen, es una guía 
completa para el docente:

[GENERAR_PLAN_JSON]
{
  "planificacion": [
    {
      "numero_clase": 1,
      "fecha": "YYYY-MM-DD",
      "dia_semana": "Lunes",
      "titulo": "Título claro y específico",
      "objetivo": "Al finalizar esta clase el alumno podrá... (objetivo concreto y medible)",
      "contenido": "Desarrollo detallado de 4-5 horas de clase. Incluir: apertura de la clase (15-20 min), desarrollo del contenido principal (90-120 min), actividad de práctica (60-90 min), cierre y evaluación informal (20-30 min). Ser específico: qué se escribe en el pizarrón, qué ejercicios se hacen, cómo se explica el concepto paso a paso.",
      "ejemplos_orientativos": "Al menos 3 ejemplos concretos que el docente puede usar en clase. Por ejemplo si es multiplicación: 3x4 con dibujo de 3 grupos de 4 manzanas. Si es lectura: texto modelo con las preguntas ya formuladas.",
      "actividades": "Actividad práctica o lúdica detallada: nombre de la actividad, cómo se juega, qué aprenden, cuánto tiempo lleva.",
      "recursos": "Lista exacta de materiales: fotocopias, cartulinas, marcadores, dados, libros específicos, etc.",
      "evaluacion": "Cómo evaluar informalmente: qué observar, qué pregunta hacer al grupo, señal de que aprendieron."
    }
  ]
}

PROGRESIÓN ASCENDENTE OBLIGATORIA:
Cada clase debe ser más compleja que la anterior.
Clase 1: concepto nuevo + comprensión básica
Clase 2: práctica guiada + primer ejercicio
Clase 3: práctica autónoma + variantes
Clase 4: aplicación en contexto real o lúdico
Clase 5: integración + evaluación informal

NUNCA:
- Repetir temas de la lista de contenidos previos
- Dar contenido de un grado superior al indicado
- Proponer actividades que los niños de ese grado 
  no pueden hacer (ej: leer solos en 1er grado 
  en marzo)
- Generar planificaciones vacías o superficiales`;

    // 3. Llamar a Gemini
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada en el servidor');
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt
    });


    console.log('Iniciando chat con Gemini (historial length original:', messages.length - 1, ')');

    // El historial de Gemini DEBE empezar con un mensaje del usuario ('user').
    // Filtramos cualquier mensaje inicial del asistente (como el saludo).
    const historyToProcess = messages.slice(0, -1);
    let firstUserIndex = historyToProcess.findIndex((m: any) => m.role === 'user');
    
    const cleanHistory = firstUserIndex === -1 
      ? [] 
      : historyToProcess.slice(firstUserIndex);

    const formattedHistory = cleanHistory.map((m: any) => {
      const role = m.role === 'assistant' ? 'model' : 'user';
      return {
        role,
        parts: [{ text: m.content }]
      };
    });

    console.log('Historial formateado para SDK (longitud):', formattedHistory.length);

    const chat = model.startChat({
      history: formattedHistory
    });

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      throw new Error('El último mensaje está vacío o es inválido');
    }

    console.log('Enviando mensaje final:', lastMessage.content.substring(0, 50), '...');
    const result = await chat.sendMessage(lastMessage.content);
    const responseText = result.response.text();

    console.log('Respuesta Gemini Exitosa (longitud):', responseText.length);

    return NextResponse.json({ response: responseText });

  } catch (error: any) {
    console.error('CRITICAL ERROR EN API CHAT:', error);
    // Devolver un mensaje más descriptivo para el log de Vercel (pero seguro)
    return NextResponse.json(
      { error: error?.message || 'Error interno en el servidor de IA' },
      { status: 500 }
    );
  }
}
