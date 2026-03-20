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
4. Mínimo 3 actividades concretas por eje
5. Indicadores de avance observables
   y medibles — no frases genéricas
6. Adaptar TODO al grado específico:
   - 1° y 2°: concreto, lúdico, sensorial
   - 3° y 4°: semisimbólico, grupal
   - 5°, 6° y 7°: abstracto, autónomo, crítico
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

Usar esta tabla con el siguiente nivel 
de detalle por cada período:

| Período | Eje Temático | Contenidos Detallados | Estrategias Didácticas | Indicadores de Avance |
|---------|-------------|----------------------|----------------------|----------------------|

REGLAS DE LA TABLA:

PERÍODO:
- Marzo (2 semanas útiles — diagnóstico)
- Abril
- Mayo
- Junio (cierre 1er trimestre)
- Agosto (retomada — reactivación)
- Septiembre
- Octubre
- Noviembre (cierre 2do trimestre)
- Diciembre (integración anual)
NO incluir julio (receso)

EJE TEMÁTICO:
- Nombre claro y específico
- NO genérico como 'Números' sino
  'Sistema de numeración hasta 10.000'

CONTENIDOS DETALLADOS:
- Mínimo 4-5 contenidos por período
- Específicos y graduados en complejidad
- Con nivel de profundidad esperado

ESTRATEGIAS DIDÁCTICAS:
- Técnicas concretas y aplicables
- Al menos una lúdica o colaborativa
- Nombrar el tipo de agrupamiento
  (individual, parejas, pequeño grupo)
- Materiales específicos a usar

INDICADORES DE AVANCE:
- Verbos observables: identifica, produce,
  compara, resuelve, explica, crea, argumenta
- Con nivel de autonomía esperado
- NUNCA usar: 'comprende', 'sabe', 'conoce'

---

## 4. PROPUESTA DE EJERCITACIÓN POR EJE

Por cada eje temático del año incluir
EXACTAMENTE este formato:

### [Nombre del Eje]

**ACTIVIDAD 1 — INICIO/EXPLORACIÓN**
Nombre: [nombre creativo y memorable]
Descripción: [paso a paso de cómo se hace]
Agrupamiento: [individual/parejas/grupo]
Materiales: [lista específica]
Tiempo: [estimado]
Conexión curricular: [NAP o eje que trabaja]

**ACTIVIDAD 2 — DESARROLLO/PRÁCTICA**
Nombre: [nombre creativo]
Descripción: [paso a paso]
Agrupamiento: [...]
Materiales: [...]
Tiempo: [...]
Variante para dificultades: [cómo adaptar]

**ACTIVIDAD 3 — CIERRE/INTEGRACIÓN**
Nombre: [nombre creativo]
Descripción: [paso a paso]
Producto esperado: [qué produce el alumno]
Criterio de evaluación: [qué observar]

---

## 5. CRITERIOS DE EVALUACIÓN

Tabla con criterios formativos y sumativos:

| Capacidad | Indicador Observable | Instrumento | Momento |
|-----------|---------------------|-------------|---------|

MOMENTOS: Diagnóstico / Proceso / Cierre
INSTRUMENTOS concretos (rúbricas, portfolio, etc.)

---

## 6. BIBLIOGRAFÍA Y RECURSOS

[Lista de materiales, libros, plataformas
y recursos digitales específicos para
este grado y materia. Incluir recursos
gratuitos disponibles en Argentina:
Educ.ar, Conectar Igualdad, etc.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTÁNDAR DE CALIDAD MÍNIMO:
- Fundamentación: mínimo 300 palabras
- Cuadro: mínimo 9 períodos con 
  4-5 contenidos cada uno
- Actividades: mínimo 3 por eje temático
- Indicadores: siempre con verbo observable
- El documento completo debe tener entre
  2000 y 3000 palabras mínimo
- Un docente debe poder USAR este documento
  directamente sin buscar nada más`;

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
