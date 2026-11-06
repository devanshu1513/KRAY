import React from "react";
import { clearBuyNowItem } from "../../utils/buyNow";
import { useNavigate } from "react-router-dom";
import { IoMdClose } from "react-icons/io";
import CartContents from "../Cart/CartContents";
import { useSelector } from "react-redux";

const CartDrawer = ({ drawerOpen, toggleCartDrawer }) => {
  const navigate = useNavigate();
  const { user, guestId } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const userId = user ? user._id : null;

  const handleCheckout = () => {
    clearBuyNowItem(); // checking out the cart, not a single Buy Now item
    toggleCartDrawer();
    if (!userId && cart.products.length > 0) {
      navigate("/login?redirect=checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-3/4 sm:w-1/2 md:w-120 bg-white shadow-lg transform transition-transform duration-300 flex flex-col z-50
      ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Close button */}
      <div className="flex justify-end p-4">
        <button onClick={toggleCartDrawer}>
          <IoMdClose className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Cart contents */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
        {cart && cart?.products?.length > 0 ? (
          <CartContents cart={cart} userId={userId} guestId={guestId} />
        ) : (
          <p>Your cart is empty!</p>
        )}
      </div>

      {/* Checkout button */}
      <div className="p-4 bg-white sticky bottom-0">
        {cart && cart?.products?.length > 0 && (
          <>
            <button
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
              onClick={handleCheckout}
            >
              Checkout
            </button>
            <p className="text-sm tracking-tight text-gray-500 mt-2 text-center">
              Shipping, taxes, and discount codes calculated at checkout!
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
