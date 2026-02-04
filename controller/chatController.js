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
      const categoryPrompt = `
Texto del usuario: "${normalizedText}"

Categorías disponibles:
${categories.map((c, i) => `${i + 1}. ${c.name.es}`).join("\n")}

De esta lista de categorías, dime cuál coincide mejor con lo que el usuario quiso decir.
Devuelve SOLO el número de la categoría.
Si ninguna coincide, responde "ninguna".
`;

      const aiCategoryResponse = await askChatGPT({
        message: categoryPrompt,
      });

      if (aiCategoryResponse !== "ninguna") {
        const index = parseInt(aiCategoryResponse, 10) - 1;

        if (!isNaN(index) && categories[index]) {
          category = categories[index];
        }
      }

      if (!category) {
        const words = normalizedText.split(/\s+/);
        category = categories.find(
          (cat) =>
            cat.name?.es?.toLowerCase() &&
            words.some((word) => cat.name.es.toLowerCase().includes(word)),
        );
      }
    }
    if (category) {
      const words = normalizedText.split(/\s+/);
      const categoryName = category.name.es.toLowerCase();

      const hasRelation = words.some((word) => categoryName.includes(word));

      if (!hasRelation) {
        category = null;
      }
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
      if (products.length === 0) {
        return res.send({
          errors: [],
          data: {
            reply: `Encontré la categoría "${category.name.es}", pero todavía no tenemos productos disponibles en esta sección.`,
            products: [],
            context: {
              intent: "empty_category",
              category: category.name.es.toLowerCase(),
              ambiguous: false,
              options: [],
            },
          },
        });
      }
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

      const productList = filteredProducts
        .map(
          (p, i) =>
            `${i + 1}. ${p.title?.es || p.name} (${p.prices?.price || p.price})`,
        )
        .join("\n");

      const replyText = `Estos son los productos que tenemos:\n\n${productList}\n\n`;
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
        reply: `No encontré lo que buscas: "${normalizedText}". Escoge las siguientes opciones:`,
        products: [],
        context: {
          intent: "search_product",
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
