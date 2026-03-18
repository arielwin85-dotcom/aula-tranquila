async function testV1() {
  const key = "AIzaSyDu9wYAGemyGI4uE6-rb0F80Ol8tApdVCQ";
  // Try v1 instead of v1beta
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hola" }] }]
      })
    });
    
    const data = await response.json();
    console.log("V1 STATUS:", response.status);
    console.log("V1 BODY:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("V1 FETCH ERROR:", e.message);
  }
}

testV1();
