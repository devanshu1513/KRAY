import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Checkout from '../models/Checkout.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { protect } from '../middleware/authMiddleware.js';
import { getEffectivePrice } from '../utils/pricing.js';

const router = express.Router();

// @route POST /api/checkout
// @desc Create a new checkout
// @access Private
router.post('/', protect, async (req, res) => {
    const { checkoutItems, shippingAddress, paymentMethod, fromCart = true } = req.body;
    if(!checkoutItems || checkoutItems.length === 0) {
        return res.status(400).json({message: 'No checkout items provided'});
    }
    try {
        // The browser only decides WHICH product, size, colour and quantity.
        // Names, images, prices and the total are always rebuilt from the database.
        const verifiedItems = [];
        let total = 0;

        for (const item of checkoutItems) {
            const quantity = parseInt(item.quantity, 10);
            if (!mongoose.isValidObjectId(item.productId) || !(quantity > 0)) {
                return res.status(400).json({ message: 'Invalid item in checkout' });
            }

            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: 'A product in your order is no longer available' });
            }
            if (!product.sizes.includes(item.size) || !product.colors.includes(item.color)) {
                return res.status(400).json({ message: `Selected size or color is not available for ${product.name}` });
            }
            if (product.countInStock < quantity) {
                return res.status(400).json({ message: `Only ${product.countInStock} left of ${product.name}` });
            }

            const price = getEffectivePrice(product);
            total += price * quantity;
            verifiedItems.push({
                productId: product._id,
                name: product.name,
                image: product.images?.[0]?.url,
                price,
                quantity,
                size: item.size,
                color: item.color,
            });
        }

        const newCheckout = await Checkout.create({
            user: req.user._id,
            checkoutItems: verifiedItems,
            shippingAddress,
            paymentMethod,
            totalPrice: Math.round(total * 100) / 100,
            paymentStatus: 'Pending',
            isPaid: false,
            fromCart: fromCart !== false,
        });
        console.log(`Checkout created for user: ${newCheckout._id}`);
        res.status(201).json(newCheckout);
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({message: 'Server error'});
    }
});

// @route PUT /api/checkout/:id/pay
// @desc Update checkout to paid after successful payment
// @access Private
router.put('/:id/pay', protect, async (req, res) => {
    const { paymentDetails } = req.body;
    try {
        const checkout = await Checkout.findById(req.params.id);
        if (!checkout) {
            return res.status(404).json({ message: 'Checkout not found' });
        }
        if (checkout.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not allowed to pay for this checkout' });
        }
        if (checkout.isPaid) {
            return res.status(200).json(checkout); // already paid, nothing to do
        }

        // Never trust the browser's claim that it paid: verify Razorpay's signature.
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails || {};
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || razorpay_order_id !== checkout.razorpayOrderId) {
            return res.status(400).json({ message: 'Payment details do not match this checkout' });
        }
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        const given = Buffer.from(String(razorpay_signature));
        const wanted = Buffer.from(expected);
        if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) {
            return res.status(400).json({ message: 'Payment verification failed' });
        }

        checkout.isPaid = true;
        checkout.paymentStatus = 'paid';
        checkout.paymentDetails = paymentDetails;
        checkout.paidAt = Date.now();
        await checkout.save();
        res.status(200).json(checkout);
    } catch (error) {
        console.error("Error updating checkout:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route POST /api/checkout/:id/finalize
// @desc Finalize checkout and convert to an order after payment confirmation
// @access Private
router.post('/:id/finalize', protect, async (req, res) => {
    try {
        const checkout = await Checkout.findById(req.params.id);
        if (!checkout) {
            return res.status(404).json({ message: 'Checkout not found' });
        }
        if (checkout.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not allowed to finalize this checkout' });
        }
        if (checkout.isPaid && !checkout.isFinalized) {
            // Create final order based on checkout details
            const finalOrder = await Order.create({
                user: checkout.user,
                orderItems: checkout.checkoutItems,
                shippingAddress: checkout.shippingAddress,
                paymentMethod: checkout.paymentMethod,
                totalPrice: checkout.totalPrice,
                isPaid: checkout.isPaid,
                paidAt: checkout.paidAt,
                isDelivered: false,
                paymentStatus: 'paid',
                paymentDetails: checkout.paymentDetails,
            });

            // Mark checkout as finalized to prevent duplicate orders
            checkout.isFinalized = true;
            checkout.finalizedAt = Date.now();
            await checkout.save();

            // Delete the cart only when this order was built from it (not for a single-item Buy Now)
            if (checkout.fromCart) {
                await Cart.findOneAndDelete({ user: checkout.user });
            }

            console.log(`Checkout finalized and order created: ${finalOrder._id}`);
            res.status(201).json(finalOrder);
        } else if (checkout.isFinalized) {
            res.status(400).json({ message: 'Checkout already finalized' });
        } else {
            res.status(400).json({ message: 'Checkout not paid' });
        }
    } catch (error) {
        console.error("Error finalizing checkout:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;