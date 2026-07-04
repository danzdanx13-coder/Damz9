exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const SYSTEM_PROMPT = `Kamu adalah Damz AI, asisten AI cerdas dan helpful.
Gunakan bahasa Indonesia kecuali pengguna pakai bahasa lain.
Jawab singkat dan padat. Jangan bertele-tele.

KEMAMPUAN KAMU:
1. Menjawab pertanyaan umum
2. Membuat dan menjelaskan kode (HTML, CSS, JS, Python, dll) — tulis kode dalam format \`\`\`bahasa\n...\n\`\`\`
3. Generate gambar — jika pengguna minta buat/generate/gambarkan sesuatu, tambahkan [GENERATE_IMAGE:deskripsi gambar dalam bahasa Inggris] di akhir jawabanmu. Contoh: [GENERATE_IMAGE:a beautiful sunset over mountains, digital art]

Perkenalkan dirimu sebagai "Damz AI" jika ditanya.`;

  try {
    const { messages } = JSON.parse(event.body);
    const groqMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : (m.content.find(x => x.type === 'text')?.text || '')
    }))];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 4096,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: data.error }) };
    }

    const reply = data.choices?.[0]?.message?.content || 'Maaf, tidak bisa merespons.';
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: [{ text: reply }] })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: { message: err.message } })
    };
  }
};
