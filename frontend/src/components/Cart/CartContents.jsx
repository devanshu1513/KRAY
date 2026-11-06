import { formatINR } from "../../utils/price";
import React from "react";
import { RiDeleteBin3Line } from "react-icons/ri";
import { useDispatch } from "react-redux";
import { removeFromCart, updateCartItemQuantity } from "../../redux/slices/cartSlice";

const CartContents = ({ cart, userId, guestId }) => {
  const dispatch = useDispatch();

  // Handle adding or subtracting to cart
  const handleAddToCart = (productId, delta, quantity, size, color) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      dispatch(
        updateCartItemQuantity({
          productId,
          quantity: newQuantity,
          guestId,
          userId,
          size,
          color,
        })
      );
    }
  };

  const handleRemoveFromCart = (productId, size, color) => {
    dispatch(removeFromCart({ productId, guestId, userId, size, color }));
  };

  return (
    <div>
      {cart.products.map((product, index) => (
        <div
          key={index}
          className="flex items-start justify-between py-4 border-b border-[#e5e7eb]"
        >
          {/* Left section */}
          <div className="flex items-start">
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-24 object-cover mr-4 rounded-sm"
            />

            <div>
              <h3 className="text-[18px] font-semibold">{product.name}</h3>

              <p className="text-[14px] text-[#6b7280]">
                Size: {product.size} | Color: {product.color}
              </p>

              {/* Quantity controls */}
              <div className="flex items-center mt-2">
                <button
                  onClick={() =>
                    handleAddToCart(
                      product.productId,
                      -1,
                      product.quantity,
                      product.size,
                      product.color
                    )
                  }
                  className="border border-[#d1d5db] rounded-sm px-2 py-1 text-[20px] font-medium"
                >
                  -
                </button>

                <span className="mx-4">{product.quantity}</span>

                <button
                  onClick={() =>
                    handleAddToCart(
                      product.productId,
                      1,
                      product.quantity,
                      product.size,
                      product.color
                    )
                  }
                  className="border border-[#d1d5db] rounded-sm px-2 py-1 text-[20px] font-medium"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div>
            <p className="font-bold text-[16px]">
              {formatINR(product.price * product.quantity)}
            </p>
            <button
              onClick={() =>
                handleRemoveFromCart(
                  product.productId,
                  product.size,
                  product.color
                )
              }
              className="mt-2"
            >
              <RiDeleteBin3Line className="h-6 w-6 mt-2 text-[#dc2626]" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartContents;
