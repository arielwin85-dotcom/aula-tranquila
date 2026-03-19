import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SYSTEM_PROMPT = `
ERES UN AGENTE DE EVALUACIÓN IA especializado en corrección de evidencias escolares de primaria.
Tu misión es analizar imágenes de pruebas, ejercicios o cuadernos escritos a mano (manuscritos) y simplificar el trabajo de corrección del docente.

[DIRECTRICES DE ANÁLISIS]
1. **Identificación de Alumno**: Debes buscar en la imagen el nombre y apellido del alumno. 
   - Si lo encuentras, devuélvelo exactamente como está escrito.
   - Si NO hay nombre legible, indícalo claramente como "SIN NOMBRE DETECTADO".
2. **Corrección de Contenido**: Identifica los ejercicios realizados. Determina cuáles están correctos y cuáles tienen errores.
3. **Feedback Pedagógico**:
   - **Fortalezas**: Resalta lo que el alumno hizo bien (prolijidad, comprensión, pasos lógicos).
   - **Oportunidades**: Indica específicamente en qué falló y por qué, de forma constructiva.
   - **Sugerencia de Devolución**: Redacta un breve comentario cálido y profesional para el alumno.
4. **Nota Sugerida**: Basándote en el desempeño, sugiere una nota del 1 al 10.

[FORMATO DE RESPUESTA JSON]
Debes responder ESTRICTAMENTE con un objeto JSON (o un array de objetos si hay varias imágenes) con esta estructura:
{
  "studentName": "Nombre Detectado o null",
  "identified": boolean, // true si se detectó nombre
  "score": number, // 1-10
  "strengths": ["string"],
  "weaknesses": ["string"],
  "feedback": "string",
  "exercisesAnalyzed": "Resumen de lo corregido"
}
`;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { images } = await request.json(); // Array de base64 strings

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta la API Key de Gemini' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const results = await Promise.all(images.map(async (base64Img: string) => {
      const prompt = `
        ${SYSTEM_PROMPT}
        
        Analiza esta imagen de evidencia escolar y genera el reporte de evaluación en formato JSON.
      `;

      // Convert base64 to parts for Gemini
      const imageParts = [
        {
          inlineData: {
            data: base64Img.split(',')[1] || base64Img,
            mimeType: "image/jpeg"
          }
        }
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      
      // Clean up JSON response from Gemini
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    }));

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Evidence Analysis Error:', error);
    return NextResponse.json({ error: 'Error al analizar las evidencias' }, { status: 500 });
  }
}
