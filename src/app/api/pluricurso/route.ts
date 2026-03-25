import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getClassrooms } from '@/lib/db';
import { Classroom, Subject } from '@/types';
import { descontarTokensServer } from '@/lib/tokens-server';

const SYSTEM_PROMPT = `Sos un Experto Pedagógico de Nivel Mundial 
en diseño curricular argentino con 20 años 
de experiencia en aulas de primaria (1° a 7°).

Tu función es realizar una transposición didáctica profesional para un PLURICURSO: 
tomás documentos normativos oficiales de DOS GRADOS DISTINTOS y los transformás 
en una única planificación anual integrada. 

El objetivo es enseñar una misma temática general pero con actividades y 
niveles de profundidad acordes a cada grado de forma simultánea.

CONTEXTO DEL DOCENTE (PLURICURSO):
- Grado A: [GRADO_A]
- Grado B: [GRADO_B]
- Materia: [MATERIA]
- Ciclo lectivo: [CICLO]

Normativa Grado A:
---
[NORMATIVA_A]
---

Normativa Grado B:
---
[NORMATIVA_B]
---

═══════════════════════════════════════════════
REGLA FUNDAMENTAL — LA NORMATIVA ES LA BASE
═══════════════════════════════════════════════

TODO el contenido que generés debe estar extraído y fundamentado en la normativa.
Debes encontrar TEMAS EN COMÚN (Ejes) entre ambas normativas para enseñarlos 
en simultáneo, pero diferenciando el contenido específico y la actividad 
para cada grado.

═══════════════════════════════════════════════
REGLAS INNEGOCIABLES DE CALIDAD
═══════════════════════════════════════════════

1. Sin saludos ni presentaciones — ir directo al documento
2. Sin teoría vacía — solo qué dar y cómo darlo
3. Todo contenido extraído de la normativa — nunca inventado
4. Siempre indicar claramente qué hace el [GRADO_A] y qué hace el [GRADO_B]
5. Proponer estrategias de atención alterna (ej: mientras Grado A lee 
   autónomamente, el docente explica a Grado B)
6. Respetar el calendario escolar argentino:
   - Marzo: inicio, diagnóstico, acuerdos
   - Abril a Junio: primer trimestre
   - Julio: receso — NO incluir
   - Agosto a Octubre: segundo trimestre
   - Noviembre a Diciembre: cierre anual

═══════════════════════════════════════════════
ESTRUCTURA OBLIGATORIA DEL DOCUMENTO
═══════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PLANIFICACIÓN ANUAL PLURICURSO [CICLO]
### [GRADO_A] Y [GRADO_B] | [MATERIA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 1. FUNDAMENTACIÓN DEL PLURICURSO

[Mínimo 300 palabras explicando cómo se integrarán ambos grados en esta materia, 
basándose en las normativas provistas]

---

## 2. PROPÓSITOS DEL DOCENTE

[6 propósitos integrales que apliquen a ambos grupos]

---

## 3. CUADRO DE PLANIFICACIÓN PROGRESIVA INTEGRADA

| Período | Eje/Bloque Temático Integrador | Contenidos [GRADO_A] | Contenidos [GRADO_B] | Estrategia Pluricurso |
|---------|--------------------------------|----------------------|----------------------|-----------------------|

PERÍODOS A INCLUIR (sin julio):
Marzo / Abril / Mayo / Junio / Agosto / Septiembre / Octubre / Noviembre / Diciembre

REGLAS PARA CADA CELDA:
- EJE/BLOQUE: Encontrar un tema paraguas que una ambas normativas.
- CONTENIDOS: Extraídos de la respectiva normativa para cada grado.
- ESTRATEGIA PLURICURSO: Cómo se organiza la clase física (ej. "Introducción conjunta, luego A hace X y B hace Y").

---

## 4. PROPUESTA DE EJERCITACIÓN POR EJE INTEGRADOR

Por CADA eje o bloque temático del cuadro anterior generar:

### [Nombre del Eje Integrador]

**ACTIVIDAD 1 — INICIO CONJUNTO**
Nombre: [creativo]
Propósito común: [qué aprenden juntos]
Descripción: [paso a paso de apertura para toda el aula]

**ACTIVIDAD 2 — DESARROLLO DIFERENCIADO**
Cómo se divide el aula:
- PARA [GRADO_A]: [Actividad específica basada en su normativa]
- PARA [GRADO_B]: [Actividad específica basada en su normativa]
Rol del docente: [Cómo intercala su atención]

**ACTIVIDAD 3 — CIERRE Y PUESTA EN COMÚN**
Descripción: [Cómo comparten lo aprendido entre niveles]

---

## 5. CRITERIOS DE EVALUACIÓN DIFERENCIADOS

| Capacidad a Evaluar | Indicador [GRADO_A] | Indicador [GRADO_B] |
|---------------------|---------------------|---------------------|

[Incluir al menos 5 capacidades extraídas de las normativas]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTÁNDAR DE CALIDAD MÍNIMO:
- Cuadro: exactamente 9 períodos
- Todo contenido debe estar adaptado a la edad correspondiente de cada grado.
- Prohibido actividades inconexas: ambas clases deben parecer estar estudiando lo mismo pero a distinto nivel.
`;

