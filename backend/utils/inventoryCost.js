// utils/inventoryCost.js - File chứa các hàm tiện ích quản lý số lượng và tính toán chi phí nguyên liệu trong kho
import Ingredient from "../model/ingredient.model.js";

// Hàm hỗ trợ làm tròn số tiền (lấy 2 chữ số thập phân)
const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

/**
 * Hàm trừ số lượng nguyên liệu trong kho khi có đơn hàng mới (hoặc tiêu hao).
 * Nó cũng tính toán và cập nhật lại chi phí trung bình và tổng chi phí của nguyên liệu còn sót lại.
 */
export const consumeIngredientStock = async ({
  ingredientId,
  quantity,
  session,
}) => {
  const requiredQuantity = Number(quantity || 0);

  if (requiredQuantity <= 0) {
    throw new Error("So luong nguyen lieu phai lon hon 0");
  }

  // Tìm nguyên liệu trong kho (chỉ lấy nguyên liệu đang active và có đủ số lượng theo yêu cầu)
  const ingredient = await Ingredient.findOne({
    _id: ingredientId,
    quantity: { $gte: requiredQuantity },
    status: true,
  }).session(session);

  if (!ingredient) {
    return null; // Không đủ số lượng hoặc nguyên liệu không khả dụng
  }

  const availableQuantity = Number(ingredient.quantity || 0);
  const availableCost = Number(ingredient.totalCost || 0);
  
  // Tính giá trung bình của 1 đơn vị nguyên liệu hiện tại trong kho
  const averagePrice =
    availableQuantity > 0
      ? availableCost / availableQuantity
      : Number(ingredient.lastPrice || 0);
      
  // Chi phí nguyên liệu bị tiêu hao dựa trên số lượng yêu cầu và giá trung bình
  const usedCost = roundMoney(averagePrice * requiredQuantity);

  // Cập nhật lại số lượng và tổng chi phí nguyên liệu còn lại trong kho
  ingredient.quantity = Math.max(0, availableQuantity - requiredQuantity);
  ingredient.totalCost =
    ingredient.quantity === 0 ? 0 : Math.max(0, roundMoney(availableCost - usedCost));

  // Nếu dùng hết sạch nguyên liệu thì tự động chuyển trạng thái thành false (hết hàng)
  if (ingredient.quantity === 0) {
    ingredient.status = false;
  }

  await ingredient.save({ session });

  return {
    ingredientId: ingredient._id,
    ingredientName: ingredient.name,
    unit: ingredient.unit,
    quantity: requiredQuantity,
    pricePerUnit: roundMoney(averagePrice),
    totalCost: usedCost,
  };
};

/**
 * Hàm hoàn lại nguyên liệu vào kho (sử dụng khi hủy đơn hàng hoặc hoàn trả nguyên liệu).
 * Hàm này sẽ cộng lại số lượng và tổng chi phí vào kho tương ứng với nguyên liệu.
 */
export const restoreIngredientStock = async ({
  ingredientId,
  quantity,
  totalCost,
  session,
}) => {
  await Ingredient.findByIdAndUpdate(
    ingredientId,
    {
      $inc: {
        quantity: Number(quantity || 0),
        totalCost: roundMoney(totalCost),
      },
      $set: { status: true },
    },
    { session }
  );
};

/**
 * Hàm tiện ích để duyệt qua tất cả các nguyên liệu đã dùng trong 1 đơn hàng (order)
 * và hoàn lại toàn bộ nguyên liệu đó vào kho.
 */
export const restoreOrderIngredientUsages = async ({ order, session }) => {
  for (const item of order.items || []) {
    for (const usage of item.ingredientUsages || []) {
      await restoreIngredientStock({
        ingredientId: usage.ingredientId,
        quantity: usage.quantity,
        totalCost: usage.totalCost,
        session,
      });
    }
  }
};
