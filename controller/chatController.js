
const handleChat = async (req, res) => {
  try {
   
    const messages = req.body.messages || [];
    const lastMessage = messages[messages.length - 1];
    const text = String(lastMessage?.text || "").toLowerCase().trim();

   
    if (!text || text === "hola") {
      return res.send({
        type: "options",
        text: "Hola, ¿qué productos estás buscando?",
        options: [
          { label: "Alimentos", value: "alimentos" },
          { label: "Belleza y Salud", value: "0A8A" },
          { label: "Herramientas para el hogar", value: "0B49" },
          { label: "Cuidado de mascotas", value: "0B0E" },
        ],
      });
    }

    if (text === "alimentos") {
      return res.send({
        type: "options",
        text: "¿Qué tipo de alimentos estás buscando?",
        options: [
          { label: "Frutas y verduras", value: "0BE8" },
          { label: "Pescado y carne", value: "0C24" },
          { label: "Bebidas", value: "09C1" },
        ],
      });
    }

    
    if (["0be8", "0c24", "09c1"].includes(text)) {
      return res.send({
        text: "Tenemos productos disponibles en esta categoría.",
      });
    }

    
    return res.send({
      text: "No entendí tu mensaje. Por favor, elige una opción.",
    });

  } catch (err) {
    return res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  handleChat,
};