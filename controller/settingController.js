//models
const Setting = require("../models/Setting");

//global setting controller
const addGlobalSetting = async (req, res) => {
  try {
    const newGlobalSetting = new Setting(req.body);
    await newGlobalSetting.save();
    res.send({
      message: "Global Setting Added Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getGlobalSetting = async (req, res) => {
  try {
    const globalSetting = await Setting.findOne({ name: "globalSetting" });
    res.send(globalSetting.setting);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateGlobalSetting = async (req, res) => {
  try {
    const { setting } = req.body;

    // Construct the $set object dynamically
    const setObject = Object.keys(setting).reduce((acc, key) => {
      acc[`setting.${key}`] = setting[key];
      return acc;
    }, {});

    const globalSetting = await Setting.findOneAndUpdate(
      { name: "globalSetting" },
      { $set: setObject },
      { new: true, upsert: true },
    );

    res.send({
      data: globalSetting,
      message: "Global Setting Update Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

//store setting controller
const addStoreSetting = async (req, res) => {
  try {
    const newStoreSetting = new Setting(req.body);
    await newStoreSetting.save();
    res.send({
      message: "Store Setting Added Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getStoreSetting = async (req, res) => {
  try {


    const storeSetting = await Setting.findOne({ name: "storeSetting" });
    res.send(storeSetting.setting);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStoreSetting = async (req, res) => {
  try {
    const { setting } = req.body;

    // Dynamically build the update fields
    const updateFields = Object.keys(setting).reduce((acc, key) => {
      acc[`setting.${key}`] = setting[key];
      return acc;
    }, {});
    // Update the online store setting document
    const storeSetting = await Setting.findOneAndUpdate(
      { name: "storeSetting" },
      { $set: updateFields },
      { new: true, upsert: true }, // upsert to create the document if it doesn't exist
    );

    res.send({
      data: storeSetting,
      message: "Store Setting Update Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

//online store customization controller
const addStoreCustomizationSetting = async (req, res) => {
  try {
    const newStoreCustomizationSetting = new Setting(req.body);
    const storeCustomizationSetting = await newStoreCustomizationSetting.save();

    res.send({
      data: storeCustomizationSetting,
      message: "Online Store Customization Setting Added Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getStoreCustomizationSetting = async (req, res) => {
  try {
    const { key, keyTwo } = req.query;
   

    

    let projection = {};
    if (key) {
      projection[`setting.${key}`] = 1;
    }
    if (keyTwo) {
      projection[`setting.${keyTwo}`] = 1;
    }

    // If neither key nor keyTwo is provided, fetch all settings
    if (!key && !keyTwo) {
      projection = { setting: 1 };
    }

    const storeCustomizationSetting = await Setting.findOne(
      { name: "storeCustomizationSetting" },
      projection,
    );

    if (!storeCustomizationSetting) {
      return res.status(404).send({ message: "Settings not found" });
    }

    res.send(storeCustomizationSetting.setting);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getStoreSeoSetting = async (req, res) => {

  try {
    const storeCustomizationSetting = await Setting.findOne(
      {
        name: "storeCustomizationSetting",
      },
      { "setting.seo": 1, _id: 0 },
    );
    
    res.send(storeCustomizationSetting?.setting);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStoreCustomizationSetting = async (req, res) => {
  try {
    const { setting } = req.body;

    // Dynamically build the update fields
    const updateFields = Object.keys(setting).reduce((acc, key) => {
      acc[`setting.${key}`] = setting[key];
      return acc;
    }, {});
    // Update the online store setting document
    const storeCustomizationSetting = await Setting.findOneAndUpdate(
      { name: "storeCustomizationSetting" },
      { $set: updateFields },
      { new: true, upsert: true }, // upsert to create the document if it doesn't exist
    );

    res.send({
      data: storeCustomizationSetting,
      message: "Online Store Customization Setting Update Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getDeliveryPoints = async (req, res) => {
  try {
    const deliveryPointsSetting = await Setting.findOne({
      name: "deliveryPoints",
    });
    if (!deliveryPointsSetting) {
      return res
        .status(404)
        .send({ message: "Delivery points setting not found" });
    }
    res.send(deliveryPointsSetting.setting.points || []);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const { v4: uuidv4 } = require("uuid");

const addDeliveryPoint = async (req, res) => {
  try {
    const newPoint = req.body;
    newPoint.id = uuidv4();

    let deliveryPointsSetting = await Setting.findOne({ name: "deliveryPoints" });

    if (deliveryPointsSetting) {
      deliveryPointsSetting.setting.points.push(newPoint);
      deliveryPointsSetting.markModified("setting.points");
    } else {
      deliveryPointsSetting = new Setting({
        name: "deliveryPoints",
        setting: { points: [newPoint] },
      });
    }

    await deliveryPointsSetting.save();

    res.status(200).send({
      message: "Delivery point added successfully!",
      data: deliveryPointsSetting.setting.points,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
};


const deleteDeliveryPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const setting = await Setting.findOne({ name: "deliveryPoints" });

    if (!setting) {
      return res
        .status(404)
        .send({ message: "Delivery points setting not found" });
    }
    const newPoints = setting.setting.points.filter(
      (point) => String(point.id) !== String(id),
    );
    setting.setting.points = newPoints;
    setting.markModified("setting.points");
    await setting.save();

    res.send({ message: "Delivery point deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getDeliveryPointById = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await Setting.findOne({ name: "deliveryPoints" });

    if (!setting) {
      return res
        .status(404)
        .send({ message: "Delivery points setting not found" });
    }

    const point = setting.setting.points.find(
      (p) => String(p.id) === String(id),
    );

    if (!point) {
      return res.status(404).send({ message: "Delivery point not found" });
    }

    res.status(200).send(point);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const updateDeliveryPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPoint = req.body;
    console.log(req.params.id);

    const deliveryPointsSetting = await Setting.findOne({
      name: "deliveryPoints",
    });

    if (!deliveryPointsSetting) {
      return res.status(404).send({ message: "Delivery points not found" });
    }

    const points = deliveryPointsSetting.setting.points;
    const index = points.findIndex((p) => p.id === id);

    if (index === -1) {
      return res.status(404).send({ message: "Delivery point not found" });
    }

    points[index] = { ...points[index], ...updatedPoint };

    deliveryPointsSetting.markModified("setting.points");
    await deliveryPointsSetting.save();

    res.status(200).send({
      message: "Delivery point updated successfully!",
      data: points[index],
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

module.exports = {
  addGlobalSetting,
  getGlobalSetting,
  updateGlobalSetting,
  addStoreSetting,
  getStoreSetting,
  updateStoreSetting,
  getStoreSeoSetting,
  addStoreCustomizationSetting,
  getStoreCustomizationSetting,
  updateStoreCustomizationSetting,
  getDeliveryPoints,
  addDeliveryPoint,
  deleteDeliveryPoint,
  getDeliveryPointById,
  updateDeliveryPoint,
};
