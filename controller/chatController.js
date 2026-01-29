const Category = require("../models/Category");
const Product = require("../models/Product");
const { askChatGPT } = require("../services/chatgptServices");

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
      (cat) => cat.name?.es?.toLowerCase() === text,
    );

    if (!category) {
      const words = text.split(/\s+/);

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

      const aiResponse = await askChatGPT({
        message: text,
        products,
      });

      return res.send({
        errors: [],
        data: {
          reply: aiResponse,
          products: products.map((p) => ({
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
        reply: `No encontré lo que buscas: "${text}". ¿Qué categoría te interesa?`,
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
