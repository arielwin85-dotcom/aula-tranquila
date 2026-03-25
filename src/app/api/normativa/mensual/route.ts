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

    const { grado, materia, normativa,
            mes, nombreMes, dias } = await req.json();

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { maxOutputTokens: 8192 },
      systemInstruction: `Sos un Experto Pedagógico de Nivel Mundial 
en diseño curricular argentino con 20 años de experiencia.
Tu función es transformar normativas curriculares en planificaciones diarias reales y aplicables.

REGLAS INNEGOCIABLES:
- No presentarse ni saludar — ir directo
- Sin teoría vacía — solo qué dar y cómo darlo
- Mínimo 3 ejemplos prácticos por clase
- Resultado imprimible y prolijo
- Extraer NAP y ejes de la normativa recibida
- Progresión ascendente entre todas las clases
- Nunca repetir título entre clases
- PROHIBIDO usar etiquetas HTML (como <br>, <b>, etc.). Usar solo texto plano con saltos de línea normales.

CONOCIMIENTO PEDAGÓGICO POR GRADO:
(Aplicar automáticamente según el grado recibido)

1ER GRADO: Pensamiento concreto. Estrategias: Juego, material manipulable, consignas orales breves, movimiento. Dibujo como registro. Tiempos max 20 min.
2DO GRADO: Consolidación lectoescritura. Estrategias: Material concreto/semiconcreto, exploración sensorial, dibujo + escritura breve, parejas.
3ER GRADO: Lectura comprensiva emergente. Estrategias: Lectura compartida, problemas contexto real, revisión de borradores, cuadros simples.
4TO GRADO: Pensamiento lógico. Estrategias: Análisis textos informativos, problemas múltiples pasos, debate guiado, proyectos cortos.
5TO GRADO: Pensamiento abstracto emergente. Estrategias: Investigación corta, debates fundamentados, fuentes diversas, autoevaluación.
6TO GRADO: Inicio pensamiento hipotético. Estrategias: ABP, análisis crítico fuentes, textos académicos simples, evaluación pares.
7MO GRADO: Pensamiento formal. Preparación secundaria. Estrategias: Proyectos interdisciplinarios, foros, investigación académica, monografías breves.

PROGRESIÓN DE INDICADORES:
- 1er T (Mar-Jun): Verbos básicos (identifica, nombra, reconoce). Con ayuda/soporte visual.
- 2do T (Ago-Oct): Verbos intermedios (clasifica, relaciona, explica). Con poca ayuda.
- Cierre (Nov-Dic): Verbos complejos (argumenta, produce, integra, resuelve de forma autónoma).`
});

    const baseEstructura = `Usar esta estructura exacta por clase:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLASE [N] — [DÍA] [FECHA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENCUADRE NORMATIVO
NAP: [extraído de la normativa]
Eje: [del Diseño Curricular]
Capacidad: [trabajada en esta clase]

OBJETIVO
Al finalizar el alumno podrá [verbo 
observable según la altura del año] [contenido], demostrando 
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
Duración: [tiempo según el grado]
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

    // --- DESCUENTO DE TOKENS ---
    const tokenCheck = await descontarTokensServer(
      userId, 
      2, 
      'ia_plan_mensual', 
      `Planificación Mensual: \${grado} - \${materia} (\${nombreMes})`
    );

    if (!tokenCheck.ok) {
      if (tokenCheck.error === 'sin_tokens') {
        return NextResponse.json({ 
          error: 'Tokens insuficientes', 
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
      const prompt1 = `PLANIFICACIÓN MENSUAL (PARTE 1 de 2) — 
\${nombreMes} 2026
\${grado} | \${materia}
Total: \${dias1.length} clases

NORMATIVA DE REFERENCIA:
\${normativa}

Días a planificar:
\${dias1.map((d: any, i: number) =>
  \`Clase \${i+1} — \${d.dia} \${d.fecha}\`
).join('\\n')}

Generá una clase completa por cada día listado.
ES OBLIGATORIO PRODUCIR LA CANTIDAD EXACTA DE CLASES SOLICITADAS. NO TE DETENGAS A MITAD DEL MES. DEBES GENERAR HASTA LA ÚLTIMA CLASE INDICADA EN LA LISTA SIN SALTEARTE LOS DÍAS.
IMPORTANTE: Aplicar el conocimiento pedagógico por grado (estrategias, tiempos y nivel de autonomía) definido en tus instrucciones de sistema. Respetar estrictamente la estructura de clase solicitada a continuación.

\${baseEstructura}`;

      const result1 = await model.generateContent(prompt1);
      contenido += result1.response.text();

      contenido += '\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n';

      // Tanda 2
      const prompt2 = `PLANIFICACIÓN MENSUAL (PARTE 2 de 2) — 
\${nombreMes} 2026
\${grado} | \${materia}
Total: \${dias2.length} clases

NORMATIVA DE REFERENCIA:
\${normativa}

Días a planificar:
\${dias2.map((d: any, i: number) =>
  \`Clase \${mitad + i + 1} — \${d.dia} \${d.fecha}\`
).join('\\n')}

Generá una clase completa por cada día listado. CONTINÚA LA PROGRESIÓN PEDAGÓGICA de la primera parte.
ES OBLIGATORIO PRODUCIR LA CANTIDAD EXACTA DE CLASES SOLICITADAS. NO TE DETENGAS A MITAD DEL MES. DEBES GENERAR HASTA LA ÚLTIMA CLASE INDICADA EN LA LISTA SIN SALTEARTE LOS DÍAS.
IMPORTANTE: Aplicar el conocimiento pedagógico por grado (estrategias, tiempos y nivel de autonomía) definido en tus instrucciones de sistema. Respetar estrictamente la estructura de clase solicitada a continuación.

\${baseEstructura}`;

      const result2 = await model.generateContent(prompt2);
      contenido += result2.response.text();
    } else {
      const promptBase = `PLANIFICACIÓN MENSUAL — 
\${nombreMes} 2026
\${grado} | \${materia}
Total: \${dias.length} clases

NORMATIVA DE REFERENCIA:
\${normativa}

Días a planificar:
\${dias.map((d: any, i: number) =>
  \`Clase \${i+1} — \${d.dia} \${d.fecha}\`
).join('\\n')}

Generá una clase completa por cada día listado.
ES OBLIGATORIO PRODUCIR LA CANTIDAD EXACTA DE CLASES SOLICITADAS. NO TE DETENGAS A MITAD DEL MES. DEBES GENERAR HASTA LA ÚLTIMA CLASE INDICADA EN LA LISTA SIN SALTEARTE LOS DÍAS.
IMPORTANTE: Aplicar el conocimiento pedagógico por grado (estrategias, tiempos y nivel de autonomía) definido en tus instrucciones de sistema. Respetar estrictamente la estructura de clase solicitada a continuación.

\${baseEstructura}`;

      const result = await model.generateContent(promptBase);
      contenido = result.response.text();
    }

    return NextResponse.json({ 
      contenido,
      tokensRestantes: tokenCheck.tokensRestantes
    });

  } catch(error) {
    console.error('Error API mensual:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
