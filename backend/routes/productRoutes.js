import express from "express"; // Express framework
import Product from "../models/Product.js"; // Mongoose model (schema)
import { effectivePriceExpr } from "../utils/pricing.js";
import { protect, admin } from "../middleware/authMiddleware.js"; // admin = are you allowed to do admin actions? protect = who are you?

const router = express.Router();

// protect (JWT → req.user)
// admin (req.user.role === "admin"?)
// create product
// @route POST /api/products
// @desc Create new product in the database
// @access Private/Admin
router.post("/", protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
      user: req.user._id, // Reference to the admin user who created it. user: req.user._id is attached by 'protect' middleware. _id is MongoDB's object ID. This creates a reference to the admin who created the product
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error!" });
  }
});

// @route PUT /api/products
// @desc Update an existing product ID
// @access Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
    try {
        const {
          name,
          description,
          price,
          discountPrice,
          countInStock,
          category,
          brand,
          sizes,
          colors,
          collections,
          material,
          gender,
          images,
          isFeatured,
          isPublished,
          tags,
          dimensions,
          weight,
          sku,
        } = req.body;

        // Find the product by ID
        const product = await Product.findById(req.params.id);

        if (product) {
            // Update product fields. If something exists, keep that value. Else, update it
            product.name = name || product.name;
            product.description = description || product.description;
            product.price = price || product.price;
            product.discountPrice = discountPrice || product.discountPrice;
            product.countInStock = countInStock || product.countInStock;
            product.category = category || product.category;
            product.brand = brand || product.brand;
            product.sizes = sizes || product.sizes;
            product.colors = colors || product.colors;
            product.collections = collections || product.collections;
            product.material = material || product.material;
            product.gender = gender || product.gender;
            product.images = images || product.images;
            product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
            product.isPublished = isPublished !== undefined ? isPublished : product.isPublished;
            product.tags = tags || product.tags;
            product.dimensions = dimensions || product.dimensions;
            product.weight = weight || product.weight;
            product.sku = sku || product.sku;

            // Save the updated product to the database
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error!" });
    }
});

// @route DELETE /api/products/:id
// @desc Delete a product by ID
// @access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
    try {
        // Find the product by ID
        const product = await Product.findById(req.params.id);

        // If the product exists
        if (product) {
            // Remove the product from the database
            await product.deleteOne();
            res.json({ message: "Product removed successfully" });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error!" });
    }
});

// @route GET /api/products
// @desc Get all products with optional query filters
// @access Public
router.get("/", async (req, res) => {
    try {
        const { collection, size, color, gender, minPrice, maxPrice, sortBy, search, category, material, brand, limit, page } = req.query;
        let query = {};

        // Filtering logic
        if (collection && collection.toLocaleLowerCase() !== "all") {
            query.collections = collection;
        }

        if (size && size.toLocaleLowerCase() !== "all") {
            query.sizes = { $in: size.split(",") };
        }

        if (material) {
            query.material = { $in: material.split(",") };
        }

        if (brand) {
          query.brand = { $in: brand.split(",") };
        }

        if (size) {
          query.sizes = { $in: size.split(",") };
        }

        if (color) {
            // Colour families: each filter name maps to a pattern that is matched
            // case-insensitively against the product's colour names.
            const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const COLOR_RULES = {
                red: /\b(red|burgundy)\b/i,
                // Blue excludes anything containing "navy" so Blue and Navy don't overlap
                blue: /^(?!.*\bnavy\b).*\b(blue|dark wash)\b/i,
                navy: /\bnavy\b/i,
                gray: /\b(gray|grey|charcoal)\b/i,
                beige: /\b(beige|khaki|cream)\b/i,
                green: /\b(green|olive)\b/i,
                brown: /\bbrown\b/i,
                purple: /\b(purple|lavender)\b/i,
            };

            const colorPatterns = color
                .split(",")
                .map((c) => c.trim().toLowerCase())
                .filter(Boolean)
                .map((c) => COLOR_RULES[c] || new RegExp(`\\b${escapeRegex(c)}\\b`, "i"));

            if (colorPatterns.length) {
                query.colors = { $in: colorPatterns };
            }
        }

        if (gender) {
            query.gender = gender;
        }

        if (category) {
            query.category = category;
        }

        // Price filters use the price the customer actually pays (sale price if set)
        const priceFilter = {};
        if (Number(minPrice) > 0) priceFilter.$gte = Number(minPrice);
        if (Number(maxPrice) > 0) priceFilter.$lte = Number(maxPrice);

        if(search) {
            query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]; // 'i' means case sensitive
        }

        // Sort logic (_id is a tie-breaker so pages never overlap or skip items)
        let sort = { _id: 1 };
        switch (sortBy) {
            case "priceAsc":
                sort = { effectivePrice: 1, _id: 1 };
                break;
            case "priceDesc":
                sort = { effectivePrice: -1, _id: 1 };
                break;
            case "popularity":
                sort = { rating: -1, _id: 1 };
                break;
            default:
                break;
        }

        const pipeline = [
            { $match: query },
            { $addFields: { effectivePrice: effectivePriceExpr } },
        ];
        if (Object.keys(priceFilter).length > 0) {
            pipeline.push({ $match: { effectivePrice: priceFilter } });
        }
        pipeline.push({ $sort: sort });

        // Pagination is opt-in: with ?page=N the response is { products, page, pages, total }.
        // Without it the response is a plain array, exactly as before, so existing callers keep working.
        if (page) {
            const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
            const perPage = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 48);
            pipeline.push({
                $facet: {
                    products: [{ $skip: (pageNumber - 1) * perPage }, { $limit: perPage }],
                    total: [{ $count: "count" }],
                },
            });
            const [result] = await Product.aggregate(pipeline);
            const total = result.total[0]?.count || 0;
            return res.json({
                products: result.products,
                page: pageNumber,
                pages: Math.ceil(total / perPage),
                total,
            });
        }

        if (Number(limit) > 0) pipeline.push({ $limit: Number(limit) });
        const products = await Product.aggregate(pipeline);
        res.json(products);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error!" });
    }
});

