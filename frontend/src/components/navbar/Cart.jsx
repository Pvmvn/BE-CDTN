import React from "react";
import useCartStore from "../../store/cartStore";
import useAuthStore from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
const Cart = () => {
  const cart = useCartStore((state) => state.cart);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const countItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCartClick = () => {
    if (!user) {
      toast.error("Bạn cần phải đăng nhập để vào giỏ hàng");
      navigate(
        `/account/login?redirect=${encodeURIComponent(
          "/checkout"
        )}`
      );
      return;
    }

    if (cart.length === 0) {
      toast.warning("Giỏ hàng của bạn đang trống");
      return;
    }

    navigate("/checkout");
  };
  return (
    <button
      type="button"
      onClick={handleCartClick}
      className="border-2 border-green-700 rounded-md flex px-4 pr-10 cursor-pointer py-2 gap-x-2 items-center group"
    >
        <img src="/carts.png" className="h-5 w-5 object-cover" alt="giỏ hàng" />
        <span className="font-semibold group-hover:text-green-700">
          Giỏ hàng
        </span>
        <div className="bg-gray-200 px-2 rounded-xs">
          <span className="text-green-700">
            {countItems}
          </span>
        </div>
    </button>
  );
};

export default Cart;
