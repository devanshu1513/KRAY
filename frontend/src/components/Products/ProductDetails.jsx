import React, { useEffect } from 'react';
import { getColorSwatch } from "../../utils/colors";
import { getEffectivePrice, hasDiscount, discountPercent, formatINR } from "../../utils/price";
import { saveBuyNowItem } from "../../utils/buyNow";
import { toast } from 'sonner';
import ProductGrid from './ProductGrid';
import { useParams, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductDetails, fetchSimilarProducts } from '../../redux/slices/productsSlice';
import { addToCart } from '../../redux/slices/cartSlice';

const MAX_QUANTITY = 10;

// Heading used above each option group (colour, size, quantity)
const OptionLabel = ({ children, hint }) => (
    <p className="mb-2.5 flex items-baseline gap-2 font-display text-base font-semibold text-neel">
        {children}
        {hint && <span className="font-sans text-sm font-normal text-gray-600">{hint}</span>}
    </p>
);

const FieldError = ({ children }) => (
    <p role="alert" className="mt-2 text-sm text-rabbit-red">{children}</p>
);

const ProductSkeleton = () => (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:gap-12">
            <div className="aspect-[4/5] rounded-xl bg-stone-200 md:w-1/2" />
            <div className="space-y-4 md:w-1/2">
                <div className="h-9 w-3/4 rounded bg-stone-200" />
                <div className="h-7 w-24 rounded bg-stone-200" />
                <div className="h-20 rounded bg-stone-200" />
                <div className="h-10 w-2/3 rounded bg-stone-200" />
                <div className="h-12 rounded bg-stone-200" />
            </div>
        </div>
    </div>
);

