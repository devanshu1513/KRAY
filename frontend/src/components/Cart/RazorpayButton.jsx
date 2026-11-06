import axios from "axios";
import { useState } from "react";

const RazorpayButton = ({ checkoutId, amount, onSuccess, onError }) => {
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async () => {
    if (isPaying) return;
    setIsPaying(true);
    try {
      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout did not load. Check your connection and refresh the page.");
      }

      // The server reads the amount from the saved checkout, so only the checkout id is sent
      const { data: order } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/payment/create-order`,
        { checkoutId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` } }
      );

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: "INR",
        name: "KRAY",
        description: "KRAY order payment",
        order_id: order.id,

        handler: async function (response) {
          console.log("Payment success:", response);
          try {
            await onSuccess(response);
          } finally {
            setIsPaying(false);
          }
        },

        modal: {
          ondismiss: function () {
            onError("Payment cancelled");
            setIsPaying(false);
          },
        },

        theme: {
          color: "#000000",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (event) => {
        onError(event.error?.description || "Razorpay could not complete this payment. Please try again.");
        setIsPaying(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      onError(err.response?.data?.error || err.response?.data?.message || err.message || "Could not start the Razorpay payment. Please try again.");
      setIsPaying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={isPaying}
      className="w-full rounded bg-black py-3 text-white disabled:cursor-wait disabled:opacity-60"
    >
      {isPaying ? "Opening secure checkout…" : `Pay ₹${amount}`}
    </button>
  );
};

export default RazorpayButton;
