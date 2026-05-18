import Order from "../../model/order.model.js";
import User from "../../model/user.model.js";
import Product from "../../model/product.model.js";
import Ingredient from "../../model/ingredient.model.js";
import Voucher from "../../model/voucher.model.js";
import Contact from "../../model/contact.model.js";
import Reservation from "../../model/reservation.model.js";

const buildDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const sumField = (items, field) =>
  items.reduce((total, item) => total + Number(item[field] || 0), 0);

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
      Ingredient.find({ quantity: { $lte: 100 } })
        .select("name unit quantity status")
        .sort({ quantity: 1 })
        .limit(8)
        .lean(),
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
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 8 },
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
