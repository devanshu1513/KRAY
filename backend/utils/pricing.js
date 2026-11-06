// The price a customer actually pays: the sale price when one is set and lower
// than the list price, otherwise the list price.
export const getEffectivePrice = (product) => {
  const { price, discountPrice } = product;
  return discountPrice > 0 && discountPrice < price ? discountPrice : price;
};

// The same rule as a MongoDB aggregation expression, so the database can
// filter and sort by the price the customer pays.
export const effectivePriceExpr = {
  $cond: [
    { $and: [{ $gt: ["$discountPrice", 0] }, { $lt: ["$discountPrice", "$price"] }] },
    "$discountPrice",
    "$price",
  ],
};
