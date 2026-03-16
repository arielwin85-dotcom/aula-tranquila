const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // There isn't a direct listModels in the high level SDK easily, 
    // but we can try a few specific names.
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.5-flash-latest"];
    
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("hi");
        console.log(`Model ${m} is WORKING`);
        return;
      } catch (e) {
        console.log(`Model ${m} FAILED: ${e.message}`);
      }
    }
  } catch (err) {
    console.error("General error:", err);
  }
}

listModels();