// @route GET /api/products/filters
// @desc Return material and brand values currently present in the product database
// @access Public
router.get("/filters", async (req, res) => {
    try {
        const [materials, brands, priceStats] = await Promise.all([
            Product.distinct("material", { material: { $exists: true, $nin: ["", null] } }),
            Product.distinct("brand", { brand: { $exists: true, $nin: ["", null] } }),
            Product.aggregate([{ $group: { _id: null, max: { $max: effectivePriceExpr } } }]),
        ]);
        // Highest price in the catalogue, so the price slider never hides anything
        const maxPrice = priceStats[0]?.max ? Math.ceil(priceStats[0].max) : 100;

        const cleanAndSort = (values) => values
            .filter((value) => typeof value === "string" && value.trim().length > 0)
            .map((value) => value.trim())
            .filter((value, index, all) => all.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
            .sort((a, b) => a.localeCompare(b));

        res.json({ materials: cleanAndSort(materials), brands: cleanAndSort(brands), maxPrice });
    } catch (error) {
        console.error("Error fetching product filter options:", error);
        res.status(500).json({ message: "Unable to load product filter options." });
    }
});

// @route GET /api/products/best-seller
// @desc Get best-selling products based on highest rated products
// @access Public
router.get("/best-seller", async (req, res) => {
    try {
        const bestSeller = await Product.findOne().sort({ rating: -1 });
        if (bestSeller) {
            res.json(bestSeller);
        } else {
            res.status(404).json({ message: "No best seller found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error!" });
    }
});

// @route GET /api/products/new-arrivals
// @desc Get newly added 8 products sorted by creation date
// @access Public
router.get("/new-arrivals", async (req, res) => {
    try {
        // Keep this homepage rail representative across genders and departments,
        // rather than letting a batch import fill it with one category.
        const groups = await Promise.all([
            ["Men", "Top Wear"],
            ["Women", "Top Wear"],
            ["Men", "Bottom Wear"],
            ["Women", "Bottom Wear"],
        ].map(([gender, category]) => Product.find({ gender, category, countInStock: { $gt: 0 } })
            .sort({ createdAt: -1, rating: -1 })
            .limit(2)
            .lean()));
        const newArrivals = groups.flat();
        res.json(newArrivals);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error!" });
    }
});

// @route GET /api/products/:id
// @desc Get a single product by ID
// @access Public
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error!" });
    }
});

// @route GET /api/products/similar/:id
// @desc Get similar products based on current product's gender and category
// @access Public
router.get("/similar/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const similarProducts = await Product.find({
            _id: { $ne: id }, // Exclude the current product
            gender: product.gender,
            category: product.category,
        }).limit(4); // Limit to 4 similar products

        res.json(similarProducts);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error!" });
    }
});

export default router;