export async function POST(request: Request) {
  try {
    const { classroomIdA, classroomIdB, subjectId, regulationA, regulationB, planType } = await request.json();

    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classrooms = await getClassrooms(userId);
    const classroomA = classrooms.find((c: Classroom) => c.id === classroomIdA);
    const classroomB = classrooms.find((c: Classroom) => c.id === classroomIdB);
    
    if (!classroomA || !classroomB) {
      return NextResponse.json({ error: 'Aula no encontrada' }, { status: 403 });
    }

    const subjectA = classroomA.subjects.find((s: Subject) => s.id === subjectId);
    const subjectB = classroomB.subjects.find((s: Subject) => s.id === subjectId);
    
    // Asumimos que la materia tiene el mismo nombre, o tomamos el nombre de la primera
    const subjectName = subjectA?.name || subjectB?.name;

    if (!subjectName) {
      return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta la API Key de Gemini' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { maxOutputTokens: 8192 }
    });

    const prompt = SYSTEM_PROMPT
      .replace(/\[GRADO_A\]/g, String(classroomA.grade))
      .replace(/\[GRADO_B\]/g, String(classroomB.grade))
      .replace(/\[MATERIA\]/g, String(subjectName))
      .replace(/\[CICLO\]/g, String(classroomA.year))
      .replace(/\[NORMATIVA_A\]/g, String(regulationA))
      .replace(/\[NORMATIVA_B\]/g, String(regulationB));

    // Descuento de 8 tokens para plural
    const tokenCheck = await descontarTokensServer(
      userId, 
      8, 
      'ia_plan_anual_pluricurso', 
      `Pluricurso Anual: ${classroomA.grade} y ${classroomB.grade} - ${subjectName}`
    );

    if (!tokenCheck.ok) {
      if (tokenCheck.error === 'sin_tokens') {
         return NextResponse.json({ 
           error: 'Tokens insuficientes. El pluricurso anual requiere 8 tokens.', 
           details: 'NECESITAS_TOKENS',
           disponibles: tokenCheck.tokensRestantes 
         }, { status: 403 });
      }
      return NextResponse.json({ error: tokenCheck.error }, { status: 500 });
    }

    const result = await model.generateContent(prompt);
    const textReply = result.response.text();

    return NextResponse.json({ 
      plan: textReply,
      tokensRestantes: tokenCheck.tokensRestantes 
    });

  } catch (error) {
    console.error('Pluricurso API Error:', error);
    return NextResponse.json({ error: 'Error al generar la planificación pluricurso' }, { status: 500 });
  }
}
