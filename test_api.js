const API_KEY = 'AIzaSyC3dIKyI2k3EEZ-z3B0B2fnuftKP_CmVPo';

async function test() {
  console.log('Testing NEW API Key with gemini-2.0-flash...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Responde solo con la palabra: FUNCIONANDO' }] }]
    })
  });
  const data = await res.json();
  console.log('Status:', res.status);
  if (res.ok && data.candidates) {
    console.log('✅ AI RESPONSE:', data.candidates[0]?.content?.parts?.[0]?.text);
  } else {
    console.log('❌ ERROR:', JSON.stringify(data.error?.message || data, null, 2));
  }
}

test();
