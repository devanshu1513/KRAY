import express from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";
import { getEffectivePrice } from "../utils/pricing.js";

const router = express.Router();

// Helper function to get or create cart
const getCart = async (userId, guestId) => {
  if (userId) {
    return await Cart.findOne({ user: userId });
  } else if (guestId) {
    return await Cart.findOne({ guestId });
  }
  return null;
};

// @route POST /api/cart
// @desc Add product to cart for a guest or logged-in user
// @access Public
router.post("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Determine if user is logged in or guest
    let cart = await getCart(userId, guestId);

    // If cart exist, update it
    if (cart) {
      const productIndex = cart.products.findIndex(
        (p) =>
          p.productId.toString() === productId &&
          p.size === size &&
          p.color === color
      );

      if (productIndex > -1) {
        // Product exists in cart, update quantity
        cart.products[productIndex].quantity += parseInt(quantity);
      } else {
        // Product does not exist in cart, add new item
        cart.products.push({
          productId,
          name: product.name,
          image: product.images[0].url,
          price: getEffectivePrice(product),
          size,
          color,
          quantity: parseInt(quantity),
        });
      }

      // Recalculate total price
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      await cart.save();
      return res.status(200).json(cart);
    } else {
      // No cart exists, create a new one
      const newCart = new Cart({
        user: userId ? userId : undefined,
        guestId: guestId ? guestId : "guest_" + new Date().getTime(),
        products: [
          {
            productId,
            name: product.name,
            image: product.images[0].url,
            price: getEffectivePrice(product),
            size,
            color,
            quantity: parseInt(quantity),
          },
        ],
        totalPrice: getEffectivePrice(product) * parseInt(quantity),
      });
      await newCart.save();
      return res.status(201).json(newCart);
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route PUT /api/cart
// @desc Update product quantity in cart for a guest or logged-in user
// @access Public
router.put("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;
  try {
    let cart = await getCart(userId, guestId);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId.toString() === productId &&
        p.size === size &&
        p.color === color
    );
    if (productIndex > -1) {
      // Update quantity
      if (quantity > 0) {
        cart.products[productIndex].quantity = quantity;
      } else {
        // Remove product if quantity is 0
        cart.products.splice(productIndex, 1);
      }
      // Recalculate total price
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      await cart.save();
      return res.status(200).json(cart);
    } else {
      return res.status(404).json({ message: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route DELETE /api/cart
// @desc Remove product from cart for a guest or logged-in user
// @access Public
router.delete("/", async (req, res) => {
  const { productId, size, color, guestId, userId } = req.body;
  try {
    let cart = await getCart(userId, guestId);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId.toString() === productId &&
        p.size === size &&
        p.color === color
    );
    if (productIndex > -1) {
      // Remove product
      cart.products.splice(productIndex, 1);
      // Recalculate total price
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      await cart.save();
      return res.status(200).json(cart);
    } else {
      return res.status(404).json({ message: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/cart
// @desc Get cart for a guest or logged-in user
// @access Public
router.get("/", async (req, res) => {
  const { userId, guestId } = req.query;
  try {
    const cart = await getCart(userId, guestId);
    if (cart) {
      return res.status(200).json(cart);
    } else {
      return res.status(404).json({ message: "Cart not found" });
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route POST /api/cart/merge
// @desc Merge guest cart into user cart upon login
// @access Private
router.post("/merge", protect, async (req, res) => {
  const { guestId } = req.body;
  try {
    // Find the guest cart
    const guestCart = await Cart.findOne({ guestId });
    const userCart = await Cart.findOne({ user: req.user._id });

    if (guestCart) {
      if (guestCart.products.length === 0) {
        return res.status(400).json({ message: "Guest cart is empty" });
      }

      if (userCart) {
        // Merge guest cart into user cart
        guestCart.products.forEach((guestItem) => {
          const productIndex = userCart.products.findIndex(
            (item) =>
              item.productId.toString() === guestItem.productId.toString() &&
              item.size === guestItem.size &&
              item.color === guestItem.color
          );
          if (productIndex > -1) {
            // Update quantity if product exists in user cart
            userCart.products[productIndex].quantity += guestItem.quantity;
          } else {
            // Add new product to user cart
            userCart.products.push(guestItem);
          }
        });
        // Recalculate total price
        userCart.totalPrice = userCart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
        // Save updated user cart
        await userCart.save();
        // Delete guest cart after merging
        try {
          await Cart.findOneAndDelete({ guestId });
        } catch (deleteError) {
          console.error("Error deleting guest cart:", deleteError);
        }
        return res.status(200).json(userCart);
      } else {
        // If no user cart exists, assign guest cart to user
        guestCart.user = req.user._id;
        guestCart.guestId = undefined;
        await guestCart.save();
        return res.status(200).json(guestCart);
      }
    } else {
      if (userCart) {
        // Guest cart already merged, return user cart
        return res.status(200).json(userCart);
      }
      // No guest cart or user cart found - return empty cart (this is ok, user can shop)
      return res.status(200).json({ products: [], totalPrice: 0 });
    }
  } catch (error) {
    console.error("Error merging carts:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;