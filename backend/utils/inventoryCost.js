import Ingredient from "../model/ingredient.model.js";

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const consumeIngredientStock = async ({
  ingredientId,
  quantity,
  session,
}) => {
  const requiredQuantity = Number(quantity || 0);

  if (requiredQuantity <= 0) {
    throw new Error("So luong nguyen lieu phai lon hon 0");
  }

  const ingredient = await Ingredient.findOne({
    _id: ingredientId,
    quantity: { $gte: requiredQuantity },
    status: true,
  }).session(session);

  if (!ingredient) {
    return null;
  }

  const availableQuantity = Number(ingredient.quantity || 0);
  const availableCost = Number(ingredient.totalCost || 0);
  const averagePrice =
    availableQuantity > 0
      ? availableCost / availableQuantity
      : Number(ingredient.lastPrice || 0);
  const usedCost = roundMoney(averagePrice * requiredQuantity);

  ingredient.quantity = Math.max(0, availableQuantity - requiredQuantity);
  ingredient.totalCost =
    ingredient.quantity === 0 ? 0 : Math.max(0, roundMoney(availableCost - usedCost));

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
