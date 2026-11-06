// Returns the price the customer actually pays.
export const getEffectivePrice = (product) =>
  product?.discountPrice > 0 && product.discountPrice < product.price
    ? product.discountPrice
    : product?.price;

// Checks whether the product has a valid discount.
export const hasDiscount = (product) =>
  getEffectivePrice(product) < product?.price;

// Calculates the discount percentage.
export const discountPercent = (product) =>
  hasDiscount(product)
    ? Math.round(
        (1 - getEffectivePrice(product) / product.price) * 100
      )
    : 0;

// Formats prices as Indian Rupees, e.g. ₹1,199.
export const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(amount)) ? Number(amount) : 0);
