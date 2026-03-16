import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { WeeklyPlan, ChatMessage } from '@/types';

// The system prompt defines the AI's "Persona" and strict behavior guidelines.
const SYSTEM_PROMPT = `
[ROL]
Eres el mejor maestro de primaria de Argentina con expertise profundo en diseño curricular, planificación educativa y pedagogía. Dominas los contenidos gubernamentales (NAP, Diseños Provinciales) para grados 1 a 7. Tu comunicación es de un colega experto: profesional, cálido y propositivo.

[TU TAREA]
Generar planificaciones de ALTA CALIDAD PEDAGÓGICA. No te limites a títulos; cada descripción debe ser rica.

[DIRECTRICES DE CONTEXTO]
1. **SALTO DE ENTREVISTA**: Si recibes el Grado y la Materia, NO preguntes "¿Qué temas estuviste dando?". Asume que debes proponer el contenido más adecuado para ese momento del año según el diseño curricular. Sé proactivo.
2. **PROFUNDIDAD PEDAGÓGICA**: Cada descripción de clase debe incluir:
   - Objetivo de aprendizaje (¿Qué aprenderán?).
   - Secuencia didáctica (Inicio, Desarrollo, Cierre).
   - Fundamentación breve (¿Por qué es adecuado para esta edad/grado?).
3. **EXCLUSIVIDAD Y CONTEXTO**: Eres el maestro de la MATERIA EXACTA y el GRADO EXACTO indicados en la configuración. JAMÁS generes contenido de otra materia (ej. si la materia es Prácticas del Lenguaje, NO hables de Matemáticas). Adapta todo el vocabulario y dificultad estrictamente a la edad de ese grado.

[REGLAS TÉCNICAS]
- FORMATO: Tu respuesta debe incluir el tag [GENERAR_PLAN_JSON] seguido del array JSON con el plan de la semana completa.
- ESTRUCTURA JSON: Es OBLIGATORIO que CADA DÍA en el array tenga exactamente las siguientes claves: "dayOfWeek", "topic", "description" y "isHoliday". NUNCA omitas 'topic' ni 'description'. Las descripciones deben ser largas.
- **ELIMINACIÓN/CAMBIO**: Si el docente pide CAMBIAR una clase, ELIMINA mentalmente la propuesta anterior para esa fecha y genera una NUEVA que mantenga la coherencia con el resto de la semana. Solo actualiza ese elemento en el JSON.
- **RESET DE SEMANA**: Si el usuario informa que BORRÓ la planificación porque no le convencía, sé humilde, reconoce el error y pregunta: "Entiendo perfectamente. ¿En qué temas o competencias específicas te gustaría que nos enfoquemos para esta nueva versión? Estoy listo para ajustar el rumbo según tus instrucciones."
- **NUNCA** muestres etiquetas técnicas ni bloques de código JSON al docente.
- **FIN DE SEMANA**: Los días Sábado y Domingo NO son días de clase. Sáltalos siempre. No los incluyas en los 5 días de planificación.
`;

