const Category = require("../models/Category");
const Product = require("../models/Product");
const { askChatGPT } = require("../services/chatgptServices");

const GENERIC_ERROR_MESSAGE = "Ocurrió un error, intenta nuevamente.";
const CART = "agregar al carrito";
const SELECT = "Selecciona el producto para agregar al carrito:";
const PRODUCT_CART = "Producto agregado al carrito ";
const MESSAGE = "¿Podrías escribir un poco más para ayudarte mejor?";
const GREETING = "Hola, ¿Qué tipo de categoría estás buscando?";
const PRODUCT_NOT_FOUND = (normalizedText) =>
  `No encontré lo que buscas: "${normalizedText}". Escoge las siguientes opciones:`;
const SUB_CATEGORIES = (category) =>
  `Estas son las subcategorías de ${category.name.es}:`;
const CATEGORY_FOUND = (category) =>
  `Encontré la categoría "${category.name.es}", pero todavía no tenemos productos disponibles en esta sección.`;

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
    data: { reply, products, context },
  });
}

function formatProduct(product) {
  return {
    id: product._id,
    name: product.title?.es || product.name,
    price: product.prices?.price || product.price,
    color: product.color || null,
    stock: product.stock || 0,
    image: product.image?.[0] || null,
  };
}

function formatProductsForAI(products) {
  return products.slice(0, 15).map((product, index) => ({
    index: index + 1,
    name: product.title?.es || product.name,
    price: product.prices?.price || product.price,
  }));
}

function buildProductReply(products) {
  return products
    .map(
      (product, index) =>
        `${index + 1}. ${product.title?.es || product.name} (${product.prices?.price || product.price})`,
    )
    .join("\n");
}

function buildContext(
  intent,
  category = null,
  options = [],
  ambiguous = false,
) {
  return { intent, category, ambiguous, options };
}

function mapCategoriesToOptions(categories) {
  return categories.map((category) => ({
    label: category.name?.es,
    value: category._id,
  }));
}

async function getProductsByCategory(categoryId) {
  return Product.find({
    category: categoryId,
    status: "show",
  }).lean();
}

async function resolveCategory(normalizedText, categories) {
  let category = categories.find(
    (cat) => cat.name?.es?.toLowerCase() === normalizedText,
  );

  if (category) {
    const words = normalizedText.split(/\s+/);
    const categoryName = category.name.es.toLowerCase();
    const hasRelation = words.some((word) => categoryName.includes(word));

    return hasRelation ? category : null;
  }

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
      return categories[index];
    }
  }

  const words = normalizedText.split(/\s+/);

  return categories.find(
    (cat) =>
      cat.name?.es?.toLowerCase() &&
      words.some((word) => cat.name.es.toLowerCase().includes(word)),
  );
}

const handleChat = async (req, res) => {
  let reply = GENERIC_ERROR_MESSAGE;
  let productsResponse = [];
  let context = {};

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

    if (text === CART) {
      reply = SELECT;
      context = buildContext("add_to_cart");
    } else if (text === "cart_product_key") {
      reply = PRODUCT_CART;
      context = {
        intent: "cart_confirmed",
        ambiguous: false,
        options: [{ label: "Inicio" }],
      };
    } else if (!normalizedText) {
      reply = MESSAGE;
      context = {
        intent: "unknown",
        ambiguous: true,
        options: [],
      };
    } else if (!text || text === "__init__") {
      const rootCategories = await Category.find({
        parentName: "Home",
        status: "show",
      });

      reply = GREETING;
      context = buildContext(
        "select_category",
        null,
        mapCategoriesToOptions(rootCategories),
        false,
      );
    } else {
      const categories = await Category.find({ status: "show" });
      const category = await resolveCategory(normalizedText, categories);

      if (!category) {
        const rootCategories = await Category.find({
          parentId: { $in: [null, ""] },
          status: "show",
        });

        reply = PRODUCT_NOT_FOUND(normalizedText);
        context = buildContext(
          "select_category",
          null,
          mapCategoriesToOptions(rootCategories),
          true,
        );
      } else {
        const subcategories = await Category.find({
          parentId: category._id,
          status: "show",
        });

        if (subcategories.length > 0) {
          reply = SUB_CATEGORIES(category);
          context = buildContext(
            "select_subcategory",
            category.name.es.toLowerCase(),
            mapCategoriesToOptions(subcategories),
          );
        } else {
          const products = await getProductsByCategory(category._id);

          if (products.length === 0) {
            reply = CATEGORY_FOUND(category);
            context = buildContext(
              "empty_category",
              category.name.es.toLowerCase(),
            );
          } else {
            const aiProducts = formatProductsForAI(products);
            const prompt = `Consulta del usuario: "${normalizedText}" Productos disponibles:
            ${aiProducts.map((p) => `${p.index}. ${p.name} (${p.price})`).join("\n")}
            Devuelve SOLO los números de los productos relevantes.`;
            const aiResponse = await askChatGPT({ message: prompt });

            const indexes =
              aiResponse?.match(/\d+/g)?.map((n) => parseInt(n, 10) - 1) || [];

            const filteredProducts = indexes
              .map((i) => products[i])
              .filter(Boolean);

            if (filteredProducts.length === 0) {
              filteredProducts.push(...products.slice(0, 3));
            }

            reply = `Estos son los productos que tenemos:\n\n${buildProductReply(
              filteredProducts,
            )}\n\n`;

            productsResponse = filteredProducts.map(formatProduct);

            context = buildContext(
              "search_product",
              category.name.es.toLowerCase(),
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Chat error:", error);
  }
  return sendChatResponse(res, reply, productsResponse, context);
};
module.exports = { handleChat };
