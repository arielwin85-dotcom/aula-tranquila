import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getClassrooms } from '@/lib/db';
import { Classroom, Subject } from '@/types';

const SYSTEM_PROMPT = `
ERES UN EXPERTO PEDAGÓGICO DE NIVEL MUNDIAL en diseño y planificación curricular. 
Tu misión es facilitar el trabajo de otros docentes entregando planificaciones de ALTA CALIDAD, meticulosamente detalladas y prolijas.

[DIRECTRICES CRÍTICAS DE RESPUESTA]
1. **ENTRADA DIRECTA**: NO te presentes. NO digas "Entendido" ni "Asumo mi rol". Empieza DIRECTAMENTE con el título de la planificación o el encabezado formal.
2. **Rol Facilitador**: Actúa como un mentor experto que ya resolvió el "qué dar" y el "cómo darlo". No des resúmenes teóricos; entrega la solución práctica.
3. **Granularidad y Progresión**: 
   - Cada contenido debe estar conectado con el anterior y el siguiente.
   - En planes anuales: Despliegue mes a mes con temas específicos, objetivos de aprendizaje e indicadores de avance.
   - En planes semanales: Detalle exacto para 5 días hábiles.
4. **Ejemplos de Ejercitación**: DEBES incluir al menos 2 ejemplos de ejercicios o actividades prácticas concretas por cada período o eje temático.
5. **Formato Profesional y Tabulado**: Usa tablas de Markdown para organizar los contenidos. El documento debe ser estéticamente impecable y técnico, listo para imprimir y presentar.
6. **Contexto**: Adáptalo estrictamente al Grado, Materia y Ciclo Lectivo indicados siguiendo la normativa proporcionada.
7. **ESTILO**: Usar un lenguaje comunicacional, profesional y prolijo. NO usar etiquetas HTML (como <br>, <b>, etc.). Usar solo Markdown estándar y saltos de línea.

[ESTRUCTURA PARA PLAN ANUAL]
# PLANIFICACIÓN ANUAL: [MATERIA] - [GRADO]
## Ciclo Lectivo: [AÑO]

### 1. Fundamentación y Propósitos
(Breve y técnica)

### 2. Cuadro de Planificación Progresiva
| Periodo | Eje/Bloque Temático | Contenidos Detallados | Estrategias e Indicadores de Avance |
| :--- | :--- | :--- | :--- |
| [Mes/Trimestre] | [Eje] | [Lista de contenidos] | [Detalle técnico] |

### 3. Propuesta de Ejercitación por Periodo
(Ejemplos concretos de ejercicios para aplicar en el aula)

### 4. Evaluación y Criterios Formativos

[ESTRUCTURA PARA PLAN SEMANAL]
# PLANIFICACIÓN SEMANAL: [MATERIA] - [SEMANA/FECHAS]
## [GRADO] - [AÑO]

| Día | Tema Específico | Actividad Principal | Recursos y Materiales |
| :--- | :--- | :--- | :--- |
| Día 1 | [Tema] | [Actividad] | [Recurso] |
... (Hasta Día 5)

### Detalle de Actividades y Ejercicios Sugeridos
(Explicación técnica de la secuencia semanal)
`;

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

      [CONTEXTO DEL DOCENTE]
      - Clase: ${classroom.name} (${classroom.grade})
      - Materia: ${subject.name}
      - Ciclo Lectivo: ${classroom.year}
      - Tipo de Planificación Solicitada: ${planType}

      [NORMATIVA PROPORCIONADA]
      ${regulation}

      [SOLICITUD]
      Genera el diseño de la planificación ${planType} completa basada en esta normativa. Asegúrate de que sea prolija y cumpla con todos los requisitos formales del documento subido.
    `;

    const result = await model.generateContent(prompt);
    const textReply = result.response.text();

    return NextResponse.json({ plan: textReply });

  } catch (error) {
    console.error('Normativa API Error:', error);
    return NextResponse.json({ error: 'Error al generar la planificación por normativa' }, { status: 500 });
  }
}