export async function POST(request: Request) {
  try {
    if (request.method !== 'POST') {
      return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
    }

    let body;
    let rawText = '';
    try {
      rawText = await request.text();
      const trimmedText = rawText.trim();
      console.log('Raw Request Body Size:', rawText.length, 'Trimmed Size:', trimmedText.length);
      
      if (!trimmedText) {
        return NextResponse.json({ error: 'Payload de solicitud vacío' }, { status: 400 });
      }
      body = JSON.parse(trimmedText);
    } catch (e) {
      console.error('Error parsing request JSON:', e, 'Raw Text was:', `"${rawText}"`);
      return NextResponse.json({ error: 'Payload de solicitud inválido' }, { status: 400 });
    }
    const { messages, classroomId, subjectId, subjectName, config, classroom } = body;
    const { startDate, numClasses } = config || {};
    const startDateObj = new Date(startDate + 'T12:00:00');
    const startWeekday = startDateObj.toLocaleDateString('es-AR', { weekday: 'long' });
    const classroomContext = classroom ? `GRADO EXACTO: ${classroom.grade} | MATERIA EXACTA: ${subjectName || subjectId} | AULA: ${classroom.name}` : `ID Aula: ${classroomId} | MATERIA EXACTA: ${subjectName || subjectId}`;
    console.log('Request received:', { messagesCount: messages?.length, classroomId, subjectId, subjectName, startDate, numClasses });

    // 1. Memory Retrieval: Fetch the last completed plan to feed into AI logic
    const db = readDB();
    let pastLessonsContext = "No hay clases pasadas en el sistema. Es la primera vez que planifican.";
    
    if (db.weeklyPlans && classroomId && subjectId) {
      const pastPlans = db.weeklyPlans
         .filter((p: WeeklyPlan) => p.classroomId === classroomId && p.subjectId === subjectId)
         .sort((a: WeeklyPlan, b: WeeklyPlan) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());
         
      if (pastPlans.length > 0) {
        // Feed the most recent week of topics into the AI context
        const recentTopics = pastPlans[0].days.map((d: any) => `${d.dayOfWeek}: ${d.topic}`).join(', ');
        pastLessonsContext = `Temas enseñados la SEMANA ANTERIOR: ${recentTopics}\nIMPORTANTE: Los alumnos YA DOMINAN estos temas. NO los repitas exactamente. Avanza en la progresión de aprendizaje o cambia al siguiente contenido del Diseño Curricular.`;
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta la API Key de Gemini en el backend' }, { status: 500 });
    }

    // 2. Build the full multi-turn conversation for Gemini
    // First message: System prompt + memory context (as "user"), then a fake "model" ack
    const contents: Array<{role: string, parts: Array<{text: string}>}> = [
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\n[CONFIGURACIÓN RECIBIDA]:\n- ${classroomContext}\n- Fecha Inicio: ${startDate} (es ${startWeekday})\n- Cantidad de Clases: ${numClasses}\n\n[CONTEXTO DE MEMORIA]:\n${pastLessonsContext}\n\nResponde "Entendido" y nada más.` }]
      },
      {
        role: "model", 
        parts: [{ text: "Entendido. Soy el Copiloto Pedagógico de Aula Tranquila. Aplicaré la memoria de clases anteriores y seguiré el flujo conversacional paso a paso." }]
      }
    ];

    // Add ALL conversation messages (this is the key fix - we send the FULL history)
    for (const msg of messages) {
      // Skip the welcome system message
      if (msg.id === 'welcome') continue;
      
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    const responseBody = { contents };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    console.log('Fetching Gemini...');
    
    // Retry logic for rate limits (429)
    let geminiResponse: Response | null = null;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries <= maxRetries) {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseBody)
      });

      if (geminiResponse.status === 429 && retries < maxRetries) {
        const waitTime = Math.pow(2, retries + 1) * 5000; // 10s, 20s, 40s
        console.log(`Rate limited (429). Retrying in ${waitTime / 1000}s... (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      } else {
        break;
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      const errorData = await geminiResponse?.json().catch(() => ({ error: 'No JSON body' }));
      console.error(`Gemini API Error (${geminiResponse?.status}):`, JSON.stringify(errorData, null, 2));
      
      if (geminiResponse?.status === 429) {
        return NextResponse.json({ error: 'La IA está temporalmente ocupada. Esperá unos segundos y volvé a intentar.' }, { status: 429 });
      }
      throw new Error(`Gemini API Error: ${JSON.stringify(errorData)}`);
    }

    const data = await geminiResponse.json();
    console.log('Gemini Response OK!');
    
    if (data.error) {
      console.error('Gemini returned error field:', data.error);
      throw new Error(`Gemini Error: ${data.error.message || 'Unknown'}`);
    }

    const textReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo obtener respuesta del modelo.";

    return NextResponse.json({ reply: textReply });

  } catch (error) {
    console.error('Gemini Request Error:', error);
    return NextResponse.json({ error: 'Ocurrió un error al contactar al asistente IA' }, { status: 500 });
  }
}
