import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();
    const { aulaGrado, areaMateria, fechaInicio, cantClases, userId } = context;

    // 1. Obtener contenidos previos de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: contenidosPrevios } = await supabase
      .from('contenidos_dados')
      .select('tema, fecha_dada')
      .eq('user_id', userId)
      .eq('aula_grado', aulaGrado)
      .eq('area_materia', areaMateria)
      .order('fecha_dada', { ascending: false })
      .limit(20);

    const listaPrevios = contenidosPrevios && contenidosPrevios.length > 0
      ? contenidosPrevios.map(c => `- ${c.tema} (${c.fecha_dada})`).join('\n')
      : 'Ninguno aún — es la primera planificación de esta materia.';

    // 2. System prompt
    const systemPrompt = `Sos un asistente de planificación escolar para docentes argentinos de primaria (1° a 7° grado).

CONTEXTO DEL DOCENTE:
- Grado: ${aulaGrado}
- Materia: ${areaMateria}
- Fecha de inicio: ${fechaInicio}
- Cantidad de clases a planificar: ${cantClases}
- Temas ya dados en esta materia: 
${listaPrevios}

COMPORTAMIENTO EN EL CHAT:
- Saludá brevemente cuando el docente inicia la conversación
- Podés hacer MÁXIMO 1 pregunta corta si necesitás aclarar algo
- Cuando el docente diga "dale", "ok", "sí", "comenzá", "adelante" o similar → generá la planificación completa de inmediato
- Después de generar respondé SOLO: "Planificación finalizada ✅" seguido del JSON
- Para cualquier otro mensaje respondé en máximo 2 líneas

REGLAS PEDAGÓGICAS OBLIGATORIAS:
- Solo clases de lunes a viernes (nunca sábado ni domingo)
- Cada clase cubre 4 a 5 horas con los alumnos
- Progresión gradual: de lo simple a lo complejo
- NUNCA repetir temas que figuren en la lista de temas ya dados
- Incluir al menos una actividad lúdica o práctica por clase
- Adaptar el nivel exacto al grado:
  * 1° grado: inicio lectoescritura, números al 10, reconocimiento del entorno
  * 2° grado: consolidación lectura, sumas y restas simples, oraciones
  * 3° grado: lectura comprensiva, multiplicación, textos cortos
  * 4° grado: análisis textual, división, gramática básica
  * 5° grado: producción de textos, fracciones, historia regional
  * 6° grado: textos argumentativos, decimales, ciencias naturales
  * 7° grado: pensamiento crítico, álgebra básica, ciudadanía

CUANDO GENERES LA PLANIFICACIÓN escribí exactamente esto:
Planificación finalizada ✅
[GENERAR_PLAN_JSON]
{
  "planificacion": [
    {
      "numero_clase": 1,
      "fecha": "YYYY-MM-DD",
      "dia_semana": "Lunes",
      "titulo": "Título claro de la clase",
      "objetivo": "Al finalizar la clase el alumno podrá...",
      "contenido": "Desarrollo detallado del contenido para 4-5 horas de clase...",
      "actividades": "Actividad práctica o lúdica concreta...",
      "recursos": "Materiales necesarios...",
      "evaluacion": "Cómo evaluar informalmente..."
    }
  ]
}`;

    // 3. Llamar a Gemini
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const responseText = result.response.text();

    console.log('Respuesta Gemini:', responseText); // debug temporal

    return NextResponse.json({ response: responseText });

  } catch (error) {
    console.error('Error en API chat:', error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}
