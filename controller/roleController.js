const Role = require("../models/Role");

const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({});
    res.send(roles);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).send({ message: "Role not found" });
    }
    res.send(role);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    if (!name) {
      return res.status(400).send({ message: "Role name is required" });
    }

    const newRole = new Role({
      name,
      permissions: permissions || [],
    });

    const savedRole = await newRole.save();
    res.status(201).send(savedRole);
    console.log("saved", savedRole);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      { name, permissions },
      { new: true },
    );
    if (!updatedRole) {
      return res.status(404).send({ message: "Role not found" });
    }
    res.send(updatedRole);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const deletedRole = await Role.findByIdAndDelete(req.params.id);
    if (!deletedRole) {
      return res.status(404).send({ message: "Role not found" });
    }
    res.send({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
