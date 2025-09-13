const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const Razorpay = require("razorpay");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8080;

// MongoDB connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("✅ Connected to Database"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

// User Schema and Model
const userSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  confirmPassword: String,
  image: String,
});
const userModel = mongoose.model("user", userSchema);

// Product Schema and Model
const productSchema = mongoose.Schema({
  name: String,
  category: String,
  image: String,
  price: String,
  description: String,
});
const productModel = mongoose.model("product", productSchema);

// Routes

// Test route
app.get("/", (req, res) => {
  res.send("🟢 Server is running");
});

// Sign up
app.post("/signup", async (req, res) => {
  const { email } = req.body;
  userModel.findOne({ email: email }, (err, result) => {
    if (result) {
      res.send({ message: "Email already registered", alert: false });
    } else {
      const data = new userModel(req.body);
      data.save();
      res.send({ message: "Successfully signed up", alert: true });
    }
  });
});

// Login
app.post("/login", (req, res) => {
  const { email } = req.body;
  userModel.findOne({ email: email }, (err, result) => {
    if (result) {
      const dataSend = {
        _id: result._id,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        image: result.image,
      };
      res.send({
        message: "Login successful",
        alert: true,
        data: dataSend,
      });
    } else {
      res.send({
        message: "Email not found, please sign up",
        alert: false,
      });
    }
  });
});

// Upload product
app.post("/uploadProduct", async (req, res) => {
  const data = new productModel(req.body);
  await data.save();
  res.send({ message: "Product uploaded successfully" });
});

// Get all products
app.get("/product", async (req, res) => {
  const data = await productModel.find({});
  res.send(data);
});

// ✅ Razorpay Integration
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const items = req.body;
    const totalAmount = items.reduce((acc, item) => acc + parseInt(item.total), 0);

    const options = {
      amount: totalAmount * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (err) {
    console.error("Razorpay error:", err);
    res.status(500).json({ error: "Payment failed. Try again." });
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
