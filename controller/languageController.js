const Language = require("../models/Language");
const { mongo_connection } = require("../config/db"); // CCDev
const { default: mongoose } = require("mongoose");

const addLanguage = async (req, res) => {
  try {
    const newLanguage = new Language(req.body);
    await newLanguage.save();
    res.status(200).send({
      message: "Language added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};
const addAllLanguage = async (req, res) => {
  try {
    if (!Array.isArray(req.body) || !req.body.length) {
      return res.status(400).send({ message: "Request body must be a non-empty array" });
    }

    const validLanguages = req.body
      .filter(lang => lang?.name && lang?.code)  
      .map(lang => ({ 
        name: String(lang.name).trim(), 
        code: String(lang.code).trim() 
      }));

    if (!validLanguages.length) {
      return res.status(400).send({ message: "No valid language data provided" });
    }

    await Language.insertMany(validLanguages);
    res.send({ message: "All languages added successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getAllLanguages = async (req, res) => {
  // console.log('get all language')
  try {
    const languages = await Language.find({});
    // console.log('languages',languages)
    res.send(languages);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShowingLanguage = async (req, res) => {
  try {
    

    // console.log('get showing language')
    const languages = await Language.find({ status: "show" }).sort({
      _id: -1,
    });
    res.send(languages);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getLanguageById = async (req, res) => {
  try {
    const language = await Language.findById(req.params.id);
    res.send(language);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateLanguage = async (req, res) => {
  try {
    const language = await Language.findById(req.params.id);
    if (language) {
      language.name = req.body.name;
      language.iso_code = req.body.iso_code;
      language.flag = req.body.flag;
      language.status = req.body.status;
    }
    await language.save();
    res.send({
      message: "Language update successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateManyLanguage = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.some(id => !/^[0-9a-fA-F]{24}$/.test(id))) {
      return res.status(400).send({ message: "Invalid IDs format" });
    }

    if (typeof status !== "string") {
      return res.status(400).send({ message: "Invalid status value" });
    }

    const safeIds = ids.map(id => new mongoose.Types.ObjectId(id));

    await Language.updateMany(
      { _id: { $in: safeIds } },
      { $set: { status: status.trim() } }
    );

    res.send({ message: "Languages updated successfully!" });
  } catch (err) {
    console.error("Error updating languages:", err);
    res.status(500).send({ message: err.message });
  }
};


const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).send({ message: "Invalid ID format" });
    }

    if (typeof status !== "string" || !status.trim()) {
      return res.status(400).send({ message: "Invalid status value" });
    }

    const safeId = new mongoose.Types.ObjectId(id);

    await Language.updateOne(
      { _id: safeId },
      { $set: { status: status.trim() } }
    );

    res.status(200).send({
      message: `Language ${status === "show" ? "Published" : "Un-Published"} Successfully!`,
      messageKey: status,
    });
  } catch (err) {
    console.error("Error updating language status:", err);
    res.status(500).send({ message: err.message });
  }
};


const deleteLanguage = async (req, res) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).send({ message: "Invalid ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const result = await Language.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Language not found" });
    }

    res.send({
      message: "Language deleted successfully!",
    });
  } catch (err) {
    console.error("Error deleting language:", err);
    res.status(500).send({ message: err.message });
  }
};


const deleteManyLanguage = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({ message: "IDs must be a non-empty array" });
    }

    const validIds = ids.filter(
      (id) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)
    );

    if (validIds.length === 0) {
      return res.status(400).send({ message: "No valid IDs provided" });
    }

    await Language.deleteMany({ _id: { $in: validIds } });

    res.send({
      message: "Languages deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};


module.exports = {
  addLanguage,
  addAllLanguage,
  getAllLanguages,
  getShowingLanguage,
  getLanguageById,
  updateLanguage,
  updateStatus,
  deleteLanguage,
  updateManyLanguage,
  deleteManyLanguage,
};
