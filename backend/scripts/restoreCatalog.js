import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import products from "../data/products.js";
import Product from "../models/Product.js";
import connectDB from "../config/db.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(scriptDir, "../../frontend/public/products");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured.");

  const prepared = await Promise.all(products.map(async (product) => {
    const imagePath = path.join(imagesDir, `${product.sku}.jpg`);
    await fs.access(imagePath);
    return { product, imagePath };
  }));

  await connectDB();
  const existingSkus = new Set((await Product.find({}, { sku: 1 }).lean()).map(({ sku }) => sku));
  const toAdd = prepared.filter(({ product }) => !existingSkus.has(product.sku));
  console.info(`Connected to database ${mongoose.connection.name}; ${existingSkus.size} existing catalog SKUs; ${toAdd.length} missing.`);

  let added = 0;
  for (const { product } of toAdd) {
    const catalogProduct = {
      ...product,
      images: [{ url: `/products/${product.sku}.jpg`, altText: `${product.name} product photo` }],
      isPublished: true,
    };
    const result = await Product.updateOne(
      { sku: product.sku },
      { $setOnInsert: catalogProduct },
      { upsert: true, runValidators: true },
    );
    if (result.upsertedCount) added += 1;
  }

  const total = await Product.countDocuments();
  console.info(`Catalog restore complete: added ${added}; total products now ${total}.`);
}

main()
  .catch((error) => {
    const rawMessage = typeof error?.message === "string"
      ? error.message
      : typeof error?.error?.message === "string"
        ? error.error.message
        : "Catalog import operation failed.";
    const message = rawMessage.replace(/mongodb(?:\+srv)?:\/\/\S+/gi, "<redacted MongoDB URI>");
    console.error(`Catalog restore failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect().catch(() => {}));
