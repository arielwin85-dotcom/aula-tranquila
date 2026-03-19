const dotenv = require('dotenv');
const path = require('path');

// Cargar .env.local manualmente para esta prueba
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function testApiDirectly() {
  console.log('--- TEST DE API LOCAL ---');
  console.log('API KEY cargada:', process.env.GEMINI_API_KEY ? 'SÍ (termina en ' + process.env.GEMINI_API_KEY.slice(-5) + ')' : 'NO');
  
  const payload = {
    messages: [{ role: 'user', content: 'Hola, estás ahí?' }],
    context: {
      aulaGrado: '1er Grado 2026',
      areaMateria: 'Lengua y Literatura',
      fechaInicio: '2026-03-18',
      cantClases: 5,
      userId: 'test-user-123'
    }
  };

  try {
    // Importamos dinámicamente el SDK de Google para probar la conectividad
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    
    console.log('Llamando a Gemini...');
    const result = await model.generateContent('Hola, responde brevemente');
    console.log('RESPUESTA EXITOSA:', result.response.text());
  } catch (error) {
    console.error('FALLO EN LA CONEXIÓN:', error.message);
  }
}

testApiDirectly();
