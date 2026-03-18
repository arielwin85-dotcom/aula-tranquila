async function listModels() {
  const key = "AIzaSyDu9wYAGemyGI4uE6-rb0F80Ol8tApdVCQ";
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("LIST STATUS:", response.status);
    console.log("LIST BODY:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("LIST ERROR:", e.message);
  }
}

listModels();
