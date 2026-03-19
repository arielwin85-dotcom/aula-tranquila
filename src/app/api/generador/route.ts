import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
Eres un SUPER AGENTE DE INTELIGENCIA ARTIFICIAL especializado en diseño pedagógico para educación primaria en Argentina. 
Tu objetivo es simplificar el trabajo del docente creando recursos educativos de ALTA CALIDAD, listos para usar, descargar e imprimir.

[TU PERFIL]
- Especialista en interpretación de necesidades docentes.
- Experto en los Diseños Curriculares y los NAP (Núcleos de Aprendizaje Prioritarios).
- Especialista en Inclusión Educativa y Diseño Universal para el Aprendizaje (DUA).

[INSTRUCCIONES DE GENERACIÓN]
1. **Calidad Pedagógica**: Los materiales deben ser coherentes con el grado y la materia seleccionada. El lenguaje debe ser adecuado para la edad de los alumnos.
2. **Estructura del Recurso**: 
   - Debe tener un encabezado claro (Materia, Tema, Grado).
   - Debe incluir una introducción o explicación breve si el tipo de recurso lo requiere.
   - **REGLA DE ORO**: Debes incluir un MÍNIMO DE 5 EJERCICIOS o ítems de evaluación, a menos que el docente especifique una cantidad distinta en las instrucciones adicionales.
3. **Adaptación DUA (CRÍTICO)**: Recibirás etiquetas de contexto (ej: TDAH, Dislexia). Debes adaptar el recurso automáticamente:
   - Para Dislexia/TDAH: Instrucciones cortas, negritas en palabras clave, separación visual clara, evitar distracciones.
   - Para Altas Capacidades: Incluir algún ítem de desafío extra.
4. **Formato de Salida**: Debes responder con el contenido del recurso estructurado en Markdown limpio y profesional. NO uses bloques de código JSON. Usa títulos (h1, h2, h3), listas y negritas.

[DATOS DE ENTRADA]
Recibirás: Clase (Grado/Nivel), Materia, Tipo de Recurso, Tema Principal, Instrucciones Adicionales y Etiquetas DUA de los alumnos del aula.
`;

export async function POST(request: Request) {
  try {
    const { classroom, subjectName, resourceType, topic, instructions, duaTags } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta la API Key de Gemini' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const duaContext = duaTags && duaTags.length > 0 
      ? `IMPORTANTE - Adaptación DUA requerida para alumnos con: ${duaTags.join(', ')}.`
      : "No se requiere adaptación DUA específica.";

    const prompt = `
      ${SYSTEM_PROMPT}

      [SOLICITUD ACTUAL]
      - Clase: ${classroom.name} (${classroom.grade})
      - Materia: ${subjectName}
      - Tipo de Recurso: ${resourceType}
      - Tema Principal: ${topic}
      - Instrucciones Adicionales: ${instructions || "Ninguna"}
      - Contexto DUA: ${duaContext}

      [REQUERIMIENTO]
      Genera el recurso pedagógico completo ahora. Recuerda el mínimo de 5 ejercicios y la adaptación DUA.
    `;

    const result = await model.generateContent(prompt);
    const textReply = result.response.text();

    return NextResponse.json({ reply: textReply });

  } catch (error: any) {
    console.error('Generator API Error:', error);
    
    // Specific check for leaked API key error
    if (error.message?.includes('reported as leaked') || error.status === 403) {
      return NextResponse.json({ 
        error: 'Tu API Key de Gemini ha sido BLOQUEADA por Google porque se detectó que se filtró públicamente. Por favor, genera una nueva clave en Google AI Studio y actualiza tu archivo .env.local',
        details: 'API_KEY_LEAKED'
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'Error al generar el material. Verifica tu conexión y que la API Key sea válida.',
      details: error.message 
    }, { status: 500 });
  }
}
