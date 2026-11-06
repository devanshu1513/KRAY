import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import Product from "../models/Product.js";

const router = express.Router();
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 8;
const MAX_PHOTO_SIZE = 3 * 1024 * 1024;
const getShoppingIntent = (message, history) => {
  const userContext = [
    ...history.filter((item) => item?.role === "user").map((item) => item.text),
    message,
  ].join(" ").toLowerCase();
  const gender = /\b(male|man|men|men's|mens|boy|boys)\b/.test(userContext)
    ? "Men"
    : /\b(female|woman|women|women's|womens|girl|girls)\b/.test(userContext) ? "Women" : null;
  const asksForTop = /\b(shirt|shirts|tee|tees|t-?shirt|t-?shirts|top|tops|blouse|blouses)\b/.test(message.toLowerCase());
  const asksForBottom = /\b(pant|pants|trouser|trousers|jean|jeans|shorts|skirt)\b/.test(message.toLowerCase());
  const completeLook = /\b(complete|full|whole)\s+(outfit|look|set)\b|\b(pair|outfit|look)\b/.test(message.toLowerCase());
  const categories = completeLook ? ["Top Wear", "Bottom Wear"]
    : asksForTop ? ["Top Wear"] : asksForBottom ? ["Bottom Wear"] : null;
  return { gender, categories, completeLook };
};

const chooseRecommendations = (products, requestedIds, intent) => {
  const byId = new Map(products.map((product) => [String(product._id), product]));
  const picks = [...new Set(requestedIds)].map((id) => byId.get(id)).filter(Boolean);
  if (intent.completeLook) {
    for (const category of ["Top Wear", "Bottom Wear"]) {
      if (!picks.some((product) => product.category === category)) {
        const fallback = products.find((product) => product.category === category && !picks.includes(product));
        if (fallback) picks.push(fallback);
      }
    }
    return picks.slice(0, 2);
  }
  return picks.slice(0, 3);
};

const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_SIZE, files: 1, fields: 2 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    callback(allowedTypes.includes(file.mimetype) ? null : new Error("Upload a JPG, PNG, or WebP image."), allowedTypes.includes(file.mimetype));
  },
}).single("photo");

