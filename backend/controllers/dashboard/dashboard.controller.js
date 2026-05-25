import Order from "../../model/order.model.js";
import User from "../../model/user.model.js";
import Product from "../../model/product.model.js";
import Ingredient from "../../model/ingredient.model.js";
import Voucher from "../../model/voucher.model.js";
import Contact from "../../model/contact.model.js";
import Reservation from "../../model/reservation.model.js";
import ImportReceipt from "../../model/receipt.model.js";

const buildDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const sumField = (items, field) =>
  items.reduce((total, item) => total + Number(item[field] || 0), 0);

const lowStockStages = [
  {
    $addFields: {
      lowStockLimit: {
        $switch: {
          branches: [
            { case: { $in: ["$unit", ["g", "ml"]] }, then: 1000 },
            { case: { $eq: ["$unit", "cái"] }, then: 10 },
            { case: { $eq: ["$unit", "cÃ¡i"] }, then: 10 },
          ],
          default: 100,
        },
      },
    },
  },
  {
    $match: {
      $expr: { $lte: ["$quantity", "$lowStockLimit"] },
    },
  },
  {
    $project: {
      name: 1,
      unit: 1,
      quantity: 1,
      status: 1,
      lowStockLimit: 1,
    },
  },
  { $sort: { quantity: 1 } },
  { $limit: 8 },
];

export const getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = buildDateRange(startDate, endDate);
    const dateMatch = { createdAt: { $gte: start, $lte: end } };
    const paidOrderMatch = {
      ...dateMatch,
      paymentStatus: "SUCCESS",
      status: { $ne: "CANCELLED" },
    };

    const [
      orderStatusRows,
      orderTypeRows,
      paymentStatusRows,
      revenueRows,
      userRoleRows,
      productStatusRows,
      reservationStatusRows,
      unreadContacts,
      activeVouchers,
      lowStockIngredients,
      recentOrders,
      topProducts,
      cogsRows,
      importSpendRows,
      inventoryValueRows,
    ] = await Promise.all([
      Order.aggregate([
        { $match: dateMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: dateMatch },
        { $group: { _id: "$orderType", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: dateMatch },
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: paidOrderMatch },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalPrice" },
            paidOrders: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Product.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Reservation.aggregate([
        { $match: dateMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Contact.countDocuments({ status: "new" }),
      Voucher.countDocuments({ status: "active" }),
      Ingredient.aggregate(lowStockStages),
      Order.find(dateMatch)
        .select("totalPrice orderType paymentMethod paymentStatus status createdAt")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Order.aggregate([
        { $match: paidOrderMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            cogs: { $sum: { $sum: "$items.ingredientUsages.totalCost" } },
          },
        },
        {
          $addFields: {
            grossProfit: { $subtract: ["$revenue", "$cogs"] },
            grossMargin: {
              $cond: [
                { $gt: ["$revenue", 0] },
                {
                  $multiply: [
                    { $divide: [{ $subtract: ["$revenue", "$cogs"] }, "$revenue"] },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 8 },
      ]),
      Order.aggregate([
        { $match: paidOrderMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            cogs: { $sum: { $sum: "$items.ingredientUsages.totalCost" } },
            soldLineItems: { $sum: 1 },
            lineItemsWithCost: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      { $size: { $ifNull: ["$items.ingredientUsages", []] } },
                      0,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      ImportReceipt.aggregate([
        { $match: { ...dateMatch, type: "IMPORT" } },
        {
          $group: {
            _id: null,
            totalImportSpend: { $sum: { $sum: "$items.totalCost" } },
            importReceipts: { $sum: 1 },
          },
        },
      ]),
      Ingredient.aggregate([
        {
          $group: {
            _id: null,
            inventoryValue: { $sum: "$totalCost" },
          },
        },
      ]),
    ]);

    const orderStatus = {
      PROCESSING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    orderStatusRows.forEach((row) => {
      if (row._id) orderStatus[row._id] = row.count;
    });

    const orderType = { ONLINE: 0, OFFLINE: 0 };
    orderTypeRows.forEach((row) => {
      if (row._id) orderType[row._id] = row.count;
    });

    const paymentStatus = {
      PENDING: 0,
      SUCCESS: 0,
      FAILED: 0,
    };
    paymentStatusRows.forEach((row) => {
      if (row._id) paymentStatus[row._id] = row.count;
    });

    const users = { customer: 0, manager: 0, admin: 0 };
    userRoleRows.forEach((row) => {
      if (row._id) users[row._id] = row.count;
    });

    const products = { active: 0, inactive: 0 };
    productStatusRows.forEach((row) => {
      if (row._id === true) products.active = row.count;
      if (row._id === false) products.inactive = row.count;
    });

    const reservations = {
      PENDING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    reservationStatusRows.forEach((row) => {
      if (row._id) reservations[row._id] = row.count;
    });

    const revenueSummary = revenueRows[0] || { revenue: 0, paidOrders: 0 };
    const totalOrders = sumField(orderStatusRows, "count");
    const totalUsers = sumField(userRoleRows, "count");
    const totalProducts = sumField(productStatusRows, "count");
    const totalReservations = sumField(reservationStatusRows, "count");
    const cogsSummary = cogsRows[0] || {
      cogs: 0,
      soldLineItems: 0,
      lineItemsWithCost: 0,
    };
    const importSpendSummary = importSpendRows[0] || {
      totalImportSpend: 0,
      importReceipts: 0,
    };
    const inventoryValueSummary = inventoryValueRows[0] || {
      inventoryValue: 0,
    };
    const grossProfit = revenueSummary.revenue - cogsSummary.cogs;
    const grossMargin =
      revenueSummary.revenue > 0
        ? (grossProfit / revenueSummary.revenue) * 100
        : 0;
    const cogsCoverage =
      cogsSummary.soldLineItems > 0
        ? (cogsSummary.lineItemsWithCost / cogsSummary.soldLineItems) * 100
        : 100;

    res.json({
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
      totals: {
        revenue: revenueSummary.revenue,
        paidOrders: revenueSummary.paidOrders,
        orders: totalOrders,
        users: totalUsers,
        products: totalProducts,
        reservations: totalReservations,
        unreadContacts,
        activeVouchers,
        lowStockIngredients: lowStockIngredients.length,
        cogs: Math.round(cogsSummary.cogs),
        grossProfit: Math.round(grossProfit),
        grossMargin: Math.round(grossMargin * 10) / 10,
        cogsCoverage: Math.round(cogsCoverage * 10) / 10,
        totalImportSpend: Math.round(importSpendSummary.totalImportSpend),
        importReceipts: importSpendSummary.importReceipts,
        inventoryValue: Math.round(inventoryValueSummary.inventoryValue),
      },
      breakdowns: {
        orderStatus,
        orderType,
        paymentStatus,
        users,
        products,
        reservations,
      },
      lowStockIngredients,
      recentOrders,
      topProducts,
    });
  } catch (err) {
    console.error("GET DASHBOARD SUMMARY ERROR:", err);
    res.status(500).json({ message: "Lấy thống kê dashboard thất bại" });
  }
};
