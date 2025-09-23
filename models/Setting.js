const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    setting: {},
  },
  {
    timestamps: true,
  },
);

const Setting = mongoose.model("Setting", settingSchema, "setting");

module.exports = Setting;
