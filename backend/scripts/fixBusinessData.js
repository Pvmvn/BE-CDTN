import "dotenv/config";
import mongoose from "mongoose";

const dryRun = process.argv.includes("--dry-run");

const productUpdates = {
  "690a0853192fca081b0dd25e": { price: 69000 },
  "690a08bb192fca081b0dd263": { price: 59000 },
  "690a1143e979d345092b46f4": { price: 65000 },
  "690a1188e979d345092b46fb": { price: 65000 },
  "690a11e7e979d345092b4700": { price: 69000 },
  "690a1272e979d345092b4705": { price: 49000 },
  "690a12a1e979d345092b470e": { price: 55000 },
  "690a13a1b837028f2d9dd6fa": { price: 49000 },
  "690a13beb837028f2d9dd6ff": { price: 29000 },
  "690a13dab837028f2d9dd704": { price: 49000 },
  "690a13f0b837028f2d9dd709": { price: 39000 },
  "690a1419b837028f2d9dd70e": { price: 35000 },
  "690a148ab837028f2d9dd713": { price: 59000 },
  "690a14b6b837028f2d9dd718": { price: 55000 },
  "690a14e2b837028f2d9dd71d": { price: 49000 },
  "690a14f9b837028f2d9dd722": { price: 59000 },
  "690a1543b837028f2d9dd727": { price: 69000 },
  "690a1559b837028f2d9dd72c": { price: 55000 },
  "690a1570b837028f2d9dd731": { price: 45000 },
  "690a15a7b837028f2d9dd736": { price: 49000 },
  "690a15bdb837028f2d9dd73b": { price: 55000 },
  "690a15d3b837028f2d9dd740": { price: 49000 },
  "690a165bb837028f2d9dd747": { price: 59000, discount: 10 },
  "690a167eb837028f2d9dd74c": { price: 65000 },
  "690a1695b837028f2d9dd751": { price: 59000 },
  "690a16dab837028f2d9dd758": { price: 45000 },
  "690a16eeb837028f2d9dd75d": { price: 39000 },
  "690a1708b837028f2d9dd762": { price: 39000 },
  "690a1720b837028f2d9dd767": { price: 39000 },
  "690a1743b837028f2d9dd76c": { price: 45000 },
  "690a1791b837028f2d9dd773": { price: 45000 },
  "690a17bab837028f2d9dd778": { price: 35000 },
  "690a17dcb837028f2d9dd77d": { price: 39000 },
  "690a17efb837028f2d9dd782": { price: 35000 },
  "690a1804b837028f2d9dd787": { price: 42000 },
  "690a181eb837028f2d9dd78c": { price: 32000 },
  "690a188fb837028f2d9dd7a6": { price: 49000 },
  "690a18b1b837028f2d9dd7ab": { price: 55000 },
  "690a18c5b837028f2d9dd7b0": { price: 49000 },
  "690a43d8c6a58787e0a30b2a": { price: 55000 },
  "690a43f2c6a58787e0a30b2f": { price: 55000 },
  "690a4421c6a58787e0a30b35": { price: 59000 },
  "690a4469c6a58787e0a30b3a": { price: 49000 },
  "690a4481c6a58787e0a30b3f": { price: 45000 },
  "690a44f6c6a58787e0a30b68": { price: 45000 },
  "690a456ac6a58787e0a30b6f": { price: 59000 },
  "690a458dc6a58787e0a30b74": { price: 59000 },
  "690a4654c6a58787e0a30bbf": { price: 55000 },
  "693a519b954726cf3f61da36": { price: 35000 },
  "693a51c5954726cf3f61da3b": { price: 45000 },
  "6a07f98bf88846c5db598dc5": { price: 45000 },
};

