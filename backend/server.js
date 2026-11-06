import "dotenv/config";
import express from "express";
import cors from "cors";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import connectDB from "./config/db.js";
// Import all routes as separate imports. They will be attached with app.use() later
import paymentRoutes from "./routes/payment.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import subscribeRoute from "./routes/subscribeRoute.js";
import shoppingAssistantRoutes from "./routes/shoppingAssistantRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productAdminRoutes from "./routes/productAdminRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("This website origin is not allowed by the KRAY API."));
  },
}));
app.use(express.json());

// Define a simple route for the root URL. This is the homepage of the API (not frontend)
app.get("/", (req, res) => {
  res.send("Welcome to the KRAY API. This API powers the KRAY clothing storefront.");
});

app.use("/api", async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// API routes
app.use("/api/payment", paymentRoutes); // Use payment routes for handling payment-related requests
app.use("/api/users", userRoutes); // Use userRoutes for handling user-related requests
app.use("/api/products", productRoutes); // Use productRoutes for handling product-related requests
app.use("/api/cart", cartRoutes); // Use cartRoutes for handling cart-related requests
app.use("/api/checkout", checkoutRoutes); // Use checkoutRoutes for handling checkout-related requests
app.use("/api/orders", orderRoutes); // Use orderRoutes for handling order-related requests
app.use("/api/upload", uploadRoutes); // Use uploadRoutes for handling image upload-related requests
app.use("/api", subscribeRoute); // Use subscribeRoutes for handling subscriber-related requests
app.use("/api/assistant", shoppingAssistantRoutes);

// Admin routes
app.use("/api/admin/users", adminRoutes); // Use adminRoutes for handling admin user management-related requests
app.use("/api/admin/products", productAdminRoutes); // Use productAdminRoutes for handling admin product management-related requests
app.use("/api/admin/orders", adminOrderRoutes); // Use adminOrderRoutes for handling admin order management-related requests

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("KRAY API request failed:", error);
  return res.status(500).json({
    message: process.env.NODE_ENV === "production" ? "The request could not be completed." : error.message,
  });
});

export default app;

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const port = process.env.PORT || 9000;
  app.listen(port, () => console.info(`KRAY API listening on port ${port}.`));
}
