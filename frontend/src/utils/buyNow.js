// Holds the single item for a "Buy Now" checkout. sessionStorage is used (not Redux)
// so the item survives the trip through the login page and a page refresh.
const KEY = "buyNowItem";
const MAX_AGE_MS = 30 * 60 * 1000; // ignore an abandoned Buy Now after 30 minutes

export const saveBuyNowItem = (item) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ item, savedAt: Date.now() }));
  } catch {
    /* storage unavailable: Buy Now simply won't persist */
  }
};

export const loadBuyNowItem = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY));
    if (saved && Date.now() - saved.savedAt < MAX_AGE_MS) return saved.item;
  } catch {
    /* ignore corrupt data */
  }
  return null;
};

export const clearBuyNowItem = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};