const ingredientUnitPrices = {
  "6940f9f8b148bbdc48371af5": 8000,
  "693bacd2371bc3f183ad4f8b": 280,
  "693dfa2aad6ced180410304b": 1200,
  "69425b11f0656fa391a24585": 350,
  "6940f9f6b148bbdc48371a96": 350,
  "6940f9f7b148bbdc48371a9f": 1200,
  "6940f9f7b148bbdc48371a99": 400,
  "693dfa4aad6ced180410305a": 15000,
  "6940f9f8b148bbdc48371ada": 15000,
  "6940f9f7b148bbdc48371aa3": 32,
  "6940f9f6b148bbdc48371a93": 150,
  "6940f9f7b148bbdc48371aa6": 140,
  "6943c2e449fce35ba44370ff": 13000,
  "6940f9f7b148bbdc48371aac": 250,
  "6940f9f8b148bbdc48371ae0": 12000,
  "6940f9f7b148bbdc48371ac1": 200,
  "6940f9f7b148bbdc48371abe": 200,
  "6940f9f7b148bbdc48371a9c": 180,
  "693dfa1ead6ced1804103048": 40,
  "693cc2f5aa7d19267496a278": 180,
  "6940f9f8b148bbdc48371af2": 15000,
  "6940f9f8b148bbdc48371ae9": 350,
  "6940f9f7b148bbdc48371aa9": 65,
  "6940f9f8b148bbdc48371ad0": 200,
  "6940f9f7b148bbdc48371ab8": 190,
  "693dfd67ad6ced1804103084": 50,
  "693cc2faaa7d19267496a27b": 20,
  "6940f9f7b148bbdc48371ab5": 180,
  "6940f9f7b148bbdc48371ac7": 250,
  "693dfac3ad6ced1804103060": 2500,
  "6940f9f7b148bbdc48371abb": 220,
  "6940f9f8b148bbdc48371aec": 4000,
  "6940f9f7b148bbdc48371aaf": 20,
  "6940f9f7b148bbdc48371ab2": 80,
  "6940f9f8b148bbdc48371acd": 40,
  "6940f9f8b148bbdc48371ae6": 180,
  "6940f9f7b148bbdc48371ac4": 150,
  "6940f9f8b148bbdc48371aca": 50,
  "6940f9f8b148bbdc48371ad3": 120,
  "693dfb92ad6ced180410306e": 10000,
  "693dfb56ad6ced180410306b": 20000,
  "693dfc50ad6ced180410307b": 20000,
  "6940f9f8b148bbdc48371ad7": 1000,
  "6940f9f8b148bbdc48371add": 2000,
  "693dfc19ad6ced1804103072": 20000,
  "6940f9f8b148bbdc48371aef": 80,
  "69f98e79267c4c1559e0d7c1": 240,
  "6a07f9d6f88846c5db598de7": 24,
  "693dfa17ad6ced1804103045": 33.333333333333336,
  "693dfa39ad6ced180410304e": 25,
  "693dfc40ad6ced1804103078": 10000,
  "693dfc28ad6ced1804103075": 5800,
  "693dfac8ad6ced1804103063": 100,
  "693dfc6aad6ced180410307e": 25,
  "693dfaa8ad6ced180410305d": 40,
  "693dfc70ad6ced1804103081": 2,
};

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const objectId = (id) => new mongoose.Types.ObjectId(id);

const summarizeIngredientValue = async (db) => {
  const rows = await db
    .collection("ingredients")
    .aggregate([{ $group: { _id: null, inventoryValue: { $sum: "$totalCost" } } }])
    .toArray();
  return Math.round(rows[0]?.inventoryValue || 0);
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI. Create backend/.env before running this script.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const products = await db
    .collection("products")
    .find({ _id: { $in: Object.keys(productUpdates).map(objectId) } })
    .project({ price: 1, discount: 1 })
    .toArray();

  const ingredients = await db
    .collection("ingredients")
    .find({ _id: { $in: Object.keys(ingredientUnitPrices).map(objectId) } })
    .project({ name: 1, quantity: 1, lastPrice: 1, totalCost: 1 })
    .toArray();

  const beforeInventoryValue = await summarizeIngredientValue(db);
  const ingredientChanges = ingredients.map((ingredient) => {
    const unitPrice = ingredientUnitPrices[String(ingredient._id)];
    const totalCost = roundMoney(Number(ingredient.quantity || 0) * unitPrice);
    return {
      name: ingredient.name,
      oldLastPrice: ingredient.lastPrice,
      oldTotalCost: ingredient.totalCost,
      newLastPrice: unitPrice,
      newTotalCost: totalCost,
    };
  });

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "write",
        matchedProducts: products.length,
        matchedIngredients: ingredients.length,
        beforeInventoryValue,
        estimatedAfterInventoryValue: Math.round(
          ingredientChanges.reduce((sum, item) => sum + item.newTotalCost, 0)
        ),
        largestIngredientCuts: ingredientChanges
          .map((item) => ({
            name: item.name,
            diff: roundMoney(item.newTotalCost - Number(item.oldTotalCost || 0)),
          }))
          .filter((item) => item.diff < 0)
          .sort((a, b) => a.diff - b.diff)
          .slice(0, 10),
      },
      null,
      2
    )
  );

  if (dryRun) {
    await mongoose.disconnect();
    return;
  }

  if (products.length > 0) {
    await db.collection("products").bulkWrite(
      products.map((product) => ({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: productUpdates[String(product._id)] },
        },
      }))
    );
  }

  if (ingredients.length > 0) {
    await db.collection("ingredients").bulkWrite(
      ingredients.map((ingredient) => {
        const unitPrice = ingredientUnitPrices[String(ingredient._id)];
        return {
          updateOne: {
            filter: { _id: ingredient._id },
            update: {
              $set: {
                lastPrice: unitPrice,
                totalCost: roundMoney(Number(ingredient.quantity || 0) * unitPrice),
              },
            },
          },
        };
      })
    );
  }

  const afterInventoryValue = await summarizeIngredientValue(db);
  console.log(
    JSON.stringify(
      {
        done: true,
        afterInventoryValue,
        reducedBy: beforeInventoryValue - afterInventoryValue,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
