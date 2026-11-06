// Maps product colour names (as stored in the database) to a CSS colour so swatches
// render correctly. Plain CSS names like "Navy Blue" or "Heather Gray" are not valid
// CSS colours, which previously left those swatches blank/transparent.
const COLOR_HEX = {
  red: "#e53935",
  blue: "#1e40ff",
  black: "#000000",
  yellow: "#ffeb3b",
  gray: "#808080",
  grey: "#808080",
  white: "#ffffff",
  pink: "#f4a6b8",
  beige: "#e8dcc0",
  navy: "#001f5b",
  "navy blue": "#001f5b",
  "light blue": "#9ecbff",
  "dark blue": "#0b2a6f",
  "dark wash": "#2b3a55",
  "heather gray": "#b0b3b8",
  charcoal: "#36454f",
  khaki: "#c3b091",
  olive: "#6b7a2e",
  brown: "#795548",
  burgundy: "#800020",
  lavender: "#b9a7e6",
  "dark green": "#0b5d2a",
  green: "#2e9e4f",
  orange: "#fb8c00",
  purple: "#7b1fa2",
};

export const getColorSwatch = (name = "") => {
  const key = name.trim().toLowerCase();
  if (COLOR_HEX[key]) return COLOR_HEX[key];
  // Fall back to the last word ("Navy Palms" -> navy, "Tropical Print" -> neutral)
  const words = key.split(/\s+/);
  for (const w of words) if (COLOR_HEX[w]) return COLOR_HEX[w];
  return "#d1d5db"; // neutral grey for names we can't map (e.g. "Tropical Print")
};
