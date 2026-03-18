const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const genAI = new GoogleGenerativeAI("AIzaSyDu9wYAGemyGI4uE6-rb0F80Ol8tApdVCQ");
  try {
    // The listModels method is typically on the genAI object or requires a specific client
    // In newer SDKs it might be different. Let's try the direct REST approach if SDK fails.
    console.log("Checking API Key validity...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Response:", result.response.text());
  } catch (e) {
    console.log("Error Detail:", JSON.stringify(e, null, 2));
    if (e.message.includes("404")) {
        console.log("MODEL NOT FOUND OR API KEY NOT PERMITTED FOR THIS MODEL");
    }
  }
}

run();
