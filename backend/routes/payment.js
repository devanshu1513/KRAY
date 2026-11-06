import dotenv from "dotenv";
dotenv.config();

import express from "express";
import Razorpay from "razorpay";
import Checkout from "../models/Checkout.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // process exists only in Node.js (backend). In frontend, use different method
  key_secret: process.env.RAZORPAY_SECRET,
});

// The amount is read from the saved checkout, never from the browser
router.post("/create-order", protect, async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
      return res.status(503).json({ error: "Razorpay is not configured on the server." });
    }

    const { checkoutId } = req.body;
    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      return res.status(404).json({ error: "Checkout not found" });
    }
    if (checkout.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not allowed to pay for this checkout" });
    }
    if (checkout.isPaid) {
      return res.status(400).json({ error: "This checkout is already paid" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(checkout.totalPrice * 100), // paise, always a whole number
      currency: "INR",
      receipt: `checkout_${checkout._id}`,
    });

    // Remember which Razorpay order belongs to this checkout so /pay can match them
    checkout.razorpayOrderId = order.id;
    await checkout.save();

    // Return the matching public key alongside the order so Checkout always
    // uses the same Razorpay account that created it.
    res.json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    const message = err?.error?.description || err?.message || "Razorpay could not create the payment order.";
    console.error("Razorpay order creation failed:", message);
    res.status(502).json({ error: message });
  }
});

export default router;
