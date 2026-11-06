import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Product from "./models/Product.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, ".env") });

const prices = {
  "OX-SH-001": [1199, 999],
  "SLIM-SH-002": [999, 799],
  "CAS-DEN-003": [1399, 1199],
  "PRNT-RES-004": [899, 699],
  "SLIM-EIR-005": [1099, 899],
  "POLO-TSH-006": [799, 649],
  "OVS-GRF-007": [699, 549],
  "REG-HEN-008": [749, 599],
  "LST-THR-009": [899, 749],
  "VNECK-CLS-010": [499, 399],
  "BW-001": [999, 799],
  "BW-002": [1299, 1099],
  "BW-003": [899, 699],
  "BW-004": [1499, 1299],
  "BW-005": [1399, 1199],
  "BW-006": [899, 749],
  "BW-007": [1599, 1399],
  "BW-008": [1299, 1099],
  "BW-009": [899, 749],
  "BW-010": [1599, 1399],
  "BW-W-001": [1399, 1199],
  "BW-W-002": [1499, 1299],
  "BW-W-003": [599, 499],
  "BW-W-004": [1099, 899],
  "BW-W-005": [999, 799],
  "BW-W-006": [899, 749],
  "BW-W-007": [699, 549],
  "BW-W-008": [799, 649],
  "BW-W-009": [1099, 899],
  "BW-W-010": [1599, 1399],
  "TW-W-001": [799, 649],
  "TW-W-002": [999, 799],
  "TW-W-003": [599, 449],
  "TW-W-004": [899, 699],
  "TW-W-005": [699, 549],
  "TW-W-006": [699, 549],
  "TW-W-007": [999, 799],
  "TW-W-008": [899, 699],
  "TW-W-009": [1199, 999],
  "TW-W-010": [999, 799],
};

const apply = process.argv.includes("--apply");
const sourcePath = path.join(here, "data", "products.js");
const backupPath = `${sourcePath}.before-inr`;
const tempPath = `${sourcePath}.inr-tmp`;

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing from backend/.env");
  }

  const source = fs.readFileSync(sourcePath, "utf8");
  const blocks = source.split(/(?=^  \{\n)/m);
  const skuOf = (block) =>
    block.match(/^\s*sku:\s*"([^"]+)"/m)?.[1];

  const catalog = blocks
    .map((block) => ({ block, sku: skuOf(block) }))
    .filter((item) => item.sku);

  const catalogSkus = catalog.map((item) => item.sku);
  const mappedSkus = Object.keys(prices);

  if (
    catalog.length !== mappedSkus.length ||
    catalogSkus.some((sku) => !prices[sku]) ||
    mappedSkus.some((sku) => !catalogSkus.includes(sku))
  ) {
    throw new Error(
      "Catalogue and price map do not match. No updates were made."
    );
  }

  const updatedBlocks = blocks.map((block) => {
    const sku = skuOf(block);
    if (!sku) return block;

    const [price, discountPrice] = prices[sku];

    if (
      !/^\s*price:\s*[^,]+,/m.test(block) ||
      !/^\s*discountPrice:\s*[^,]+,/m.test(block)
    ) {
      throw new Error(`Price fields missing for ${sku}`);
    }

    return block
      .replace(/^(\s*price:\s*)[^,]+,/m, `$1${price},`)
      .replace(
        /^(\s*discountPrice:\s*)[^,]+,/m,
        `$1${discountPrice},`
      );
  });

  const updatedSource = updatedBlocks.join("");

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const dbProducts = await Product.find({
      sku: { $in: mappedSkus },
    })
      .select("sku name price discountPrice")
      .lean();

    const dbBySku = new Map(
      dbProducts.map((product) => [product.sku, product])
    );

    console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
    console.log(`Catalogue products: ${catalog.length}`);
    console.log(
      `MongoDB products matched: ${dbProducts.length}/${mappedSkus.length}`
    );

    for (const item of catalog) {
      const db = dbBySku.get(item.sku);
      const [price, discount] = prices[item.sku];

      console.log(
        `${item.sku} | ${item.block.match(/^\s*name:\s*"([^"]+)"/m)?.[1]} | ` +
        `Proposed: ₹${price} (sale ₹${discount}) | ` +
        `DB: ${db ? `₹${db.price}` : "SKU NOT FOUND"}`
      );
    }

    if (!apply) {
      console.log("\nPreview only. Nothing was changed.");
      console.log("Review the output before using --apply.");
      return;
    }

    if (dbProducts.length !== mappedSkus.length) {
      throw new Error("Not all SKUs exist in MongoDB. Nothing was updated.");
    }

    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(sourcePath, backupPath);
    }

    fs.writeFileSync(tempPath, updatedSource, "utf8");

    try {
      const result = await Product.bulkWrite(
        mappedSkus.map((sku) => ({
          updateOne: {
            filter: { sku },
            update: {
              $set: {
                price: prices[sku][0],
                discountPrice: prices[sku][1],
              },
            },
          },
        })),
        { ordered: true }
      );

      if (result.matchedCount !== mappedSkus.length) {
        throw new Error("Unexpected MongoDB match count.");
      }

      fs.renameSync(tempPath, sourcePath);
      console.log(
        `Updated ${result.matchedCount} database products and the catalogue.`
      );
    } catch (error) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw error;
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Price update stopped:", error.message);
  process.exitCode = 1;
});
