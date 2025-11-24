const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const Coupon = require("../models/Coupon");

const addCoupon = async (req, res) => {
  try {
    const newCoupon = new Coupon(req.body);
    await newCoupon.save();
    res.send({ message: "Coupon Added Successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const addAllCoupon = async (req, res) => {
  try {
    await Coupon.deleteMany();
    await Coupon.insertMany(structuredClone(req.body));
    res.status(200).send({
      message: "Coupon Added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllCoupons = async (req, res) => {
  // console.log('coupe')
  try {
    const queryObject = {};
    const { status } = req.query;

    if (status) {
      queryObject.status = { $regex: String(status), $options: "i" };
    }
    const coupons = await Coupon.find(queryObject).sort({ _id: -1 });
    // console.log('coups',coupons)
    res.send(coupons);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShowingCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      status: "show",
    }).sort({ _id: -1 });
    res.send(coupons);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    res.send(coupon);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).send({ message: "Coupon not found!" });
    }

    coupon.title = { ...coupon.title, ...req.body.title };
    coupon.couponCode = req.body.couponCode;
    coupon.endTime = req.body.endTime;
    coupon.minimumAmount = req.body.minimumAmount;
    coupon.productType = req.body.productType;
    coupon.discountType = req.body.discountType;
    coupon.logo = req.body.logo;

    await coupon.save();

    return res.send({ message: "Coupon Updated Successfully!" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      message: err.message,
    });
  }
};

const updateManyCoupons = async (req, res) => {
  try {
    await Coupon.updateMany(
      { _id: { $in: (req.body.ids || []).map(String) } },
      {
        $set: {
          status: String(req.body.status),
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        },
      },
      {
        multi: true,
      },
    );

    res.send({
      message: "Coupons update successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const newStatus = String(req.body.status);

    await Coupon.updateOne(
      { _id: String(req.params.id) },
      {
        $set: {
          status: newStatus,
        },
      },
    );
    res.status(200).send({
      message: `Coupon ${newStatus === "show" ? "Published" : "Un-Published"} Successfully!`,
      messageKey: newStatus,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    await Coupon.deleteOne({ _id: String(req.params.id) });
    res.status(200).send({
      message: "Coupon Deleted Successfully!",
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const deleteManyCoupons = async (req, res) => {
  try {
    const ids = (req.body.ids || []).map(String);
    await Coupon.deleteMany({ _id: { $in: ids } });
    res.send({
      message: `Coupons Delete Successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  addCoupon,
  addAllCoupon,
  getAllCoupons,
  getShowingCoupons,
  getCouponById,
  updateCoupon,
  updateStatus,
  deleteCoupon,
  updateManyCoupons,
  deleteManyCoupons,
};
