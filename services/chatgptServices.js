const fetch = require("node-fetch");

async function askChatGPT({ message }) {
  const response = await fetch(process.env.OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5055",
      "X-Title": "Ecommerce Chatbot",
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente de ecommerce. Devuelves SOLO índices numéricos.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

module.exports = { askChatGPT };
