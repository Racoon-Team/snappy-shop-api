const { default: mongoose } = require("mongoose");
const Notification = require("../models/Notification");

const addNotification = async (req, res) => {
  try {
    const { orderId, productId, adminId, userId, message, image } = req.body;

    const newNotification = new Notification({
      orderId,
      productId,
      adminId,
      userId,
      message,
      image,
    });

    await newNotification.save();

    res.status(200).send({
      message: "Notification saved successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllNotification = async (req, res) => {
  try {
    const { page } = req.query;

    const pages = page;
    const limit = 5;
    const skip = (pages - 1) * limit;
    const total = await Notification.countDocuments();
    const  totalUnread = await Notification.countDocuments({
      status: "unread",
    });
    const data = await Notification.find({
      status: { $in: ["read", "unread"] },
    })
      .sort({
        _id: -1,
      })
      .skip(skip)
      .limit(limit);

    res.send({ total, additionalInfo:{totalUnread},limit, data, pages });
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
    await Notification.updateMany(
      { _id: { $in: (req.body.ids || []).map(String) } },
      {
        $set: {
          status: String(req.body.status).trim(),
        },
      },
      {
        multi: true,
      },
    );

    res.send({
      message: "Notification update successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).send({ message: "Invalid ID" });
    }

    const result = await Notification.deleteOne({ _id: String(id) });

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

    const result = await Notification.deleteOne({ productId: String(id) });

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

    if (
      !Array.isArray(ids) ||
      ids.some((id) => !/^[0-9a-fA-F]{24}$/.test(id))
    ) {
      return res.status(400).send({ message: "Invalid IDs" });
    }

    await Notification.deleteMany({ _id: { $in: (ids || []).map(String) } });

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
