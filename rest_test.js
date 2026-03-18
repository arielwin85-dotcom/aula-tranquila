async function testRest() {
  const key = "AIzaSyDDeKFhuVJLn7EpeaAnj7qLPBcpr_yfhNs";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hola" }] }]
      })
    });
    
    const data = await response.json();
    console.log("STATUS:", response.status);
    console.log("BODY:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("FETCH ERROR:", e.message);
  }
}

testRest();
