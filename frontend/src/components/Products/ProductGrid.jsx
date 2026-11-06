import React from "react";
import { Link, useLocation } from "react-router-dom";
import { getEffectivePrice, hasDiscount, formatINR } from "../../utils/price";

const ProductGrid = ({ products, loading, error }) => {
    const { pathname, search } = useLocation();
    const colorValues = {
        black: "#171717", white: "#fff", red: "#dc2626", blue: "#2563eb", navy: "#172554",
        "navy blue": "#172554", "light blue": "#93c5fd", gray: "#9ca3af", grey: "#9ca3af",
        charcoal: "#404040", beige: "#d8c7a1", cream: "#f4ead4", brown: "#795548", green: "#23834a",
        olive: "#657344", pink: "#ec9db2", yellow: "#facc15", purple: "#7e22ce", lavender: "#a78bfa",
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 xl:grid-cols-4 xl:gap-x-5">
                {[...Array(8)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                        <div className="w-full aspect-[4/5] rounded-xl bg-stone-200"></div>
                        <div className="h-5 bg-gray-200 rounded mt-3 w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded mt-2 w-1/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500">
                {error}
            </div>
        );
    }

    if (!products || products.length === 0) {
        const hasFilters = search.length > 1;
        return (
            <div className="py-16 text-center">
                <p className="font-display text-xl font-semibold text-neel">
                    {hasFilters ? "No products match these filters" : "No products found"}
                </p>
                {hasFilters && (
                    <>
                        <p className="mt-1 text-sm text-gray-600">Try removing a filter or two.</p>
                        <Link
                            to={pathname}
                            className="mt-5 inline-block rounded-full border-2 border-neel px-5 py-2 text-sm font-medium text-neel transition-colors hover:bg-neel hover:text-white"
                        >
                            Clear all filters
                        </Link>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 xl:grid-cols-4 xl:gap-x-5 xl:gap-y-8">
            {products.map((product) => (
                <Link
                    to={`/product/${product._id}`}
                    key={product._id}
                    className="group block min-w-0"
                >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f6f5f2] ring-1 ring-black/5">
                        <img
                            src={product.images?.[0]?.url}
                            alt={
                                product.images?.[0]?.altText ||
                                product.name
                            }
                            loading="lazy"
                            className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04] md:p-3"
                        />
                        {hasDiscount(product) && (
                            <span className="absolute left-3 top-3 rounded-md bg-rabbit-red px-2 py-1 text-[10px] font-semibold text-white">
                                -{Math.round(((product.price - getEffectivePrice(product)) / product.price) * 100)}%
                            </span>
                        )}
                    </div>

                    <div className="mt-2.5">
                        <p className="mb-1 truncate text-[11px] font-medium text-gray-500">{product.brand || product.category}</p>
                        <h3 className="min-h-10 text-sm font-medium leading-5 text-ink transition-colors group-hover:text-rabbit-red md:text-base">
                            {product.name}
                        </h3>
                        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                            <span className="font-semibold text-ink">{formatINR(getEffectivePrice(product))}</span>
                            {hasDiscount(product) && (
                                <span className="text-xs text-gray-400 line-through">{formatINR(product.price)}</span>
                            )}
                        </p>
                        {product.colors?.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5" aria-label={`Available colors: ${product.colors.join(", ")}`}>
                                {product.colors.slice(0, 5).map((color) => {
                                    const baseColor = color.toLowerCase().split(" ").at(-1);
                                    const value = colorValues[color.toLowerCase()] || colorValues[baseColor] || "#d6d3d1";
                                    return <span key={color} title={color} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: value }} />;
                                })}
                                {product.colors.length > 5 && <span className="ml-1 text-[11px] text-gray-500">+{product.colors.length - 5}</span>}
                            </div>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default ProductGrid;
