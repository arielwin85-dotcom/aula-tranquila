const { GoogleGenerativeAI } = require("@google/generative-ai");

async function list() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels(); // This might not be the correct way to call listModels
    // Correct way:
    // const models = await genAI.listModels(); // Method might vary by version
    
    // Let's try a different approach to see if we can just find it.
    console.log("Listing models...");
  } catch (e) {
    console.log("ERROR Listing:", e.message);
  }
}

list();
