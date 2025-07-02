const mongoose = require("mongoose");

const storeSettingSchema = new mongoose.Schema(
  {
    setting: {
      availableLocations: {
        type: [String],
        default: [],
      },
      // otros campos...
    },
    name: {
      type: String,
      default: "storeSetting",
    },
  },
  { timestamps: true }
  
);

module.exports = mongoose.model("StoreSetting", storeSettingSchema);
