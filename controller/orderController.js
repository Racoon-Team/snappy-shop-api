const Order = require("../models/Order");

const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str.replaceAll(String.raw`[^\w\s.-]`, "");
};

const sanitizeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
};

const buildQueryObject = (query) => {
  const day = sanitizeNumber(query.day);
  const status = sanitizeString(query.status);
  const method = sanitizeString(query.method);
  const startDate = sanitizeString(query.startDate);
  const endDate = sanitizeString(query.endDate);
  const customerName = sanitizeString(query.customerName);

  const queryObject = {};

  if (status) {
    queryObject.status = { $regex: status, $options: "i" };
  } else {
    queryObject.$or = [
      { status: { $regex: "Pending", $options: "i" } },
      { status: { $regex: "Processing", $options: "i" } },
      { status: { $regex: "Delivered", $options: "i" } },
      { status: { $regex: "Cancel", $options: "i" } },
    ];
  }

  if (customerName) {
    const isNumber = !Number.isNaN(Number(customerName));
    const customerFilter = [
      { "user_info.name": { $regex: customerName, $options: "i" } }
    ];
    if (isNumber) customerFilter.push({ invoice: Number(customerName) });

    queryObject.$or = queryObject.$or
      ? queryObject.$or.concat(customerFilter)
      : customerFilter;
  }

  if (day) {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - day);
    queryObject.createdAt = { $gte: pastDate, $lte: today };
  }

 if (startDate && endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    queryObject.updatedAt = { $gt: start, $lt: end };
  }
}

  if (method) {
    queryObject.paymentMethod = { $regex: method, $options: "i" };
  }

  return queryObject;
};

const filterAllowedQueryFields = (queryObject) => {
  const allowedFields = ["status", "$or", "createdAt", "updatedAt", "paymentMethod"];
  const safeQuery = {};
  for (const key of allowedFields) {
    if (Object.hasOwn(queryObject, key)) {
      safeQuery[key] = queryObject[key];
    }
  }
  return safeQuery;
};

const calculateMethodTotals = async (queryObject) => {
  const safeQuery = filterAllowedQueryFields(queryObject);

    const filteredOrders = await Order.where(safeQuery)
    .select("paymentMethod total")
    .sort({ updatedAt: -1 });

  const totals = [];
for (const order of filteredOrders) {
  let existing = null;
  for (const item of totals) {
    if (item.method === order.paymentMethod) {
      existing = item;
      break;
    }
  }

  if (existing) {
    existing.total += order.total;
  } else {
    totals.push({ method: order.paymentMethod, total: order.total });
  }
}

return totals;
};

