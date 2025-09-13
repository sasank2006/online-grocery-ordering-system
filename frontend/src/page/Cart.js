import React, { useState } from "react";
import { useSelector } from "react-redux";
import CartProduct from "../component/cartProduct";
import emptyCartImage from "../assest/empty.gif";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const productCartItem = useSelector((state) => state.product.cartItem);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [address, setAddress] = useState("");

  const totalPrice = productCartItem.reduce(
    (acc, curr) => acc + parseInt(curr.total),
    0
  );
  const totalQty = productCartItem.reduce(
    (acc, curr) => acc + parseInt(curr.qty),
    0
  );

  const handlePayment = async () => {
    if (!address.trim()) {
      toast.error("Please enter your delivery address.");
      return;
    }

    if (user.email) {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_SERVER_DOMIN}/create-checkout-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(productCartItem),
          }
        );

        const data = await res.json();

        if (!data.id) {
          throw new Error("Order creation failed");
        }

        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: "Your Shop Name",
          description: "Order Payment",
          order_id: data.id,
          handler: function (response) {
            toast.success("Payment Successful!");
            console.log("Payment ID:", response.razorpay_payment_id);
            console.log("Order ID:", response.razorpay_order_id);
            console.log("Signature:", response.razorpay_signature);
          },
          prefill: {
            name: user.name || "Customer",
            email: user.email,
            contact: "9999999999",
          },
          theme: {
            color: "#3399cc",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error("Payment Error:", error);
        toast.error("Payment failed. Try again.");
      }
    } else {
      toast("You have not Login!");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    }
  };

  return (
    <div className="p-2 md:p-4">
      <h2 className="text-lg md:text-2xl font-bold text-slate-600">
        Your Cart Items
      </h2>

      {productCartItem[0] ? (
        <div className="my-4 flex gap-3">
          {/* Cart Items */}
          <div className="w-full max-w-3xl">
            {productCartItem.map((el) => (
              <CartProduct
                key={el._id}
                id={el._id}
                name={el.name}
                image={el.image}
                category={el.category}
                qty={el.qty}
                total={el.total}
                price={el.price}
              />
            ))}
          </div>

          {/* Cart Summary */}
          <div className="w-full max-w-md ml-auto">
            <h2 className="bg-blue-500 text-white p-2 text-lg">Summary</h2>
            <div className="flex w-full py-2 text-lg border-b">
              <p>Total Qty :</p>
              <p className="ml-auto w-32 font-bold">{totalQty}</p>
            </div>
            <div className="flex w-full py-2 text-lg border-b">
              <p>Total Price</p>
              <p className="ml-auto w-32 font-bold">
                <span className="text-red-500">₹</span> {totalPrice}
              </p>
            </div>

            {/* Address Input */}
            <div className="mt-4">
              <label htmlFor="address" className="font-semibold">
                Delivery Address:
              </label>
              <textarea
                id="address"
                className="w-full border p-2 rounded mt-2"
                rows={3}
                placeholder="Enter your full delivery address here"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <button
              className="bg-red-500 w-full text-lg font-bold py-2 text-white mt-4"
              onClick={handlePayment}
            >
              Payment
            </button>
          </div>
        </div>
      ) : (
        <div className="flex w-full justify-center items-center flex-col">
          <img src={emptyCartImage} className="w-full max-w-sm" alt="Empty" />
          <p className="text-slate-500 text-3xl font-bold">Empty Cart</p>
        </div>
      )}
    </div>
  );
};

export default Cart;
