const Product = require("../models/Product");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const { languageCodes } = require("../utils/data");

const addProduct = async (req, res) => {
  try {
    const newProduct = new Product({
      ...req.body,
      // productId: cname + (count + 1),
      productId: req.body.productId
        ? req.body.productId
        : mongoose.Types.ObjectId(),
    });

    await newProduct.save();
    res.send(newProduct);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const addAllProducts = async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).send({ message: "Invalid products array" });
    }

    const sanitizedProducts = products.map(p => ({
      name: p.name,
      price: p.price,
      category: p.category,
      description: p.description,
      image: p.image,
      stock: p.stock,
    }));

    await Product.deleteMany();
    await Product.insertMany(sanitizedProducts);

    res.status(200).send({
      message: "Product Added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShowingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "show" }).sort({ _id: -1 });
    res.send(products);
   
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { title, category, price, page, limit } = req.query;

    const safeTitle = typeof title === "string" ? title.trim() : "";
    const safeCategory = typeof category === "string" ? category.trim() : "";
    const safePrice = typeof price === "string" ? price.trim() : "";
    const pages = Number(page) || 1;
    const limits = Number(limit) || 10;
    const skip = (pages - 1) * limits;

    let queryObject = {};
    let sortObject = {};

    if (safeTitle) {
      const titleQueries = languageCodes.map((lang) => ({
        [`title.${lang}`]: { $regex: safeTitle, $options: "i" },
      }));
      queryObject.$or = titleQueries;
    }

    switch (safePrice) {
      case "low":
        sortObject = { "prices.originalPrice": 1 };
        break;
      case "high":
        sortObject = { "prices.originalPrice": -1 };
        break;
      case "published":
        queryObject.status = "show";
        break;
      case "unPublished":
        queryObject.status = "hide";
        break;
      case "status-selling":
        queryObject.stock = { $gt: 0 };
        break;
      case "status-out-of-stock":
        queryObject.stock = { $lt: 1 };
        break;
      case "date-added-asc":
        sortObject.createdAt = 1;
        break;
      case "date-added-desc":
        sortObject.createdAt = -1;
        break;
      case "date-updated-asc":
        sortObject.updatedAt = 1;
        break;
      case "date-updated-desc":
        sortObject.updatedAt = -1;
        break;
      default:
        sortObject = { _id: -1 };
    }

    if (safeCategory) {
      queryObject.categories = safeCategory;
    }

    const totalDoc = await Product.countDocuments({ ...queryObject });
    const products = await Product.find({ ...queryObject })
      .populate({ path: "category", select: "_id name" })
      .populate({ path: "categories", select: "_id name" })
      .sort(sortObject)
      .skip(skip)
      .limit(limits);

    res.send({
      products,
      totalDoc,
      limits,
      pages,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};


const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (typeof slug !== "string" || slug.trim() === "") {
      return res.status(400).send({ message: "Invalid slug" });
    }

    const safeSlug = slug.replaceAll(/[^\w-]/g, "");

    const product = await Product.findOne({ slug: safeSlug });

    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    res.send(product);
  } catch (err) {
    res.status(500).send({
      message: `Slug problem, ${err.message}`,
    });
  }
};


const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({ path: "category", select: "_id, name" })
      .populate({ path: "categories", select: "_id name" });

    res.send(product);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateProduct = async (req, res) => {
  // console.log('update product')
  // console.log('variant',req.body.variants)
  try {
    const product = await Product.findById(req.params.id);
    

    if (product) {
      product.title = { ...product.title, ...req.body.title };
      product.description = {
        ...product.description,
        ...req.body.description,
      };

      product.productId = req.body.productId;
      product.sku = req.body.sku;
      product.barcode = req.body.barcode;
      product.slug = req.body.slug;
      product.categories = req.body.categories;
      product.category = req.body.category;
      product.show = req.body.show;
      product.isCombination = req.body.isCombination;
      product.variants = req.body.variants;
      product.stock = req.body.stock;
      product.prices = req.body.prices;
      product.image = req.body.image;
      product.tag = req.body.tag;

      await product.save();
      res.send({ data: product, message: "Product updated successfully!" });
    } else {
      res.status(404).send({
        message: "Product Not Found!",
      });
    }
  } catch (err) {
    res.status(404).send(err.message);
    // console.log('err',err)
  }
};

const updateManyProducts = async (req, res) => {
  try {
    const { ids, ...restBody } = req.body;

    if (!Array.isArray(ids) || ids.some(id => !/^[0-9a-fA-F]{24}$/.test(id))) {
      return res.status(400).send({ message: "Invalid product IDs" });
    }

    const safeIds = ids.map(id => new mongoose.Types.ObjectId(id));

    const updatedData = {};
    for (const key of Object.keys(restBody)) {
      if (
        restBody[key] !== "[]" &&
        Object.entries(restBody[key]).length > 0 &&
        restBody[key] !== ids
      ) {
        updatedData[key] = restBody[key];
      }
    }

    await Product.updateMany(
      { _id: { $in: safeIds } },
      { 
        $set: updatedData,
      },
      {
        multi: true,
      },
    );
    res.send({
      message: "Products update successfully!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStatus = (req, res) => {
  const newStatus = req.body.status;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid product ID" });
  }

  const safeId = new mongoose.Types.ObjectId(id);

  Product.updateOne(
    { _id: safeId },
    { $set: { status: newStatus } },
    (err) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      }
      res.status(200).send({
        message: `Product ${newStatus === "show" ? "Show" : "Hide"} Successfully!`,
        messageKey: newStatus,
      });
    }
  );
};

const deleteProduct = (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid product ID" });
  }

  const safeId = new mongoose.Types.ObjectId(id);

  Product.deleteOne({ _id: safeId }, (err) => {
    if (err) {
      res.status(500).send({ 
        message: err.message,
      });
    } else {
      res.status(200).send({ 
        message: "Product Deleted Successfully!",
      });
    }
  });
};

