const Category = require("../models/Category");
const Product = require("../models/Product");

const handleChat = async (req, res) => {
  try {
    const text = String(
      req.body?.message ||
        req.body?.text ||
        req.body?.messages?.at(-1)?.text ||
        "",
    )
      .toLowerCase()
      .trim();

    // Saludo inicial
    if (!text || text === "hola") {
      const rootCategories = await Category.find({
        parentName: "Home",
        status: "show",
      });

      return res.send({
        type: "options",
        text: "Hola, ¿Qué tipo de categoría estás buscando?",
        options: rootCategories.map((c) => ({
          label: c.name?.es,
          value: c._id,
        })),
      });
    }

    const categories = await Category.find({ status: "show" });

    const words = text.split(/\s+/);
    let category = categories.find((cat) => {
      const name = cat.name?.es?.toLowerCase();
      return name && words.some((word) => name.includes(word));
    });

    if (category) {
      const subcategories = await Category.find({
        parentId: category._id,
        status: "show",
      });

      if (subcategories.length > 0) {
        return res.send({
          type: "options",
          text: `Estas son las subcategorías de ${category.name.es}:`,
          options: subcategories.map((c) => ({
            label: c.name.es,
            value: c._id,
          })),
        });
      }

      const products = await Product.find({ categoryId: category._id });
      return res.send({
        type: "text",
        text: `Tenemos ${products.length} productos en ${category.name.es}.`,
      });
    }

    const rootCategories = await Category.find({
      parentId: { $in: [null, ""] },
      status: "show",
    });

    return res.send({
      type: "options",
      text: `No encontré lo que buscas: "${text}". ¿Qué categoría te interesa?`,
      options: rootCategories.map((c) => ({
        label: c.name.es,
        value: c._id,
      })),
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).send({
      type: "text",
      text: "Ocurrió un error, intenta nuevamente.",
    });
  }
};

module.exports = { handleChat };
