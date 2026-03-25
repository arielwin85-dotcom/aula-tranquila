import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { descontarTokensServer } from '@/lib/tokens-server';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gradoA, gradoB, materia, normativaA, normativaB, mes, nombreMes, dias } = await req.json();

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { maxOutputTokens: 8192 },
      systemInstruction: `Sos un Experto Pedagógico de Nivel Mundial 
en diseño curricular argentino con 20 años de experiencia.
Tu función es transformar normativas curriculares de DOS GRADOS DISTINTOS 
en planificaciones diarias aplicables de PLURICURSO.

REGLAS INNEGOCIABLES:
- No presentarse ni saludar — ir directo
- Sin teoría vacía — solo qué dar y cómo darlo
- Mínimo 3 ejemplos prácticos por clase, diferenciando qué hace [GRADO_A] y [GRADO_B]
- Extraer NAP y ejes de la normativa recibida
- Progresión ascendente entre todas las clases
- Nunca repetir título entre clases
- PROHIBIDO usar etiquetas HTML (como <br>, <b>, etc.). Usar solo texto plano.

PROGRESIÓN DE INDICADORES:
- 1er T (Mar-Jun): Verbos básicos (identifica, nombra, reconoce).
- 2do T (Ago-Oct): Verbos intermedios (clasifica, relaciona, explica).
- Cierre (Nov-Dic): Verbos complejos (argumenta, produce, integra).`
});

    const baseEstructura = `Usar esta estructura exacta por clase:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLASE [N] — [DÍA] [FECHA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENCUADRE NORMATIVO CONJUNTO
NAP / Eje Común: [tema paraguas]

OBJETIVO PLURICURSO
- Para ${gradoA}: Al finalizar el alumno podrá...
- Para ${gradoB}: Al finalizar el alumno podrá...

DESARROLLO DE LA CLASE
Apertura Conjunta (15 min):
[Pregunta disparadora para el grupo total]
[Qué escribir en el pizarrón]

Desarrollo Diferenciado (60 min):
- Tareas para ${gradoA}: [Paso a paso]
- Tareas para ${gradoB}: [Paso a paso]
[Cómo el docente alterna la atención]

Cierre Común (15 min):
[Puesta en común conjunta]

RECURSOS
- Para ${gradoA}: [Material necesario]
- Para ${gradoB}: [Material necesario]

EVALUACIÓN INFORMAL
Qué observar en ${gradoA}: [comportamientos concretos]
Qué observar en ${gradoB}: [comportamientos concretos]`;

    // Descuento de 3 tokens para plural mensual
    const tokenCheck = await descontarTokensServer(
      userId, 
      3, 
      'ia_plan_mensual_pluricurso', 
      `Pluricurso Mensual: ${gradoA} y ${gradoB} - ${materia} (${nombreMes})`
    );

    if (!tokenCheck.ok) {
      if (tokenCheck.error === 'sin_tokens') {
        return NextResponse.json({ 
          error: 'Tokens insuficientes. El pluricurso mensual requiere 3 tokens.', 
          details: 'NECESITAS_TOKENS',
          disponibles: tokenCheck.tokensRestantes 
        }, { status: 403 });
      }
      return NextResponse.json({ error: tokenCheck.error }, { status: 500 });
    }

    let contenido = '';

    // Si hay más de 10 clases, dividimos en dos tandas para evitar recortes por límite de tokens (8192)
    if (dias.length > 10) {
      const mitad = Math.ceil(dias.length / 2);
      const dias1 = dias.slice(0, mitad);
      const dias2 = dias.slice(mitad);

      // Tanda 1
      const prompt1 = `PLANIFICACIÓN MENSUAL PLURICURSO — PARTE 1
${nombreMes} 2026
Grado A: ${gradoA} | Grado B: ${gradoB} | Materia: ${materia}
Total clases en esta parte: ${dias1.length}

NORMATIVA GRADO A:
${normativaA}

NORMATIVA GRADO B:
${normativaB}

Días a planificar:
${dias1.map((d: any, i: number) => `Clase ${i+1} — ${d.dia} ${d.fecha}`).join('\n')}

IMPORTANTE: DEBES ESCRIBIR EL CONTENIDO REAL Y COMPLETO PARA CADA CLASE. NO USES CORCHETES [], NO USES VARIABLES, NO HAGAS UNA PLANTILLA. ESCRIBE EL TEXTO TAL CUAL DEBE APARECER EN EL DOCUMENTO FINAL.

${baseEstructura}`;

      const result1 = await model.generateContent(prompt1);
      contenido += result1.response.text();

      contenido += '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

      // Tanda 2
      const prompt2 = `PLANIFICACIÓN MENSUAL PLURICURSO — PARTE 2 (CONTINUACIÓN)
${nombreMes} 2026
Grado A: ${gradoA} | Grado B: ${gradoB} | Materia: ${materia}
Total clases en esta parte: ${dias2.length}

NORMATIVA GRADO A:
${normativaA}

NORMATIVA GRADO B:
${normativaB}

Días a planificar (CONTINUACIÓN):
${dias2.map((d: any, i: number) => `Clase ${mitad + i + 1} — ${d.dia} ${d.fecha}`).join('\n')}

IMPORTANTE: DEBES ESCRIBIR EL CONTENIDO REAL Y COMPLETO PARA CADA CLASE. NO USES CORCHETES [], NO USES VARIABLES, NO HAGAS UNA PLANTILLA. ESCRIBE EL TEXTO TAL CUAL DEBE APARECER EN EL DOCUMENTO FINAL.
CONTINÚA LA PROGRESIÓN PEDAGÓGICA de la primera parte.

${baseEstructura}`;

      const result2 = await model.generateContent(prompt2);
      contenido += result2.response.text();
    } else {
      const promptFinal = `PLANIFICACIÓN MENSUAL PLURICURSO — 
${nombreMes} 2026
Grado A: ${gradoA} | Grado B: ${gradoB} | Materia: ${materia}
Total: ${dias.length} clases

NORMATIVA GRADO A:
${normativaA}

NORMATIVA GRADO B:
${normativaB}

Días a planificar:
${dias.map((d: any, i: number) => `Clase ${i+1} — ${d.dia} ${d.fecha}`).join('\n')}

Generá una clase completa por cada día integrando a ambos grupos en una misma temática. Escribe el contenido TEXTUAL y REAL, no una plantilla.

${baseEstructura}`;

      const result = await model.generateContent(promptFinal);
      contenido = result.response.text();
    }

    return NextResponse.json({ 
      contenido,
      tokensRestantes: tokenCheck.tokensRestantes
    });

  } catch(error) {
    console.error('Error API pluricurso mensual:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