const getShowingStoreProducts = async (req, res) => {
  try {
    const queryObject = { status: "show" };

    let { category, title, slug } = req.query;

    if (category && typeof category === "string") {
      queryObject.categories = { $in: [category] };
    }

    if (title && typeof title === "string") {
   
      const safeTitle = title.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
      const titleQueries = languageCodes.map((lang) => ({
        [`title.${lang}`]: { $regex: safeTitle, $options: "i" },
      }));
      queryObject.$or = titleQueries;
    }

    if (slug && typeof slug === "string") {
      const safeSlug = slug.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
      queryObject.slug = { $regex: safeSlug, $options: "i" };
    }

    let products = [];
    let popularProducts = [];
    let discountedProducts = [];
    let relatedProducts = [];

    if (slug) {
      products = await Product.find(queryObject)
        .populate({ path: "category", select: "name _id" })
        .sort({ _id: -1 })
        .limit(100);

      if (products[0]?.category) {
        relatedProducts = await Product.find({
          category: products[0].category,
        }).populate({ path: "category", select: "_id name" });
      }
    } else if (title || category) {
      products = await Product.find(queryObject)
        .populate({ path: "category", select: "name _id" })
        .sort({ _id: -1 })
        .limit(100);
    } else {
      popularProducts = await Product.find({ status: "show" })
        .populate({ path: "category", select: "name _id" })
        .sort({ sales: -1 })
        .limit(20);

      discountedProducts = await Product.find({
        status: "show",
        $or: [
          {
            $and: [
              { isCombination: true },
              {
                variants: {
                  $elemMatch: { 
                    discount: { $gt: "0.00" } },
                },
              },
            ],
          },
          {
            $and: [
              { isCombination: false },
              {
                $expr: {
                  $gt: [{ $toDouble: "$prices.discount" }, 0],
                },
              },
            ],
          },
        ],
      })
        .populate({ path: "category", select: "name _id" })
        .sort({ _id: -1 })
        .limit(20);
    }

    res.send({ 
      products,
      popularProducts,
      relatedProducts, 
      discountedProducts,
     });
  } catch (err) {
    res.status(500).send({ 
      message: err.message, 
    });
  }
};

const deleteManyProducts = async (req, res) => {
  try {
    const cname = req.cname;
    console.log("deleteMany called by:", cname, "for ids:", req.body.ids);

    let ids = Array.isArray(req.body.ids) ? req.body.ids : [];

    ids = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (ids.length === 0) {
      return res.status(400).send({ message: "No valid IDs provided." });
    }

    await Product.deleteMany({ _id: { $in: ids } });

    res.send({
      message: `Products Delete Successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};


module.exports = {
  addProduct,
  addAllProducts,
  getAllProducts,
  getShowingProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  updateManyProducts,
  updateStatus,
  deleteProduct,
  deleteManyProducts,
  getShowingStoreProducts,
};
