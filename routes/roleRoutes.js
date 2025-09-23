const express = require("express");
const router = express.Router();
const {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} = require("../controller/roleController");

router.get("/", getRoles);

router.get("/:id", getRoleById);

router.post("/add", createRole);

router.put("/:id", updateRole);

router.delete("/:id", deleteRole);

module.exports = router;
