const Category = require("../models/Category");
const Product = require("../models/Product");
const { askChatGPT } = require("../services/chatgptServices");

const GENERIC_ERROR_MESSAGE = "Ocurrió un error, intenta nuevamente.";

function normalizeUserMessage(text) {
  if (!text) return null;

  const clean = text
    .toLowerCase()
    .replace(/[^a-záéíóúñ\s]/gi, "")
    .trim();

  if (clean.length < 3) return null;

  return clean;
}
function sendChatResponse(res, reply, products = [], context = {}) {
  return res.send({
    errors: [],
    data: {
      reply,
      products,
      context,
    },
  });
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
      return sendChatResponse(
        res,
        "¿Podrías escribir un poco más para ayudarte mejor?",
        [],
        {
          intent: "unknown",
          ambiguous: true,
          options: [],
        },
      );
    }
    if (!text || text === "hola") {
      const rootCategories = await Category.find({
        parentName: "Home",
        status: "show",
      });

      return sendChatResponse(
        res,
        "Hola, ¿Qué tipo de categoría estás buscando?",
        [],
        {
          intent: "select_category",
          ambiguous: false,
          options: rootCategories.map((category) => ({
            label: category.name?.es,
            value: category._id,
          })),
        },
      );
    }

    const categories = await Category.find({ status: "show" });

    let category = categories.find(
      (cat) => cat.name?.es?.toLowerCase() === normalizedText,
    );

    if (!category) {
      const categoryPrompt = `
Texto del usuario: "${normalizedText}"

Categorías disponibles:
${categories.map((categoryItem, index) => `${index + 1}. ${categoryItem.name.es}`).join("\n")}

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
    } else {
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
        return sendChatResponse(
          res,
          `Estas son las subcategorías de ${category.name.es}:`,
          [],
          {
            intent: "select_subcategory",
            category: category.name.es.toLowerCase(),
            ambiguous: false,
            options: subcategories.map((subcategory) => ({
              label: subcategory.name.es,
              value: subcategory._id,
            })),
          },
        );
      }

      const products = await Product.find({
        category: category._id,
        status: "show",
      }).lean();
      if (products.length === 0) {
        return sendChatResponse(
          res,
          `Encontré la categoría "${category.name.es}", pero todavía no tenemos productos disponibles en esta sección.`,
          [],
          {
            intent: "empty_category",
            category: category.name.es.toLowerCase(),
            ambiguous: false,
            options: [],
          },
        );
      }
      const aiProducts = products.slice(0, 15).map((product, index) => ({
        index: index + 1,
        name: product.title?.es || product.name,
        price: product.prices?.price || product.price,
      }));
      const prompt = `
Consulta del usuario: "${normalizedText}"

Productos disponibles:
${aiProducts.map((productItem) => `${productItem.index}. ${productItem.name} (${productItem.price})`).join("\n")}

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
          (product, index) =>
            `${index + 1}. ${product.title?.es || product.name} (${product.prices?.price || product.price})`,
        )
        .join("\n");

      const replyText = `Estos son los productos que tenemos:\n\n${productList}\n\n`;
      return sendChatResponse(
        res,
        replyText,
        filteredProducts.map((product) => ({
          id: product._id,
          name: product.title?.es || product.name,
          price: product.prices?.price || product.price,
          category: category.name.es,
          color: product.color || null,
        })),
        {
          intent: "search_product",
          category: category.name.es.toLowerCase(),
          ambiguous: false,
          options: [],
        },
      );
    }

    const rootCategories = await Category.find({
      parentId: { $in: [null, ""] },
      status: "show",
    });

    return sendChatResponse(
      res,
      `No encontré lo que buscas: "${normalizedText}". Escoge las siguientes opciones:`,
      [],
      {
        intent: "select_category",
        category: null,
        ambiguous: true,
        options: rootCategories.map((category) => ({
          label: category.name.es,
          value: category._id,
        })),
      },
    );
  } catch (error) {
    console.error("Chat error:", error);
    return sendChatResponse(res, GENERIC_ERROR_MESSAGE);
  }
};

module.exports = { handleChat };
