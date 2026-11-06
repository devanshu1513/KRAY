import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import connectDB from "../config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(
  __dirname,
  "../../frontend/public/products"
);

const productMap = [
  "OX-SH-001",
  "SLIM-SH-002",
  "CAS-DEN-003",
  "PRNT-RES-004",
  "SLIM-EIR-005",
  "POLO-TSH-006",
  "OVS-GRF-007",
  "REG-HEN-008",
  "LST-THR-009",
  "VNECK-CLS-010",

  "BW-001",
  "BW-002",
  "BW-003",
  "BW-004",
  "BW-005",
  "BW-006",
  "BW-007",
  "BW-008",
  "BW-009",
  "BW-010",

  "BW-W-001",
  "BW-W-002",
  "BW-W-003",
  "BW-W-004",
  "BW-W-005",
  "BW-W-006",
  "BW-W-007",
  "BW-W-008",
  "BW-W-009",
  "BW-W-010",

  "TW-W-001",
  "TW-W-002",
  "TW-W-003",
  "TW-W-004",
  "TW-W-005",
  "TW-W-006",
  "TW-W-007",
  "TW-W-008",
  "TW-W-009",
  "TW-W-010",
];

async function main() {
  console.log("\n KRAY local product image update\n");

  const missingFiles = productMap.filter(
    (sku) => !fs.existsSync(path.join(OUTPUT_DIR, `${sku}.jpg`))
  );

  if (missingFiles.length > 0) {
    throw new Error(
      `Missing image files:\n${missingFiles.join("\n")}`
    );
  }

  console.log("✓ All 40 local image files found.");

  const existingProducts = await Product.find({}).lean();

  const backupPath = path.resolve(
    __dirname,
    "../../product-image-backup.json"
  );

  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      existingProducts.map((p) => ({
        _id: p._id,
        sku: p.sku,
        name: p.name,
        images: p.images,
      })),
      null,
      2
    )
  );

  console.log(`✓ MongoDB image backup created: ${backupPath}`);

  let updated = 0;
  const missingSkus = [];

  for (const sku of productMap) {
    const product = existingProducts.find((p) => p.sku === sku);

    if (!product) {
      console.log(`⚠️ SKU not found in MongoDB: ${sku}`);
      missingSkus.push(sku);
      continue;
    }

    const imageUrl = `/products/${sku}.jpg`;

    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          images: [
            {
              url: imageUrl,
              altText: product.name || sku,
            },
          ],
        },
      }
    );

    updated++;
    console.log(`✓ ${sku} → ${imageUrl}`);
  }

  console.log("\n--------------------------------");
  console.log(`Updated products: ${updated}/40`);

  if (missingSkus.length) {
    console.log("\nMissing SKUs:");
    console.log(missingSkus.join("\n"));
  }

  console.log("--------------------------------\n");

  await mongoose.connection.close();
  console.log("MongoDB connection closed.");
}

async function run() {
  try {
    await connectDB();
    await main();
  } catch (error) {
    console.error("\n❌ IMAGE UPDATE FAILED\n");
    console.error(error);
    process.exit(1);
  }
}

run();
