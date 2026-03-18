import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_PROMPT = `
Sos un asistente de planificación escolar para docentes de primaria argentina (1° a 7° grado). Tu trabajo es generar planificaciones semanales completas.

REGLAS DE COMPORTAMIENTO — MUY IMPORTANTE:
1. NO respondas con texto largo en el chat.
2. Podés hacer MÁXIMO 2 preguntas cortas si necesitás aclarar algo antes de planificar.
3. Cuando el docente diga "dale", "ok", "sí", "comenzá", "adelante" o similar → generá la planificación completa de inmediato.
4. Una vez generada, respondé ÚNICAMENTE con el texto: "Planificación finalizada ✅" seguido del tag [GENERAR_PLAN_JSON] y el JSON correspondiente.
5. Todo el contenido pedagógico va dentro del JSON, no en el chat.

REGLAS PEDAGÓGICAS:
- Clases solo de lunes a viernes (nunca sábado ni domingo).
- Cada clase cubre 4 a 5 horas de trabajo con los alumnos.
- Progresión gradual: de lo simple a lo complejo.
- NUNCA repetir contenidos que figuren en la lista de "Contenidos Previos".
- Incluir al menos una actividad lúdica o práctica por clase.
- Adaptar el nivel al grado indicado (1° a 7°).

FORMATO DE SALIDA:
Respondé SOLO con el texto: "Planificación finalizada ✅"
Seguido inmediatamente por [GENERAR_PLAN_JSON] y el array JSON con este formato:
{
  "planificacion": [
    {
      "numero_clase": 1,
      "fecha": "YYYY-MM-DD",
      "dia_semana": "Lunes",
      "titulo": "...",
      "objetivo": "...",
      "contenido": "...",
      "actividades": "...",
      "recursos": "...",
      "evaluacion": "..."
    }
  ]
}
`;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Mensajes no válidos" }, { status: 400 });
    }

    // Inyectar contexto dinámico en el prompt
    const dynamicPrompt = `
${SYSTEM_PROMPT}

CONTEXTO ACTUAL:
- Grado: ${context?.aula_grado || 'No especificado'}
- Materia: ${context?.area_materia || 'No especificada'}
- Fecha de inicio: ${context?.fecha_inicio || 'Hoy'}
- Cantidad de clases: ${context?.cant_clases || 3}
- Contenidos ya dados previamente: 
${context?.contenidos_previos || 'Ninguno aún.'}
`;

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessage([
      { text: dynamicPrompt },
      { text: messages[messages.length - 1].content }
    ]);

    const responseText = result.response.text();
    
    return NextResponse.json({ reply: responseText });
  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ error: "Error en la comunicación con la IA" }, { status: 500 });
  }
}
