require("dotenv").config();
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const { signInToken, tokenForVerify } = require("../config/auth");
const { sendEmail } = require("../lib/email-sender/sender");
const {
  customerRegisterBody,
} = require("../lib/email-sender/templates/register");
const {
  forgetPasswordEmailBody,
} = require("../lib/email-sender/templates/forget-password");
const { sendVerificationCode } = require("../lib/phone-verification/sender");

const verifyEmailAddress = async (req, res) => {
  const isAdded = await Customer.findOne({ email: String(req.body.email) });
  if (isAdded) {
    return res.status(403).send({
      message: "This Email already Added!",
    });
  } else {
    const { name, email, password } = req.body;
    const token = tokenForVerify({ name, email, password });
    const option = {
      name: req.body.name,
      email: req.body.email,
      token: token,
    };
    const body = {
      from: process.env.EMAIL_USER,
      // from: "info@demomailtrap.com",
      to: `${req.body.email}`,
      subject: "Verify Your Email",
      html: customerRegisterBody(option),
    };

    const message = "Please check your email to verify your account!";
    sendEmail(body, res, message);
  }
};

const verifyPhoneNumber = async (req, res) => {
  const phoneNumber = String(req.body.phone || "").trim();

  // Check if phone number is provided and is in the correct format
  if (!phoneNumber) {
    return res.status(400).send({
      message: "Phone number is required.",
    });
  }

  // Optional: Add phone number format validation here (if required)
  // const phoneRegex = /^[0-9]{10}$/; // Basic validation for 10-digit phone numbers
  // if (!phoneRegex.test(phoneNumber)) {
  //   return res.status(400).send({
  //     message: "Invalid phone number format. Please provide a valid number.",
  //   });
  // }

  try {
    // Check if the phone number is already associated with an existing customer
    const isAdded = await Customer.findOne({ phone: phoneNumber });

    if (isAdded) {
      return res.status(403).send({
        message: "This phone number is already added.",
      });
    }

    // Generate a random 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // Send verification code via SMS
    const sent = await sendVerificationCode(phoneNumber, verificationCode);

    if (!sent) {
      return res.status(500).send({
        message: "Failed to send verification code.",
      });
    }

    const message = "Please check your phone for the verification code!";
    return res.send({ message });
  } catch (err) {
    console.error("Error during phone verification:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const registerCustomer = async (req, res) => {
  const token = req.params.token;

  try {
    const { name, email, password, location } = jwt.decode(token);

    // Check if the user is already registered
    const isAdded = await Customer.findOne({ email });

    if (isAdded) {
      const token = signInToken(isAdded);
      return res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        password: password,
        message: "Email Already Verified!",
      });
    }

    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRET_FOR_VERIFY,
        async (err, decoded) => {
          if (err) {
            return res.status(401).send({
              message: "Token Expired, Please try again!",
            });
          }

          // Create a new user only if not already registered
          const existingUser = await Customer.findOne({ email });
          console.log("existingUser");

          if (existingUser) {
            return res.status(400).send({ message: "User already exists!" });
          } else {
            const newUser = new Customer({
              name,
              email,
              password: bcrypt.hashSync(password),
              location,
              preferences: [],
            });

            await newUser.save();
            const token = signInToken(newUser);
            res.send({
              token,
              _id: newUser._id,
              name: newUser.name,
              email: newUser.email,
              location: newUser.location,
              preferences: newUser.preferences || [],
              message: "Email Verified, Please Login Now!",
            });
          }
        },
      );
    }
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).send({
      message: "Internal server error. Please try again later.",
    });
  }
};

