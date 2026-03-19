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
    
    const { messages, context } = body;
    const { aulaGrado, areaMateria, fechaInicio, cantClases, userId } = context;
    
    console.log('Grado:', aulaGrado);
    console.log('Materia:', areaMateria);
    console.log('Fecha Inicio:', fechaInicio);
    console.log('Cant Clases:', cantClases);


    // 1. Obtener contenidos previos de Supabase (Opcional para que no explote)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let listaPrevios = 'No se pudo acceder a la memoria (faltan llaves de Supabase en Vercel).';

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: contenidosPrevios } = await supabase
        .from('contenidos_dados')
        .select('tema, fecha_dada')
        .eq('user_id', userId)
        .eq('aula_grado', aulaGrado)
        .eq('area_materia', areaMateria)
        .order('fecha_dada', { ascending: false })
        .limit(20);

      if (contenidosPrevios && contenidosPrevios.length > 0) {
        listaPrevios = contenidosPrevios.map(c => `- ${c.tema} (${c.fecha_dada})`).join('\n');
      } else {
        listaPrevios = 'Ninguno aún — es la primera planificación de esta materia.';
      }
    }

    // 2. System prompt especializado (Argentina)
    const systemPrompt = `Sos un docente especializado en pedagogía escolar argentina con experiencia en todos los grados de primaria.

CONTEXTO:
- Grado: ${aulaGrado}
- Materia: ${areaMateria}
- Fecha de inicio: ${fechaInicio}
- Clases a planificar: ${cantClases}
- Temas ya dados: 
${listaPrevios}

COMPORTAMIENTO:
1. Saludá con el grado y materia específicos.
2. Hacé MÁXIMO 2 preguntas cortas para entender qué necesita el docente.
3. Cuando el docente diga "dale", "ok", "sí", "comenzá" o similar → generá la planificación completa de inmediato.
4. Al generar respondé SOLO: "Planificación finalizada ✅" seguido del JSON con el tag [GENERAR_PLAN_JSON]
5. Para cualquier otro mensaje respondé en máximo 2 líneas.

REGLAS PEDAGÓGICAS:
- Solo clases de lunes a viernes.
- Cada clase: 4 a 5 horas con los alumnos.
- Nunca repetir temas de la lista de temas ya dados.
- Adaptá el nivel al grado exacto:
  * 1° a 3°: alfabetización, operaciones básicas, entorno.
  * 4° a 7°: comprensión lectora, pensamiento crítico, ciencias, historia.
- Incluir actividad lúdica o práctica por clase.

CUANDO GENERES escribe exactamente:
Planificación finalizada ✅
[GENERAR_PLAN_JSON]
{
  "planificacion": [
    {
      "numero_clase": 1,
      "fecha": "YYYY-MM-DD",
      "dia_semana": "Lunes",
      "titulo": "Título de la clase",
      "objetivo": "Objetivo pedagógico...",
      "contenido": "Desarrollo para 4-5 horas...",
      "actividades": "Actividad práctica o lúdica...",
      "recursos": "Materiales...",
      "evaluacion": "Criterio de evaluación..."
    }
  ]
}`;


    // 3. Llamar a Gemini
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada en el servidor');
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
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
