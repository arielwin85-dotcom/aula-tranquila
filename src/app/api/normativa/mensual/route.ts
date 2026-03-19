import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { grado, materia, normativa,
            mes, nombreMes, dias } = await req.json();

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: `Sos un Experto Pedagógico 
de Nivel Mundial en diseño curricular argentino.
Tu función es transformar normativas curriculares 
en planificaciones diarias listas para usar.

REGLAS INNEGOCIABLES:
- No presentarse ni saludar — ir directo
- Sin teoría vacía — solo qué dar y cómo darlo
- Mínimo 3 ejemplos prácticos por clase
- Resultado imprimible y prolijo
- Extraer NAP y ejes de la normativa recibida
- Progresión ascendente entre todas las clases
- Nunca repetir título entre clases`
    });

    const prompt = `PLANIFICACIÓN MENSUAL — 
${nombreMes} 2026
${grado} | ${materia}
Total: ${dias.length} clases

NORMATIVA DE REFERENCIA:
${normativa}

Días a planificar:
${dias.map((d: any, i: number) =>
  `Clase ${i+1} — ${d.dia} ${d.fecha}`
).join('\n')}

Generá una clase completa por cada día.
Usar esta estructura exacta por clase:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLASE [N] — [DÍA] [FECHA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENCUADRE NORMATIVO
NAP: [extraído de la normativa]
Eje: [del Diseño Curricular]
Capacidad: [trabajada en esta clase]

OBJETIVO
Al finalizar el alumno podrá [verbo 
observable] [contenido], demostrando 
[evidencia] a través de [producto].

DESARROLLO DE LA CLASE
Apertura (15-20 min):
[Pregunta disparadora exacta]
[Qué escribir en el pizarrón]
Podés decirles: '[frase concreta]'

Desarrollo (90-120 min):
[Paso a paso]
[Qué escribir en el pizarrón]
Duda frecuente: 'Si preguntan X → Y'

Práctica (60-90 min):
[Actividad detallada]
[Qué hace el docente mientras trabajan]

Cierre (20-30 min):
[Pregunta de cierre exacta]
[Tarea si corresponde]

EJEMPLOS ORIENTATIVOS
Ejemplo 1 — Básico:
  Antes: [...] → Después: [...]
Ejemplo 2 — Intermedio:
  Antes: [...] → Después: [...]
Ejemplo 3 — Vida real:
  [...]
Consejo docente: [tip concreto]

ACTIVIDAD
Nombre: [nombre creativo]
Objetivo lúdico: [qué aprenden]
Paso 1: [...] Paso 2: [...] Paso 3: [...]
Duración: [tiempo]
Variante rápida: [versión reducida]
Variante desafiante: [para avanzados]

RECURSOS
- [Material] — [cantidad] —
  Alternativa: [si no disponible]

EVALUACIÓN INFORMAL
Qué observar: [comportamientos concretos]
Pregunta clave: '[pregunta exacta]'
Señal de logro: [qué hace al entender]
Señal de alerta: [cómo detectar +
qué hacer en ese momento]`;

    const result = await model.generateContent(prompt);
    const contenido = result.response.text();

    return NextResponse.json({ contenido });

  } catch(error) {
    console.error('Error API mensual:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