const ProductDetails = ({ productId }) => {
    const {id} = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { selectedProduct, loading, error, similarProducts } = useSelector((state) => state.products);
    const { user, guestId } = useSelector((state) => state.auth);
    const [mainImage, setMainImage] = React.useState(selectedProduct?.images?.[0]?.url || null);
    const [selectedSize, setSelectedSize] = React.useState("");
    const [selectedColor, setSelectedColor] = React.useState("");
    const [quantity, setQuantity] = React.useState(1);
    const [isButtonDisabled, setIsButtonDisabled] = React.useState(false);
    const [triedToSubmit, setTriedToSubmit] = React.useState(false);

    const productFetchId = productId || id;

    useEffect(() => {
        if (productFetchId) {
            dispatch(fetchProductDetails(productFetchId));
            dispatch(fetchSimilarProducts({ id: productFetchId }));
        }
    }, [dispatch, productFetchId, user, guestId]);

    React.useEffect(() => {
        if (selectedProduct?.images?.length > 0) {
            setMainImage(selectedProduct.images[0].url);
        }
    }, [selectedProduct]);

    const stock = selectedProduct?.countInStock;
    const outOfStock = stock !== undefined && stock <= 0;
    const maxQuantity = stock !== undefined && stock > 0 ? Math.min(stock, MAX_QUANTITY) : MAX_QUANTITY;

    const handleQuantityChange = (action) => {
        if (action === "plus") {
            setQuantity((prev) => Math.min(prev + 1, maxQuantity));
        } else if (action === "minus") {
            setQuantity((prev) => Math.max(prev - 1, 1));
        }
    }

    // Both buttons need a size and a colour; missing ones are flagged inline
    const hasRequiredOptions = () => {
        if (!selectedSize || !selectedColor) {
            setTriedToSubmit(true);
            return false;
        }
        return true;
    };

    const addSelectionToCart = () =>
        dispatch(
            addToCart({
                productId: productFetchId,
                size: selectedSize,
                color: selectedColor,
                quantity, guestId, userId: user?._id,
            })
        ).unwrap();

    const handleAddToCart = async () => {
        if (!hasRequiredOptions()) return;

        setIsButtonDisabled(true);
        try {
            await addSelectionToCart();
            toast.success("Product added to cart!", { duration: 1000 });
        } catch (err) {
            toast.error(err?.message || "Could not add to cart. Please try again.", { duration: 1500 });
        } finally {
            setIsButtonDisabled(false);
        }
    };

    // Buy Now: check out just this item, leaving the cart untouched.
    // Guests are sent to login first; the item is kept in sessionStorage meanwhile.
    const handleBuyNow = () => {
        if (!hasRequiredOptions()) return;

        saveBuyNowItem({
            productId: productFetchId,
            name: selectedProduct.name,
            image: selectedProduct.images?.[0]?.url,
            price: getEffectivePrice(selectedProduct),
            size: selectedSize,
            color: selectedColor,
            quantity,
        });
        navigate(user ? "/checkout" : "/login?redirect=checkout");
    };

    if(loading) {
        return <ProductSkeleton />;
    }

    if(error) {
        return <p className="py-16 text-center text-rabbit-red">Error: {error}</p>;
    }

    if(!selectedProduct) {
        return null;
    }

    const missingColor = triedToSubmit && !selectedColor;
    const missingSize = triedToSubmit && !selectedSize;
    const details = [
        ["Brand", selectedProduct.brand],
        ["Material", selectedProduct.material],
        ["Category", selectedProduct.category],
        ["Gender", selectedProduct.gender],
    ].filter(([, value]) => value);

    const thumbClass = (url) =>
        `h-20 w-20 shrink-0 cursor-pointer rounded-lg border-2 bg-stone-100 object-cover transition ${mainImage === url ? "border-neel" : "border-transparent hover:border-neel/40"}`;

    return (
    <div className="px-4 py-6 md:px-6 md:py-10">
        <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-8 md:flex-row md:gap-12">
                {/* Gallery */}
                <div className="md:flex md:w-1/2 md:gap-4">
                    <div className="hidden flex-col gap-3 md:flex">
                        {selectedProduct.images.map((image, index) => (
                            <img src={image.url} key={index} alt={image.altText || `Thumbnail ${index + 1}`} className={thumbClass(image.url)} onClick={() => setMainImage(image.url)} />
                        ))}
                    </div>
                    <div className="min-w-0 grow">
                        <div className="overflow-hidden rounded-xl bg-stone-100 ring-1 ring-black/5">
                            {mainImage && <img src={mainImage} alt={selectedProduct.name} className="h-auto w-full object-cover" />}
                        </div>
                        <div className="mt-3 flex gap-3 overflow-x-auto md:hidden">
                            {selectedProduct.images.map((image, index) => (
                                <img src={image.url} key={index} alt={image.altText || `Thumbnail ${index + 1}`} className={thumbClass(image.url)} onClick={() => setMainImage(image.url)} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Product info */}
                <div className="md:w-1/2">
                    <h1 className="font-display text-3xl font-bold leading-tight text-neel md:text-4xl">
                        {selectedProduct.name}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <p className="font-display text-2xl font-semibold text-ink">{formatINR(getEffectivePrice(selectedProduct))}</p>
                        {hasDiscount(selectedProduct) && (
                            <>
                                <p className="text-lg text-gray-400 line-through">{formatINR(selectedProduct.price)}</p>
                                <span className="rounded-full bg-haldi/20 px-2.5 py-0.5 text-sm font-medium text-ink">
                                    Save {discountPercent(selectedProduct)}%
                                </span>
                            </>
                        )}
                        {selectedProduct.rating > 0 && (
                            <p className="text-sm text-gray-600">
                                <span className="text-haldi" aria-hidden="true">★</span>{" "}
                                {selectedProduct.rating} ({selectedProduct.numReviews} reviews)
                            </p>
                        )}
                    </div>
                    {outOfStock && <p className="mt-2 text-sm font-medium text-rabbit-red">Out of stock</p>}
                    {!outOfStock && stock !== undefined && stock <= 5 && (
                        <p className="mt-2 text-sm font-medium text-rabbit-red">Only {stock} left</p>
                    )}
                    <p className="mt-4 max-w-prose leading-relaxed text-gray-600">{selectedProduct.description}</p>

                    <div className="my-6 border-t border-dotted border-neel/25" />

                    {/* Color options */}
                    <div className="mb-6">
                        <OptionLabel hint={selectedColor}>Color</OptionLabel>
                        <div className="flex flex-wrap gap-3">
                            {selectedProduct.colors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    title={color}
                                    aria-label={color}
                                    aria-pressed={selectedColor === color}
                                    onClick={() => setSelectedColor(selectedColor === color ? "" : color)}
                                    className={`h-9 w-9 rounded-full border border-black/15 transition hover:scale-110 ${selectedColor === color ? "ring-2 ring-neel ring-offset-2" : ""}`}
                                    style={{ backgroundColor: getColorSwatch(color) }}
                                ></button>
                            ))}
                        </div>
                        {missingColor && <FieldError>Select a color to continue.</FieldError>}
                    </div>

                    {/* Size options */}
                    <div className="mb-6">
                        <OptionLabel hint={selectedSize}>Size</OptionLabel>
                        <div className="flex flex-wrap gap-2">
                            {selectedProduct.sizes.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    aria-pressed={selectedSize === size}
                                    onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                                    className={`min-w-12 rounded-full border px-4 py-1.5 text-sm transition-colors ${selectedSize === size ? "border-neel bg-neel text-white" : "border-neel/25 bg-white text-neel hover:border-neel"}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                        {missingSize && <FieldError>Select a size to continue.</FieldError>}
                    </div>

                    {/* Quantity options */}
                    <div className="mb-8">
                        <OptionLabel>Quantity</OptionLabel>
                        <div className="inline-flex items-center rounded-full border border-neel/25 bg-white">
                            <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => handleQuantityChange("minus")} className="h-10 w-10 rounded-full text-lg text-neel hover:bg-chandan disabled:opacity-30">−</button>
                            <span className="w-8 text-center font-medium" aria-live="polite">{quantity}</span>
                            <button type="button" aria-label="Increase quantity" disabled={quantity >= maxQuantity} onClick={() => handleQuantityChange("plus")} className="h-10 w-10 rounded-full text-lg text-neel hover:bg-chandan disabled:opacity-30">+</button>
                        </div>
                    </div>

                    {/* Add to cart button */}
                    <button
                        disabled={isButtonDisabled || outOfStock}
                        onClick={handleAddToCart}
                        className="mb-3 w-full rounded-full border-2 border-neel px-6 py-3 font-medium text-neel transition-colors hover:bg-neel hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neel"
                    >
                        {outOfStock ? "Out of stock" : isButtonDisabled ? "Adding..." : "Add to Cart"}
                    </button>
                    {/* Buy now button */}
                    <button
                        disabled={outOfStock}
                        onClick={handleBuyNow}
                        className="w-full rounded-full border-2 border-neel bg-neel px-6 py-3 font-medium text-white transition-colors hover:bg-neel/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {outOfStock ? "Out of stock" : "Buy Now"}
                    </button>

                    {/* Characteristics */}
                    {details.length > 0 && (
                        <div className="mt-10">
                            <h3 className="mb-2 font-display text-lg font-semibold text-neel">Details</h3>
                            <dl className="divide-y divide-dotted divide-neel/25 border-y border-dotted border-neel/25 text-sm">
                                {details.map(([label, value]) => (
                                    <div key={label} className="flex justify-between gap-4 py-2.5">
                                        <dt className="text-gray-600">{label}</dt>
                                        <dd className="text-right font-medium text-ink">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-20">
                <div className="kantha-border mb-6 rounded-sm" aria-hidden="true" />
                <h2 className="mb-6 font-display text-2xl font-bold text-neel">
                    You May Also Like
                </h2>
                <ProductGrid products={similarProducts} loading={loading} error={error}/>
            </div>
        </div>
    </div>
    )
}

export default ProductDetails
