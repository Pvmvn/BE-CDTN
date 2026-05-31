import React from "react";
import { formatCurrencyVN } from "../utils/formatCurrencyVN";

const Card = ({ product, onClick }) => {
  if (!product) return null;

  return (
    <button
      type="button"
      className="flex flex-col gap-y-2 text-left"
      onClick={() => onClick?.(product)}
    >
      <div className="card cursor-pointer">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <p className="whitespace-break-spaces font-bold">{product.name}</p>
      <span className="text-gray-400">
        {product.discount > 0
          ? formatCurrencyVN(product.price * (1 - product.discount / 100))
          : formatCurrencyVN(product.price)}
      </span>
    </button>
  );
};

export default Card;
