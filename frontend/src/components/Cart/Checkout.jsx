import { formatINR } from "../../utils/price";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RazorpayButton from "./RazorpayButton";
import { useDispatch, useSelector } from "react-redux";
import { createCheckout } from "../../redux/slices/checkoutSlice";
import axios from "axios";
import { loadBuyNowItem, clearBuyNowItem } from "../../utils/buyNow";

const DEFAULT_SHIPPING_ADDRESS = {
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  phone: "",
};

const getInitialShippingAddress = () => {
  try {
    const savedAddress = sessionStorage.getItem("checkoutShippingAddress");
    return savedAddress
      ? { ...DEFAULT_SHIPPING_ADDRESS, ...JSON.parse(savedAddress) }
      : DEFAULT_SHIPPING_ADDRESS;
  } catch {
    return DEFAULT_SHIPPING_ADDRESS;
  }
};

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  // "Buy Now" checks out a single item; otherwise we check out the whole cart
  const [buyNowItem] = React.useState(() => loadBuyNowItem());
  const items = buyNowItem ? [buyNowItem] : cart?.products || [];
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

  const [checkoutId, setCheckoutId] = React.useState(null);
  const [payTotal, setPayTotal] = React.useState(null); // total confirmed by the server
  const [checkoutError, setCheckoutError] = React.useState("");
  const total = payTotal ?? subtotal;
  const [shippingAddress, setShippingAddress] = React.useState(getInitialShippingAddress);

  // Ensure cart is loaded before proceeding
  useEffect(() => {
    if (items.length === 0) {
      navigate("/");
    }
  }, [items.length, navigate]);

  const handleCreateCheckout = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setCheckoutError("");
    // Only the product, size, color and quantity matter here: the server works out the real prices
    const res = await dispatch(createCheckout({
      checkoutItems: items,
      shippingAddress,
      paymentMethod: "Razorpay",
      fromCart: !buyNowItem,
    }));
    if (res.payload && res.payload._id) {
      setCheckoutId(res.payload._id); // Set checkout ID if checkout creation is successful
      setPayTotal(res.payload.totalPrice); // pay exactly what the server calculated
      sessionStorage.removeItem("checkoutShippingAddress");
    } else if (res.payload?.requiresLogin) {
      sessionStorage.setItem("checkoutShippingAddress", JSON.stringify(shippingAddress));
      navigate("/login?redirect=checkout");
    } else {
      setCheckoutError(res.payload?.message || "Could not start checkout. Please try again.");
    }
  };

  const handlePaymentSuccess = async (details) => {
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/checkout/${checkoutId}/pay`, {
        paymentDetails: details
      }, { headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` } }
    );
      await handleFinalizeCheckout(checkoutId); // Finalize checkout if payment is successful
    } catch (error) {
      console.error(error);
      setCheckoutError(error.response?.data?.message || "We could not confirm your payment. If money was deducted, please contact support.");
    }
  };

  const handleFinalizeCheckout = async (checkoutId) => {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/checkout/${checkoutId}/finalize`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` }
    });
    clearBuyNowItem();
    navigate("/order-confirmation");
  };

  if (loading) {
    return <p>Loading cart...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (items.length === 0) {
    return <p>Your cart is empty!</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
      {/* Left section */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl uppercase mb-6">Checkout</h2>
        <form onSubmit={handleCreateCheckout}>
          <h3 className="text-lg mb-4">Contact Details</h3>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={user ? user.email : ""}
              className="w-full p-2 border border-gray-200 rounded"
              disabled
            />
          </div>
          <h3 className="text-lg mb-4">Delivery</h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">First Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded border-gray-200"
                required
                value={shippingAddress.firstName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    firstName: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-gray-700">Last Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded border-gray-200"
                required
                value={shippingAddress.lastName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    lastName: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <input
              type="text"
              className="w-full p-2 border rounded border-gray-200"
              required
              value={shippingAddress.address}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  address: e.target.value,
                })
              }
            />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">City</label>
              <input
                type="text"
                className="w-full p-2 border rounded border-gray-200"
                required
                value={shippingAddress.city}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    city: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-gray-700">Postal Code</label>
              <input
                type="text"
                className="w-full p-2 border rounded border-gray-200"
                required
                value={shippingAddress.postalCode}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    postalCode: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Country</label>
            <input
              type="text"
              className="w-full p-2 border rounded border-gray-200"
              required
              value={shippingAddress.country}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  country: e.target.value,
                })
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Phone</label>
            <input
              type="tel"
              className="w-full p-2 border rounded border-gray-200"
              required
              value={shippingAddress.phone}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  phone: e.target.value,
                })
              }
            />
          </div>
          <div className="mt-6">
            {checkoutError && (
              <p role="alert" className="mb-3 text-sm text-rabbit-red">{checkoutError}</p>
            )}
            {!checkoutId ? (
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded"
              >
                Continue to Payment
              </button>
            ) : (
              <div>
                <h3 className="text-lg mb-4">Pay with Razorpay</h3>
                {/* Razorpay button component */}
                <RazorpayButton
                  checkoutId={checkoutId}
                  amount={total}
                  onSuccess={handlePaymentSuccess}
                  onError={(message) => setCheckoutError(message)}
                />
              </div>
            )}
          </div>
        </form>
      </div>
      {/* Right section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg mb-4">Order Summary</h3>
        <div className="border-t border-gray-200 py-4 mb-4">
          {items.map((product, index) => (
            <div
              key={index}
              className="flex items-start justify-between py-2 border-b border-gray-200"
            >
              <div className="flex items-start">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-24 object-cover mr-4"
                />
                <div>
                  <h3 className="text-md">{product.name}</h3>
                  <p className="text-gray-500">Size: {product.size}</p>
                  <p className="text-gray-500">Color: {product.color}</p>
                  <p className="text-gray-500">Qty: {product.quantity}</p>
                </div>
              </div>
              <p className="text-xl">{formatINR(product.price)}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-lg mb-4">
          <p>Subtotal</p>
          <p>{formatINR(total)}</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p>Shipping</p>
          <p>Free</p>
        </div>
        <div className="flex justify-between items-center text-lg mt-4 border-t pt-4">
          <p>Total</p>
          <p>{formatINR(total)}</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
