import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getColorSwatch } from "../../utils/colors";

const Section = ({ title, children, collapsible = false, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-5 border-b border-dotted border-neel/25 pb-5 last:mb-0 last:border-0 last:pb-0">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="mb-3 flex w-full items-center justify-between gap-3 text-left font-display text-base font-semibold text-neel"
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rotate-45 bg-haldi" aria-hidden="true" />
            {title}
          </span>
          <span className="text-lg leading-none" aria-hidden="true">{isOpen ? "^" : "⌄"}</span>
        </button>
      ) : (
        <h4 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-neel">
          <span className="h-2 w-2 rotate-45 bg-haldi" aria-hidden="true" />
          {title}
        </h4>
      )}
      {(!collapsible || isOpen) && children}
    </div>
  );
};

// Pill-style option (radio or checkbox) - same name/value/onChange as before
const Chip = ({ type, name, value, checked, onChange }) => (
  <label className="cursor-pointer">
    <input type={type} name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
    <span className="block rounded-full border border-neel/25 bg-white px-3.5 py-1.5 text-sm text-neel transition-colors hover:border-neel peer-checked:border-neel peer-checked:bg-neel peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-haldi">
      {value}
    </span>
  </label>
);

const Check = ({ name, value, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[15px] text-gray-700 hover:text-neel">
    <input type="checkbox" name={name} value={value} checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 accent-neel" />
    {value}
  </label>
);

const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState({
    category: "",
    gender: "",
    color: "",
    size: [],
    material: [],
    brand: [],
    minPrice: 0,
    maxPrice: 100,
  });

  const [priceRange, setPriceRange] = React.useState([0, 100]);
  const [availableFilters, setAvailableFilters] = useState({ materials: [], brands: [] });
  // Highest price in the catalogue (from the API), so the slider never hides expensive products
  const [maxAvailable, setMaxAvailable] = useState(100);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const [filterOptionsError, setFilterOptionsError] = useState(false);

  const categories = ["Top Wear", "Bottom Wear"];

  // Load material and brand options from the database instead of maintaining hardcoded lists.
  useEffect(() => {
    let cancelled = false;

    const loadFilterOptions = async () => {
      try {
        setFilterOptionsLoading(true);
        setFilterOptionsError(false);
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        const response = await axios.get(`${baseUrl}/products/filters`);
        if (!cancelled) {
          setAvailableFilters({
            materials: Array.isArray(response.data?.materials) ? response.data.materials : [],
            brands: Array.isArray(response.data?.brands) ? response.data.brands : [],
          });
          if (Number(response.data?.maxPrice) > 0) setMaxAvailable(Number(response.data.maxPrice));
        }
      } catch (error) {
        if (!cancelled) {
          setFilterOptionsError(true);
          setAvailableFilters({ materials: [], brands: [] });
          console.error("Could not load product filter options:", error);
        }
      } finally {
        if (!cancelled) setFilterOptionsLoading(false);
      }
    };

    loadFilterOptions();
    return () => { cancelled = true; };
  }, []);

  const materials = availableFilters.materials;
  const brands = availableFilters.brands;

  const colors = [
    "Red",
    "Blue",
    "Black",
    "Yellow",
    "Gray",
    "White",
    "Pink",
    "Beige",
    "Navy",
    "Green",
    "Brown",
    "Purple",
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const genders = ["Men", "Women"];

  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    // {category: 'Top Wear', color: 'Red', size: 'M,L', minPrice: '10', maxPrice: '90'} => params.category if you need category filter value

    setFilters({
      category: params.category || "",
      gender: params.gender || "",
      color: params.color || "",
      size: params.size ? params.size.split(",") : [],
      material: params.material ? params.material.split(",") : [],
      brand: params.brand ? params.brand.split(",") : [],
      minPrice: params.minPrice || 0,
      maxPrice: params.maxPrice || maxAvailable,
    });
    setPriceRange([0, params.maxPrice || maxAvailable]);
  }, [searchParams, maxAvailable]);

  const handleFilterChange = (e) => {
    const { name, value, checked, type } = e.target;
    let newFilters = { ...filters };

    if (type === "checkbox") {
      // For checkbox filters like size, material, brand
      if (checked) {
        newFilters[name] = [...(newFilters[name] || []), value];
      } else {
        newFilters[name] = newFilters[name].filter((item) => item !== value);
      }
    } else {
      newFilters[name] = value; // For types other than checkbox
    }
    setFilters(newFilters);
    updatedURLParams(newFilters);
  };

  // Clicking the selected colour again clears the colour filter
  const handleColorToggle = (color) => {
    const newFilters = { ...filters, color: filters.color === color ? "" : color };
    setFilters(newFilters);
    updatedURLParams(newFilters);
  };

  const updatedURLParams = (newFilters) => {
    const params = new URLSearchParams();
    // {category: "Top Wear", size: ["XS", "S"]}
    Object.keys(newFilters).forEach((key) => {
      // Only put a price limit in the URL when the shopper actually lowered it
      if (key === "maxPrice" && Number(newFilters.maxPrice) >= maxAvailable) return;
      if (Array.isArray(newFilters[key]) && newFilters[key].length > 0) {
        params.append(key, newFilters[key].join(","));
      } else if (newFilters[key]) {
        params.append(key, newFilters[key]);
      }
    });
    setSearchParams(params);
    navigate(`?${params.toString()}`); // ?category=Bottom+Wear&size=XS%2CS - here, %2C is the encoded version of comma
  };

  const handlePriceChange = (e) => {
    const newPrice = e.target.value;
    setPriceRange([0, newPrice]);
    const newFilters = { ...filters, minPrice: 0, maxPrice: newPrice };
    setFilters(newFilters);
    updatedURLParams(newFilters);
  }

  const hasActiveFilters =
    Boolean(filters.category || filters.gender || filters.color) ||
    filters.size.length > 0 ||
    filters.material.length > 0 ||
    filters.brand.length > 0 ||
    Number(filters.maxPrice) < maxAvailable;

  return (
    <div className="p-5">
      <div className="kantha-border -mx-5 -mt-5 mb-5" aria-hidden="true" />
      <div className="mb-6 flex items-baseline justify-between">
        <h3 className="font-display text-2xl font-bold text-neel">Filter</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="text-sm text-neel underline underline-offset-2 hover:text-rabbit-red"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category filter */}
      <Section title="Category">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Chip key={category} type="radio" name="category" value={category} checked={filters.category === category} onChange={handleFilterChange} />
          ))}
        </div>
      </Section>

      {/* Gender filter */}
      <Section title="Gender">
        <div className="flex flex-wrap gap-2">
          {genders.map((gender) => (
            <Chip key={gender} type="radio" name="gender" value={gender} checked={filters.gender === gender} onChange={handleFilterChange} />
          ))}
        </div>
      </Section>

      {/* Color filter */}
      <Section title="Color">
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => {
            const isSelected = filters.color === color;
            return (
              <button
                key={color}
                type="button"
                title={isSelected ? `${color} (click to clear)` : color}
                aria-label={color}
                aria-pressed={isSelected}
                onClick={() => handleColorToggle(color)}
                className={`h-8 w-8 rounded-full border border-black/15 transition hover:scale-110 ${isSelected ? "ring-2 ring-neel ring-offset-2" : ""}`}
                style={{ backgroundColor: getColorSwatch(color) }}
              ></button>
            );
          })}
        </div>
        {filters.color && (
          <p className="mt-3 text-sm text-gray-600">
            Showing {filters.color}{" "}
            <button
              type="button"
              onClick={() => handleColorToggle(filters.color)}
              className="text-neel underline underline-offset-2 hover:text-rabbit-red"
            >
              Clear
            </button>
          </p>
        )}
      </Section>

      {/* Size filter */}
      <Section title="Size">
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <Chip key={size} type="checkbox" name="size" value={size} checked={filters.size.includes(size)} onChange={handleFilterChange} />
          ))}
        </div>
      </Section>

      {/* Materials filter */}
      <Section title="Material" collapsible defaultOpen={false}>
        {filterOptionsLoading ? (
          <p className="text-sm text-gray-500">Loading materials…</p>
        ) : materials.length ? (
          materials.map((material) => (
            <Check key={material} name="material" value={material} checked={filters.material.includes(material)} onChange={handleFilterChange} />
          ))
        ) : (
          <p className="text-sm text-gray-500">
            {filterOptionsError ? "Unable to load materials." : "No materials available."}
          </p>
        )}
      </Section>

      {/* Brand filter */}
      <Section title="Brand" collapsible defaultOpen={false}>
        {filterOptionsLoading ? (
          <p className="text-sm text-gray-500">Loading brands…</p>
        ) : brands.length ? (
          brands.map((brand) => (
            <Check key={brand} name="brand" value={brand} checked={filters.brand.includes(brand)} onChange={handleFilterChange} />
          ))
        ) : (
          <p className="text-sm text-gray-500">
            {filterOptionsError ? "Unable to load brands." : "No brands available."}
          </p>
        )}
      </Section>

      {/* Price range filter */}
      <Section title="Price Range">
        <input
          type="range"
          name="priceRange"
          min={0}
          max={maxAvailable}
          value={priceRange[1]}
          onChange={handlePriceChange}
          className="w-full cursor-pointer accent-rabbit-red"
        />
        <div className="mt-2 flex justify-between text-sm font-medium text-neel">
          <span>$0</span>
          <span>${priceRange[1]}</span>
        </div>
      </Section>
    </div>
  );
};

export default FilterSidebar;