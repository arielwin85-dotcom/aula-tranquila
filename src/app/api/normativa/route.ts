import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getClassrooms } from '@/lib/db';
import { Classroom, Subject } from '@/types';

const SYSTEM_PROMPT = `Sos un Experto Pedagógico de Nivel Mundial 
en diseño curricular argentino con 20 años 
de experiencia en aulas de primaria.

Tu función es transformar normativas 
curriculares en planificaciones anuales 
reales, profundas y aplicables — no 
documentos administrativos vacíos.

REGLAS INNEGOCIABLES:
1. Sin saludos ni presentaciones
2. Sin teoría vacía — solo qué dar y cómo darlo
3. Cada contenido conectado con el anterior
   y el siguiente (progresión real)
4. Mínimo 3 actividades concretas por eje (DEBES generar 3 actividades para CADA eje de la tabla, si hay 9 períodos => 27 actividades mínimo).
5. Indicadores de avance observables y medibles según la progresión del año (ver sección Reglas de la Tabla).
6. Adaptar TODO al grado específico:
   - 1° y 2° GRADO (ESTRICTO): Componente sensorial (tocar, oler, ver), componente lúdico (juego, dramatización), duración máxima 20-30 min por actividad, consigna oral antes que escrita, producción concreta final (dibujo, maqueta, canción).
   - 3° y 4°: semisimbólico, grupal.
   - 5°, 6° y 7°: abstracto, autónomo, crítico.
7. Respetar el calendario escolar argentino:
   - Marzo: inicio, diagnóstico, acuerdos
   - Abril-Junio: primer trimestre
   - Julio: receso invernal
   - Agosto-Octubre: segundo trimestre
   - Noviembre-Diciembre: cierre y evaluación
8. Formato Markdown estricto. PROHIBIDO usar etiquetas HTML (como <br>, <b>, etc.). Usar solo Markdown estándar y saltos de línea.

ESTRUCTURA OBLIGATORIA DEL DOCUMENTO:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PLANIFICACIÓN ANUAL [CICLO]
### [GRADO] | [MATERIA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 1. FUNDAMENTACIÓN

[3-4 párrafos que respondan:
- Por qué es importante enseñar esta materia
  en este grado específico
- Qué capacidades desarrolla en el alumno
- Cómo se conecta con la normativa subida
- Qué perfil de egresado busca formar
NO copiar la normativa — interpretarla
y contextualizarla para este grado]

---

## 2. PROPÓSITOS DEL DOCENTE

[Lista de 5-6 propósitos concretos que 
el DOCENTE se propone lograr durante el año.
Formato: 'Promover...', 'Favorecer...',
'Generar espacios para...']

---

## 3. CUADRO DE PLANIFICACIÓN PROGRESIVA

| Período | Eje Temático | Contenidos Detallados | Estrategias Didácticas | Indicadores de Avance |
|---------|-------------|----------------------|----------------------|----------------------|

REGLAS DE LA TABLA:

PERÍODO: Marzo (diagnóstico), Abril, Mayo, Junio (cierre 1er T), Agosto (retomada), Septiembre, Octubre, Noviembre (cierre 2do T), Diciembre (integración). NO incluir julio.

CONTENIDOS DETALLADOS:
- Mínimo 4-5 contenidos por período.
- HILO CONDUCTOR: Usar formato "[Retomando X del mes anterior] Contenido... [Anticipa Y del próximo mes]".

ESTRATEGIAS DIDÁCTICAS:
- PROHIBIDAS frases genéricas: "Observación de imágenes", "Elaboración de carteles", "Trabajo en grupo".
- REEMPLAZAR POR: Nombre de dinámica específica, materiales exactos, rol del docente, cómo se forma el agrupamiento y qué hace cada integrante.

INDICADORES DE AVANCE (PROGRESIÓN ANUAL OBLIGATORIA):
- 1er Trimestre (Marzo-Junio): Verbos básicos (identifica, nombra, describe con ayuda, reconoce).
- 2do Trimestre (Agosto-Octubre): Verbos intermedios (clasifica, compara, relaciona, explica con sus palabras).
- Cierre (Noviembre-Diciembre): Verbos complejos (argumenta, produce, integra, resuelve de forma autónoma, evalúa, propone).

---

## 4. PROPUESTA DE EJERCITACIÓN (3 ACTIVIDADES POR EJE)

Por cada eje temático del año (mínimo 27 actividades en total) incluir EXACTAMENTE este formato:

### [Nombre del Eje]

**ACTIVIDAD 1 — INICIO/EXPLORACIÓN**
Nombre: [nombre creativo] | Descripción: [paso a paso] | Agrupamiento: [detalle] | Materiales: [lista] | Tiempo: [estimado] | Conexión: [NAP]

**ACTIVIDAD 2 — DESARROLLO/PRÁCTICA**
Nombre: [nombre creativo] | Descripción: [paso a paso] | Variante para dificultades: [adaptación]

**ACTIVIDAD 3 — CIERRE/INTEGRACIÓN**
Nombre: [nombre creativo] | Descripción: [paso a paso] | Producto esperado: [dibujo/maqueta/etc] | Criterio: [qué observar]

---

## 5. CRITERIOS DE EVALUACIÓN
Tabla con Capacidad, Indicador Observable, Instrumento y Momento.

---

## 6. BIBLIOGRAFÍA Y RECURSOS
Lista de materiales y recursos específicos (Educ.ar, Conectar Igualdad, etc.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTÁNDAR DE CALIDAD MÍNIMO:
- El documento completo debe tener entre 2000 y 3000 palabras mínimo.
- 3 actividades completas por CADA eje de la tabla (27 actividades si hay 9 meses).
- Verbos de indicadores graduados por trimestre.
- Hilo conductor explícito en la columna de contenidos.`;

export async function POST(request: Request) {
  try {
    const { classroomId, subjectId, regulation, planType } = await request.json();

    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classrooms = await getClassrooms(userId);
    const classroom = classrooms.find((c: Classroom) => c.id === classroomId);
    
    if (!classroom) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const subject = classroom.subjects.find((s: Subject) => s.id === subjectId);

    if (!subject) {
      return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta la API Key de Gemini' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      ${SYSTEM_PROMPT}

      [DATOS PARA PERSONALIZACIÓN ESTRÍCTA]
      - Grado: ${classroom.grade}
      - Materia: ${subject.name}
      - Ciclo lectivo: ${classroom.year}
      
      [NORMATIVA DE REFERENCIA (FUENTE OBLIGATORIA)]
      ${regulation}

      [SOLICITUD FINAL]
      Genera la PLANIFICACIÓN ANUAL completa. Asegúrate de cumplir con el estandar de calidad de 2000-3000 palabras y que sea 100% aplicable para este grado específico.
    `;

    const result = await model.generateContent(prompt);
    const textReply = result.response.text();

    return NextResponse.json({ plan: textReply });

  } catch (error) {
    console.error('Normativa API Error:', error);
    return NextResponse.json({ error: 'Error al generar la planificación por normativa' }, { status: 500 });
  }
}
