const Category = require("../models/Category");
const Product = require("../models/Product");
const { askChatGPT } = require("../services/chatgptServices");

function normalizeUserMessage(text) {
  if (!text) return null;

  const clean = text
    .toLowerCase()
    .replace(/[^a-záéíóúñ\s]/gi, "")
    .trim();

  if (clean.length < 3) return null;

  return clean;
}

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

    const normalizedText = normalizeUserMessage(text);

    if (!normalizedText) {
      return res.send({
        errors: [],
        data: {
          reply: "¿Podrías escribir un poco más para ayudarte mejor? ",
          products: [],
          context: {
            intent: "unknown",
            ambiguous: true,
            options: [],
          },
        },
      });
    }
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

    let category = categories.find(
      (cat) => cat.name?.es?.toLowerCase() === normalizedText,
    );

    if (!category) {
      const words = normalizedText.split(/\s+/);

      category = categories.find(
        (cat) =>
          cat.name?.es?.toLowerCase() &&
          words.some((word) => cat.name.es.toLowerCase().includes(word)),
      );
    }

    if (category) {
      const subcategories = await Category.find({
        parentId: category._id,
        status: "show",
      });

      if (subcategories.length > 0) {
        return res.send({
          errors: [],
          data: {
            reply: `Estas son las subcategorías de ${category.name.es}:`,
            products: [],
            context: {
              intent: "select_subcategory",
              category: category.name.es.toLowerCase(),
              ambiguous: false,
              options: subcategories.map((c) => ({
                label: c.name.es,
                value: c._id,
              })),
            },
          },
        });
      }

      const products = await Product.find({
        category: category._id,
        status: "show",
      }).lean();

      const aiProducts = products.slice(0, 15).map((p, index) => ({
        index: index + 1,
        name: p.title?.es || p.name,
        price: p.prices?.price || p.price,
      }));
      const prompt = `
Consulta del usuario: "${normalizedText}"

Productos disponibles:
${aiProducts.map((p) => `${p.index}. ${p.name} (${p.price})`).join("\n")}

Devuelve SOLO los números de los productos relevantes.
`;
      const aiResponse = await askChatGPT({
        message: prompt,
      });
      const indexes =
        aiResponse?.match(/\d+/g)?.map((n) => parseInt(n, 10) - 1) || [];

      const filteredProducts = indexes.map((i) => products[i]).filter(Boolean);

      if (filteredProducts.length === 0) {
        filteredProducts.push(...products.slice(0, 3));
      }

      const replyText = filteredProducts
        .map(
          (p, i) =>
            `${i + 1}. ${p.title?.es || p.name} (${p.prices?.price || p.price})`,
        )
        .join("\n");
      return res.send({
        errors: [],
        data: {
          reply: replyText,
          products: filteredProducts.map((p) => ({
            id: p._id,
            name: p.title?.es || p.name,
            price: p.prices?.price || p.price,
            category: category.name.es,
            color: p.color || null,
          })),
          context: {
            intent: "search_product",
            category: category.name.es.toLowerCase(),
            ambiguous: false,
            options: [],
          },
        },
      });
    }

    const rootCategories = await Category.find({
      parentId: { $in: [null, ""] },
      status: "show",
    });

    return res.send({
      errors: [],
      data: {
        reply: `No encontré lo que buscas: "${normalizedText}". ¿Qué categoría te interesa?`,
        products: [],
        context: {
          intent: "select_category",
          category: null,
          ambiguous: true,
          options: rootCategories.map((c) => ({
            label: c.name.es,
            value: c._id,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).send({
      errors: [{ message: "Ocurrió un error, intenta nuevamente." }],
      data: {
        reply: "Ocurrió un error, intenta nuevamente.",
        products: [],
        context: {},
      },
    });
  }
};

module.exports = { handleChat };