const getAllOrders = async (req, res) => {
  try {
    const queryObject = buildQueryObject(req.query);
    const safeQuery = filterAllowedQueryFields(queryObject);

    const page = sanitizeNumber(req.query.page, 1);
    const limit = sanitizeNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const totalDoc = await Order.countDocuments(safeQuery);
    const orders = await Order.find(safeQuery)
      .select("_id invoice paymentMethod subTotal total user_info discount shippingCost status createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const methodTotals =
      sanitizeString(req.query.startDate) && sanitizeString(req.query.endDate)
        ? await calculateMethodTotals(safeQuery)
        : [];

    res.send({
      orders,
      limit,
      page,
      totalDoc,
      methodTotals,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const isValidId = (...ids) =>
  ids.every(
    (id) =>
      typeof id === "string" &&
      /^[a-fA-F0-9]{24}$/.test(id.trim())
  );

const getOrderCustomer = async (req, res) => {
  try {
    const userId = String(req.params.id).trim();
    if (!isValidId(userId)) {
      return res.status(400).send({ message: "Invalid user ID format" });
    }

    const orders = await Order.find({ user: userId }).sort({ _id: -1 });
    res.send(orders);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    res.send(order);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateOrder = async (req, res) => {
  try {
    const id = String(req.params.id).trim();
    const newStatus = typeof req.body.status === "string" ? req.body.status.trim() : "";

    if (!isValidId(id)) { 
      return res.status(400).send({ message: "Invalid order ID format" });
    }

    if (!newStatus) {
      return res.status(400).send({ message: "Invalid or empty status" });
    }

    const result = await Order.updateOne(
      { _id: id },
      { $set: { status: newStatus } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Order not found" });
    }

    res.status(200).send({ message: "Order Updated Successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const id = String(req.params.id).trim();

  if (!isValidId(id)) {
      return res.status(400).send({ message: "Invalid order ID format" });
    }

    const result = await Order.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Order not found" });
    }

    res.status(200).send({ message: "Order Deleted Successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// get dashboard recent order
const getDashboardRecentOrder = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pages = Number(page) || 1;
    const limits = Number(limit) || 8;
    const skip = (pages - 1) * limits;
    const queryObject = {};

    queryObject.$or = [
      { status: { $regex: `Pending`, $options: "i" } },
      { status: { $regex: `Processing`, $options: "i" } },
      { status: { $regex: `Delivered`, $options: "i" } },
      { status: { $regex: `Cancel`, $options: "i" } },
    ];

    const totalDoc = await Order.countDocuments(queryObject);

    // query for orders
    const orders = await Order.find(queryObject)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limits);

    

    res.send({
      orders: orders,
      page: page,
      limit: limit,
      totalOrder: totalDoc,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// get dashboard count
const getDashboardCount = async (req, res) => {
  try {
    const totalDoc = await Order.countDocuments();

    // total padding order count
    const totalPendingOrder = await Order.aggregate([
      {
        $match: {
          status: "Pending",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total processing order count
    const totalProcessingOrder = await Order.aggregate([
      {
        $match: {
          status: "Processing",
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total delivered order count
    const totalDeliveredOrder = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    res.send({
      totalOrder: totalDoc,
      totalPendingOrder: totalPendingOrder[0] || 0,
      totalProcessingOrder: totalProcessingOrder[0]?.count || 0,
      totalDeliveredOrder: totalDeliveredOrder[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getDashboardAmount = async (req, res) => {
  // console.log('total')
  let week = new Date();
  week.setDate(week.getDate() - 10);

  const currentDate = new Date();
  currentDate.setDate(1); // Set the date to the first day of the current month
  currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

  const lastMonthStartDate = new Date(currentDate); // Copy the current date
  lastMonthStartDate.setMonth(currentDate.getMonth() - 1); // Subtract one month

  let lastMonthEndDate = new Date(currentDate); // Copy the current date
  lastMonthEndDate.setDate(0); // Set the date to the last day of the previous month
  lastMonthEndDate.setHours(23, 59, 59, 999); // Set the time to the end of the day

  try {
    // total order amount
    const totalAmount = await Order.aggregate([
      {
        $group: {
          _id: null,
          tAmount: {
            $sum: "$total",
          },
        },
      },
    ]);
    // console.log('totalAmount',totalAmount)
    const thisMonthOrderAmount = await Order.aggregate([
      {
        $project: {
          year: { $year: "$updatedAt" },
          month: { $month: "$updatedAt" },
          total: 1,
          subTotal: 1,
          discount: 1,
          updatedAt: 1,
          createdAt: 1,
          status: 1,
        },
      },
      {
        $match: {
          $or: [{ status: { $regex: "Delivered", $options: "i" } }],
          year: { $eq: new Date().getFullYear() },
          month: { $eq: new Date().getMonth() + 1 },
          // $expr: {
          //   $eq: [{ $month: "$updatedAt" }, { $month: new Date() }],
          // },
        },
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$updatedAt",
            },
          },
          total: {
            $sum: "$total",
          },
          subTotal: {
            $sum: "$subTotal",
          },

          discount: {
            $sum: "$discount",
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    const lastMonthOrderAmount = await Order.aggregate([
      {
        $project: {
          year: { $year: "$updatedAt" },
          month: { $month: "$updatedAt" },
          total: 1,
          subTotal: 1,
          discount: 1,
          updatedAt: 1,
          createdAt: 1,
          status: 1,
        },
      },
      {
        $match: {
          $or: [{ status: { $regex: "Delivered", $options: "i" } }],

          updatedAt: { $gt: lastMonthStartDate, $lt: lastMonthEndDate },
        },
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$updatedAt",
            },
          },
          total: {
            $sum: "$total",
          },
          subTotal: {
            $sum: "$subTotal",
          },

          discount: {
            $sum: "$discount",
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    // order list last 10 days
    const orderFilteringData = await Order.find(
      {
        $or: [{ status: { $regex: `Delivered`, $options: "i" } }],
        updatedAt: {
          $gte: week,
        },
      },

      {
        paymentMethod: 1,
        paymentDetails: 1,
        total: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    );

    res.send({
      totalAmount:
        totalAmount.length === 0
          ? 0
          : Number.parseFloat(totalAmount[0].tAmount).toFixed(2),
      thisMonthlyOrderAmount: thisMonthOrderAmount[0]?.total,
      lastMonthOrderAmount: lastMonthOrderAmount[0]?.total,
      ordersData: orderFilteringData,
    });
  } catch (err) {
    // console.log('err',err)
    res.status(500).send({
      message: err.message,
    });
  }
};

const getBestSellerProductChart = async (req, res) => {
  try {
    const totalDoc = await Order.countDocuments({});
    const bestSellingProduct = await Order.aggregate([
      {
        $unwind: "$cart",
      },
      {
        $group: {
          _id: "$cart.title",

          count: {
            $sum: "$cart.quantity",
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 4,
      },
    ]);

    res.send({
      totalDoc,
      bestSellingProduct,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getDashboardOrders = async (req, res) => {
  const { page, limit } = req.query;

  const pages = Number(page) || 1;
  const limits = Number(limit) || 8;
  const skip = (pages - 1) * limits;

  let week = new Date();
  week.setDate(week.getDate() - 10);

  const start = new Date().toDateString();

  // (startDate = '12:00'),
  //   (endDate = '23:59'),
  // console.log("page, limit", page, limit);

  try {
    const totalDoc = await Order.countDocuments({});

    // query for orders
    const orders = await Order.find({})
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limits);

    const totalAmount = await Order.aggregate([
      {
        $group: {
          _id: null,
          tAmount: {
            $sum: "$total",
          },
        },
      },
    ]);

    // total order amount
    const todayOrder = await Order.find({ createdAt: { $gte: start } });

    // this month order amount
    const totalAmountOfThisMonth = await Order.aggregate([
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
          },
          total: {
            $sum: "$total",
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    // total padding order count
    const totalPendingOrder = await Order.aggregate([
      {
        $match: {
          status: "Pending",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total delivered order count
    const totalProcessingOrder = await Order.aggregate([
      {
        $match: {
          status: "Processing",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total delivered order count
    const totalDeliveredOrder = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    //weekly sale report
    // filter order data
    const weeklySaleReport = await Order.find({
      $or: [{ status: { $regex: `Delivered`, $options: "i" } }],
      createdAt: {
        $gte: week,
      },
    });

    res.send({
      totalOrder: totalDoc,
      totalAmount:
        totalAmount.length === 0
          ? 0
          : Number.parseFloat(totalAmount[0].tAmount).toFixed(2),
      todayOrder: todayOrder,
      totalAmountOfThisMonth:
        totalAmountOfThisMonth.length === 0
          ? 0
          : Number.parseFloat(totalAmountOfThisMonth[0].total).toFixed(2),
      totalPendingOrder:
        totalPendingOrder.length === 0 ? 0 : totalPendingOrder[0],
      totalProcessingOrder:
        totalProcessingOrder.length === 0 ? 0 : totalProcessingOrder[0].count,
      totalDeliveredOrder:
        totalDeliveredOrder.length === 0 ? 0 : totalDeliveredOrder[0].count,
      orders,
      weeklySaleReport,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getTotalSoldByProduct = async (req, res) => {
  try {
    const productId = String(req.params.productId).trim();

   if (!isValidId(productId)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const result = await Order.aggregate([
      { $unwind: "$cart" },
      { $match: { "cart.id": productId } },
      {
        $group: {
          _id: "$cart.id",
          totalQuantity: { $sum: "$cart.quantity" },
        },
      },
    ]);

    res.json({
      productId,
      totalQuantity: result.length > 0 ? result[0].totalQuantity : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching total sold" });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrderCustomer,
  updateOrder,
  deleteOrder,
  getBestSellerProductChart,
  getDashboardOrders,
  getDashboardRecentOrder,
  getDashboardCount,
  getDashboardAmount,
  getTotalSoldByProduct,
};
