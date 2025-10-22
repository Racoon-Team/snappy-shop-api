const { default: mongoose } = require("mongoose");
const Notification = require("../models/Notification");
const addNotification = async (req, res) => {
  try {
    const { productId, userId, message } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ message: "Invalid userId" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    let productObjectId = null;
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send({ message: "Invalid productId" });
      }
      productObjectId = new mongoose.Types.ObjectId(productId);
    }

    const query = { userId: userObjectId };
    if (productObjectId) query.productId = productObjectId;

    const isAdded = await Notification.findOne(query);

    if (isAdded) {
      return res.status(200).end();
    }

    const newNotification = new Notification({
      userId: userObjectId,
      productId: productObjectId,
      message,
    });

    await newNotification.save();
    res.status(200).send({ message: "Notification added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
};

const getAllNotification = async (req, res) => {
  try {
    const { page } = req.query;

    const pages = page;
    const limits = 5;
    const skip = (pages - 1) * limits;
    const totalDoc = await Notification.countDocuments();
    const totalUnreadDoc = await Notification.countDocuments({
      status: "unread",
    });
    const notifications = await Notification.find({
      status: { $in: ["read", "unread"] },
    })
      .sort({
        _id: -1,
      })
      .skip(skip)
      .limit(limits);

    res.send({ totalDoc, totalUnreadDoc, notifications });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStatusNotification = async (req, res) => {
  try {
    const newStatus = req.body.status;

    await Notification.findByIdAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          status: newStatus,
        },
      },
    );
    const totalDoc = await Notification.countDocuments({ status: "unread" });

    res.send({
      totalDoc,
      message: `Notification Read!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateManyStatusNotification = async (req, res) => {
  try {
    const { ids, status } = req.body;

    const allowedStatuses = ["read", "unread", "pending"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).send({ message: "Invalid status" });
    }

    if (!Array.isArray(ids) || ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).send({ message: "Invalid ids array" });
    }

    const safeIds = ids.map(id => new mongoose.Types.ObjectId(id));
    const safeStatus = status;

    await Notification.updateMany(
      { _id: { $in: safeIds } },
      { $set: { status: safeStatus } },
      { multi: true }
    );

    res.status(200).send({
      message: "Notifications updated successfully!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
};

const deleteNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).send({ message: "Invalid ID" });
    }

    const safeId = new mongoose.Types.ObjectId(id);

    const result = await Notification.deleteOne({ _id: safeId });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Notification not found" });
    }

    res.send({
      message: "Notification deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};


const deleteNotificationByProductId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).send({ message: "Invalid productId" });
    }

    const safeProductId = new mongoose.Types.ObjectId(id);

    const result = await Notification.deleteOne({ productId: safeProductId });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Notification not found" });
    }

    res.send({
      message: "Notification deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};


const deleteManyNotification = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.some(id => !/^[0-9a-fA-F]{24}$/.test(id))) {
      return res.status(400).send({ message: "Invalid IDs" });
    }

    const safeIds = ids.map(id => new mongoose.Types.ObjectId(id));

    await Notification.deleteMany({ _id: { $in: safeIds } });

    res.send({
      message: "Notification Delete Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  getAllNotification,
  addNotification,
  updateStatusNotification,
  deleteNotificationById,
  deleteNotificationByProductId,
  updateManyStatusNotification,
  deleteManyNotification,
};
