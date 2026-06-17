async function test() {
  const geminiKey = process.env.VITE_GEMINI_API_KEY;
  if (!geminiKey) {
    console.log("No API key found in .env");
    return;
  }

  console.log("Testing with key:", geminiKey.substring(0, 10) + "...");

  // Send a tiny 1x1 black pixel base64 image
  const base64 = "R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Analyze this image. Does it contain actual garbage, trash, litter, or illegal dumping? If the image shows a plain wall, a ceiling, a person, or normal clean objects, YOU MUST RETURN EXACTLY: {"isGarbage": false}. If it DOES contain garbage, return JSON: {"isGarbage": true, "category": "Plastic/E-Waste/Organic/Metal/Mixed", "severity": "Low/Medium/High"}' },
            { inlineData: { mimeType: 'image/jpeg', data: base64 } }
          ]
        }],
        generationConfig: { temperature: 0.1 }
      })
    });
    
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
