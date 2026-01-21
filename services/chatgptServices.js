const fetch = require("node-fetch");

async function askChatGPT(message) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
              "Eres un asistente de una tienda online. Ayudas al cliente a encontrar productos.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}


module.exports = { askChatGPT };
