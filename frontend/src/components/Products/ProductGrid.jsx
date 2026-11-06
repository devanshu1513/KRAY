import React from "react";
import { Link, useLocation } from "react-router-dom";
import { getEffectivePrice, hasDiscount, formatINR } from "../../utils/price";

const ProductGrid = ({ products, loading, error }) => {
    const { pathname, search } = useLocation();

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product) => (
                <Link
                    to={`/product/${product._id}`}
                    key={product._id}
                    className="group block"
                >
                    <div className="w-full aspect-[4/5] overflow-hidden rounded-xl bg-stone-100 ring-1 ring-black/5">
                        <img
                            src={product.images?.[0]?.url}
                            alt={
                                product.images?.[0]?.altText ||
                                product.name
                            }
                            className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>

                    <div className="mt-3">
                        <h3 className="truncate text-[15px] font-medium text-ink transition-colors group-hover:text-rabbit-red">
                            {product.name}
                        </h3>
                        <p className="mt-1 flex items-baseline gap-2 text-[15px]">
                            <span className="font-semibold text-gray-700">{formatINR(getEffectivePrice(product))}</span>
                            {hasDiscount(product) && (
                                <span className="text-sm text-gray-400 line-through">{formatINR(product.price)}</span>
                            )}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default ProductGrid;