const addAllCustomers = async (req, res) => {
  try {
    await Customer.deleteMany();
    const validCustomers = req.body.map((customer) => ({
      name: customer.name,
      email: customer.email,
      password: customer.password
        ? bcrypt.hashSync(customer.password)
        : undefined,
      phone: customer.phone,
    }));
    await Customer.insertMany(validCustomers);
    res.send({
      message: "Added all users successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : null;
    const password =
      typeof req.body.password === "string" ? req.body.password : null;

    if (!email || !password) {
      return res.status(400).send({
        message: "Email and password are required.",
      });
    }

    const customer = await Customer.findOne({ email: email }).lean();

    if (customer?.password && bcrypt.compareSync(password, customer.password)) {
      const token = signInToken(customer);
      return res.send({
        token,
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        address: customer.address,
        phone: customer.phone,
        image: customer.image,
        location: customer.location || null,
        preferences: customer.preferences || [],
        locationSkipped: customer.locationSkipped,
      });
    }

    return res.status(401).send({
      message: "Invalid user or password!",
    });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).send({
      message: "Internal server error.",
    });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : null;

    if (!email) {
      return res.status(400).send({
        message: "Email is required.",
      });
    }
    const isAdded = await Customer.findOne({ email }).lean();

    if (isAdded) {
      const token = tokenForVerify(isAdded);
      const option = {
        name: isAdded.name,
        email: isAdded.email,
        token,
      };

      const body = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset",
        html: forgetPasswordEmailBody(option),
      };

      const message = "Please check your email to reset password!";
      sendEmail(body, res, message);
    } else {
      return res.status(404).send({
        message: "User Not found with this email!",
      });
    }
  } catch (err) {
    console.error("Error in forgetPassword:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const resetPassword = async (req, res) => {
  const token = req.body.token;
  const { email } = jwt.decode(token);
  const customer = await Customer.findOne({ email: email });

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, (err, decoded) => {
      if (err) {
        return res.status(500).send({
          message: "Token expired, please try again!",
        });
      } else {
        customer.password = bcrypt.hashSync(req.body.newPassword);
        customer.save();
        res.send({
          message: "Your password change successful, you can login now!",
        });
      }
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : null;

    if (!email) {
      return res.status(400).send({
        message: "Email is required",
      });
    }

    const customer = await Customer.findOne({ email });

    if (!customer?.password) {
      return res.status(403).send({
        message:
          "For change password, you need to sign up with email & password!",
      });
    } else if (
      bcrypt.compareSync(req.body.currentPassword, customer.password)
    ) {
      customer.password = bcrypt.hashSync(req.body.newPassword);
      await customer.save();
      res.send({
        message: "Your password changed successfully!",
      });
    } else {
      res.status(401).send({
        message: "Invalid email or current password!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const signUpWithProvider = async (req, res) => {
  try {
    const user = jwt.decode(req.params.token);
    const isAdded = await Customer.findOne({ email: user.email });
    if (isAdded) {
      const token = signInToken(isAdded);
      res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        address: isAdded.address,
        phone: isAdded.phone,
        image: isAdded.image,
        location: isAdded.location,
        preferences: isAdded.preferences,
      });
    } else {
      const newUser = new Customer({
        name: user.name,
        email: user.email,
        image: user.picture,
        location: null,
        preferences: [],
      });

      const signUpCustomer = await newUser.save();
      const token = signInToken(signUpCustomer);
      res.send({
        token,
        _id: signUpCustomer._id,
        name: signUpCustomer.name,
        email: signUpCustomer.email,
        image: signUpCustomer.image,
        location: signUpCustomer.location,
        preferences: signUpCustomer.preferences,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const signUpWithOauthProvider = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : null;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const isAdded = await Customer.findOne({ email });

    if (isAdded) {
      const token = signInToken(isAdded);
      return res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        address: isAdded.address,
        phone: isAdded.phone,
        image: isAdded.image,
        location: isAdded.location,
        preferences: isAdded.preferences,
      });
    } else {
      const newUser = new Customer({
        name: req.body.name,
        email: email,
        image: req.body.image,
        location: null,
        preferences: [],
      });

      const signUpCustomer = await newUser.save();
      const token = signInToken(signUpCustomer);
      return res.send({
        token,
        _id: signUpCustomer._id,
        name: signUpCustomer.name,
        email: signUpCustomer.email,
        image: signUpCustomer.image,
        location: signUpCustomer.location,
        preferences: signUpCustomer.preferences,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const users = await Customer.find({}).sort({ _id: -1 });
    const usersWithOrdersCount = await Promise.all(
      users.map(async (user) => {
        const ordersCount = await Order.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          ordersCount,
        };
      }),
    );

    res.send(usersWithOrdersCount);
  } catch (err) {
    console.error("Error in getAllCustomers:", err);
    res.status(500).send({ message: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    res.send(customer);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const addShippingAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid customer ID" });
    }

    const newShippingAddress =
      req.body && typeof req.body === "object" ? req.body : null;

    if (!newShippingAddress) {
      return res.status(400).send({ message: "Invalid shipping address data" });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).send({ message: "Customer not found" });
    }

    customer.shippingAddress = newShippingAddress;

    await customer.save();

    return res.send({
      message: "Shipping address added or updated successfully.",
    });
  } catch (err) {
    console.error("Error updating shipping address:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShippingAddress = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    res.send({ shippingAddress: customer?.shippingAddress });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateShippingAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      customer.shippingAddress.push(req.body);

      await customer.save();
      res.send({ message: "Success" });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteShippingAddress = async (req, res) => {
  try {
    const { userId, shippingId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(shippingId)
    ) {
      return res.status(400).send({ message: "Invalid ID format" });
    }

    const result = await Customer.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      {
        $pull: {
          shippingAddress: { _id: new mongoose.Types.ObjectId(shippingId) },
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({ message: "Shipping address not found" });
    }

    res.send({ message: "Shipping Address Deleted Successfully!" });
  } catch (err) {
    console.error("Error deleting shipping address:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { name, email, address, phone, image, location } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).send({
        message: "Customer not found",
      });
    }

    const sanitizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : null;

    const existingCustomer = sanitizedEmail
      ? await Customer.findOne({ email: sanitizedEmail })
      : null;

    if (
      existingCustomer &&
      existingCustomer._id.toString() !== customer._id.toString()
    ) {
      return res.status(400).send({
        message: "Email already exists.",
      });
    }

    customer.name = name;
    customer.email = sanitizedEmail;
    customer.address = address;
    customer.phone = phone;
    customer.image = image;
    customer.location = location;

    const updatedUser = await customer.save();

    res.send({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      address: updatedUser.address,
      phone: updatedUser.phone,
      image: updatedUser.image,
      location: updatedUser.location,
      preferences: updatedUser.preferences,
      message: "Customer updated successfully!",
    });
  } catch (err) {
    console.error("Error updating customer:", err);
    res.status(500).send({ message: err.message });
  }
};

const deleteCustomer = (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid customer ID" });
  }

  Customer.deleteOne(
    { _id: new mongoose.Types.ObjectId(id) },
    (err, result) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      }

      if (result.deletedCount === 0) {
        return res.status(404).send({ message: "Customer not found" });
      }

      res.status(200).send({ message: "User Deleted Successfully!" });
    },
  );
};

const isValidEmail = (email) =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const getCustomerByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!isValidEmail(email)) {
      return res.status(400).send({ message: "Invalid email format" });
    }

    const sanitizedEmail = String(email).trim().toLowerCase();

    const customer = await Customer.findOne({ email: sanitizedEmail }).lean();

    if (!customer) {
      return res.status(404).send({ message: "Customer not found" });
    }
    res.send({
      ...customer,
      locationSkipped: customer.locationSkipped || false,
    });
  } catch (err) {
    console.error("Error fetching customer by email:", err);
    res.status(500).send({ message: err.message });
  }
};
const updateCustomerLocation = async (req, res) => {
  try {
    const { email, location } = req.body;

    if (!email || !location) {
      return res
        .status(400)
        .send({ message: "Email and location are required" });
    }

    const customer = await Customer.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { $set: { location } },
      { new: true },
    );

    if (!customer) {
      return res.status(404).send({ message: "Customer not found" });
    }

    res.send({
      message: "Location updated successfully",
      location: customer.location,
    });
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).send({ message: "Server error" });
  }
};

const updateCustomerPreferences = async (req, res) => {
  try {
    const { email, preferences } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ message: "Preferences must be an array" });
    }

    const validPreferences = preferences.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    if (validPreferences.length !== preferences.length) {
      return res
        .status(400)
        .json({ message: "Some preferences have invalid IDs" });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const customer = await Customer.findOne({ email: sanitizedEmail });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.preferences = validPreferences;
    await customer.save();

    res.status(200).json({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const skipLocation = async (req, res) => {
  try {
    const { email } = req.body;
    const customer = await Customer.findOne({
      email: email.trim().toLowerCase(),
    });
    if (!customer) {
      return res.status(404).send({ message: "Customer not found" });
    }
    customer.locationSkipped = true;
    await customer.save();
    res.send({ message: "Location skipped successfully!" });
  } catch (err) {
    console.error("Error skipping location:", err);
    res.status(500).send({ message: err.message });
  }
};

module.exports = {
  loginCustomer,
  verifyPhoneNumber,
  registerCustomer,
  addAllCustomers,
  signUpWithProvider,
  signUpWithOauthProvider,
  verifyEmailAddress,
  forgetPassword,
  changePassword,
  resetPassword,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addShippingAddress,
  getShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  getCustomerByEmail,
  updateCustomerLocation,
  updateCustomerPreferences,
  skipLocation,
};