router.post("/chat", (req, res, next) => {
  uploadPhoto(req, res, (error) => {
    if (error) {
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "That photo is too large. Please choose an image under 3 MB."
        : error.message || "Unable to process that photo.";
      return res.status(400).json({ message });
    }
    next();
  });
}, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: "The shopping assistant is not configured yet." });
  }

  const message = typeof req.body?.message === "string" ? req.body.message : "";
  if ((!message.trim() && !req.file) || message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ message: `Add a photo or a message up to ${MAX_MESSAGE_LENGTH} characters.` });
  }

  let history = [];
  let failurePhase = "product catalog lookup";
  try {
    history = req.body?.history ? JSON.parse(req.body.history) : [];
  } catch {
    return res.status(400).json({ message: "The conversation history could not be read. Please start a new conversation." });
  }

  const safeHistory = Array.isArray(history)
    ? history.slice(-MAX_HISTORY_ITEMS).filter((item) =>
      item && ["user", "model"].includes(item.role) && typeof item.text === "string" && item.text.length <= MAX_MESSAGE_LENGTH
    ).map(({ role, text }) => ({ role, parts: [{ text }] }))
    : [];
  const intent = getShoppingIntent(message, Array.isArray(history) ? history : []);

  try {
    const allProducts = await Product.find({ countInStock: { $gt: 0 } })
      .sort({ isFeatured: -1, createdAt: -1 })
      .select("name description price discountPrice category brand sizes colors collections material gender images rating countInStock tags")
      .lean();

    const products = allProducts.filter((product) =>
      (!intent.gender || product.gender === intent.gender)
      && (!intent.categories || intent.categories.includes(product.category))
    );

    const catalog = products.map((product) => ({
      id: String(product._id),
      name: product.name,
      description: String(product.description || "").slice(0, 400),
      price: product.discountPrice > 0 && product.discountPrice < product.price ? product.discountPrice : product.price,
      listPrice: product.price,
      category: product.category,
      brand: product.brand,
      sizes: product.sizes,
      colors: product.colors,
      collection: product.collections,
      material: product.material,
      gender: product.gender,
      rating: product.rating,
      inStock: product.countInStock,
      tags: product.tags,
    }));

    failurePhase = "Gemini request";
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 12000 } });
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const fallbackModels = [
      process.env.GEMINI_FALLBACK_MODEL || "gemini-3.7-flash",
      process.env.GEMINI_LAST_RESORT_MODEL || "gemini-3.8-flash",
    ];
    const request = {
      contents: [
        ...safeHistory,
        {
          role: "user",
          parts: [
            { text: message.trim() || "Suggest clothing styles and KRAY products that could work with this photo. Focus on the outfit, colors, and styling. Do not infer personal traits or body measurements." },
            ...(req.file ? [{ inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString("base64") } }] : []),
          ],
        },
      ],
      config: {
        systemInstruction: `You are KRAY's friendly clothing shopping assistant. Recommend only items in the supplied filtered catalog. Respect the shopper's stated gender and requested clothing type across the conversation; never substitute pants when they ask for shirts. For a complete outfit, choose at least one Top Wear and one Bottom Wear item, and explain the pairing. If no matching item exists, say the requested category is unavailable and do not show unrelated items. Use only catalog facts for names, prices, sizes, colors, stock and materials; prices are Indian rupees. Ask one concise follow-up only when useful. Do not infer race, ethnicity, age, health, body shape, or measurements from photos. For fit, ask for preferred size. Return concise text and exact catalog IDs. Catalog JSON: ${JSON.stringify(catalog)}`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            productIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["reply", "productIds"],
        },
        temperature: 0.5,
      },
    };

    let response;
    let lastError;
    const modelsToTry = [...new Set([model, ...fallbackModels])];
    for (let index = 0; index < modelsToTry.length; index += 1) {
      const currentModel = modelsToTry[index];
      try {
        response = await ai.models.generateContent({ model: currentModel, ...request });
        break;
      } catch (error) {
        lastError = error;
        const isTemporaryProviderFailure = /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED|504|DEADLINE_EXCEEDED/i.test(
          `${error?.status || error?.code || ""} ${error?.message || ""}`
        );
        if (!isTemporaryProviderFailure || index === modelsToTry.length - 1) throw error;
        console.warn(`Gemini model ${currentModel} unavailable; trying ${modelsToTry[index + 1]}.`);
      }
    }
    if (!response) throw lastError || new Error("Gemini returned no response.");

    const result = JSON.parse(response.text || "{}");
    let selected = chooseRecommendations(products, Array.isArray(result.productIds) ? result.productIds : [], intent);
    if (!selected.length && products.length) selected = chooseRecommendations(products, [String(products[0]._id)], intent);
    if (intent.categories) {
      if (!selected.length) {
        const audience = intent.gender ? `${intent.gender === "Men" ? "men’s" : "women’s"} ` : "";
        result.reply = `Sorry, we don’t currently have ${audience}${intent.categories.length > 1 ? "matching pieces for that outfit" : intent.categories[0].toLowerCase()} in stock.`;
      } else if (intent.completeLook && selected.length === 2) {
        const top = selected.find((product) => product.category === "Top Wear");
        const bottom = selected.find((product) => product.category === "Bottom Wear");
        result.reply = `For a complete look, pair the ${top.name} with the ${bottom.name}. Both are available in the sizes shown below.`;
      } else {
        const label = intent.categories[0] === "Top Wear" ? "shirts and tops" : "bottom-wear styles";
        result.reply = `Here are ${intent.gender === "Men" ? "men’s" : intent.gender === "Women" ? "women’s" : ""} ${label} from KRAY:`;
      }
    }
    const recommendations = selected.map((product) => ({
          _id: String(product._id),
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice,
          images: product.images,
        }));

    return res.json({ reply: typeof result.reply === "string" ? result.reply : "Tell me what style or budget you have in mind.", products: recommendations });
  } catch (error) {
    const providerStatus = error?.status || error?.code || error?.error?.status || "unknown";
    const providerMessage = String(error?.message || error?.error?.message || "");
    console.error("Shopping assistant Gemini request failed:", { status: providerStatus, message: providerMessage });

    let message = "Gemini couldn't complete that request. Please try again.";
    if (/API.?KEY.?INVALID|API key not valid|invalid api key/i.test(providerMessage) || /401|403|UNAUTHENTICATED|PERMISSION_DENIED/i.test(String(providerStatus))) {
      message = "Gemini rejected the API key. Check GEMINI_API_KEY in backend/.env, then restart the backend.";
    } else if (/404|NOT_FOUND/i.test(String(providerStatus)) || /NOT_FOUND|model.*not found/i.test(providerMessage)) {
      message = "Gemini model unavailable. Set GEMINI_MODEL=gemini-3.8-flash in backend/.env and restart the backend.";
    } else if (/429|RESOURCE_EXHAUSTED/i.test(String(providerStatus)) || /RESOURCE_EXHAUSTED|quota/i.test(providerMessage)) {
      message = "Gemini API quota is exhausted or rate limited. Check the key's usage and billing in Google AI Studio.";
    } else if (/timeout|timed out|ETIMEDOUT|AbortError|504|DEADLINE_EXCEEDED/i.test(`${providerStatus} ${providerMessage}`)) {
      message = "Gemini took too long to respond. Please try again with a smaller photo or a shorter question.";
    }

    return res.status(502).json({ message });
  }
});

export default router;
