const express = require("express");
const { handleChat } = require("../controller/chatController");

const router = express.Router();


router.post("/chat", handleChat);

module.exports = router;