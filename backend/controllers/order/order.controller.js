import mongoose from "mongoose";
import Order from "../../model/order.model.js";
import Product from "../../model/product.model.js";
import Recipe from "../../model/recipe.model.js";
import Ingredient from "../../model/ingredient.model.js";
import Voucher from "../../model/voucher.model.js";
import Reservation from "../../model/reservation.model.js";
import {
  consumeIngredientStock,
  restoreOrderIngredientUsages,
} from "../../utils/inventoryCost.js";

const MAX_TABLES = 24;

const getProcessingOfflineTableCount = async ({ excludeOrderId = null, session = null } = {}) => {
  const match = {
    orderType: "OFFLINE",
    status: "PROCESSING",
  };

  if (excludeOrderId) {
    match._id = { $ne: new mongoose.Types.ObjectId(excludeOrderId) };
  }

  const rows = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ["$tableCount", 1] } },
      },
    },
  ]).session(session);

  return rows[0]?.total || 0;
};

const getCurrentSlotReservationTableCount = async ({ session = null } = {}) => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const slotMinute = now.getMinutes() < 30 ? "00" : "30";
  const currentSlot = `${now.getHours().toString().padStart(2, "0")}:${slotMinute}`;
  const rows = await Reservation.aggregate([
    {
      $match: {
        date: today,
        time: currentSlot,
        status: { $ne: "CANCELLED" },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ["$tableCount", "$people"] } },
      },
    },
  ]).session(session);

  return rows[0]?.total || 0;
};

// Tạo orderOff
export const createOrderOffline = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, items, tableCount = 1, pagerNumber } = req.body;
    const requestedTables = Number(tableCount);
    const requestedPagerNumber = Number(pagerNumber);
    // VALIDATE
    if (!items || !items.length) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Danh sách món trống" });
    }

    if (!Number.isInteger(requestedPagerNumber) || requestedPagerNumber <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Thiếu số thẻ" });
    }

    if (!Number.isInteger(requestedTables) || requestedTables <= 0 || requestedTables > MAX_TABLES) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Số bàn phải từ 1 đến 24" });
    }

    const [activeOfflineTables, reservedTablesToday] = await Promise.all([
      getProcessingOfflineTableCount({ session }),
      getCurrentSlotReservationTableCount({ session }),
    ]);

    if (activeOfflineTables + reservedTablesToday + requestedTables > MAX_TABLES) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Không đủ bàn trống để tạo đơn tại quán",
      });
    }

    const existingPagerOrder = await Order.findOne({
      orderType: "OFFLINE",
      pagerStatus: "HOLDING",
      pagerNumber: requestedPagerNumber,
    }).session(session);

    if (existingPagerOrder) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Số thẻ đang được sử dụng" });
    }

    // BƯỚC 1: TÍNH TIỀN + CHUẨN HÓA ITEMS
    let total = 0;
    const detailedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);

      if (!product || product.status === false) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Sản phẩm đã ngừng bán`,
        });
      }

      const price = product.price * (1 - product.discount / 100);
      const itemTotal = price * item.quantity;
      total += itemTotal;

      detailedItems.push({
        productId: product._id,
        name: product.name,
        price,
        quantity: item.quantity,
        note: item.note || "",
      });
    }

    total = Math.round(total);

    // BƯỚC 2: TRỪ KHO THEO CÔNG THỨC
    for (const item of detailedItems) {
      const recipe = await Recipe.findOne({
        productId: item.productId,
      }).session(session);

      if (!recipe) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Sản phẩm "${item.name}" chưa có công thức`,
        });
      }

      item.ingredientUsages = [];

      for (const r of recipe.items) {
        const requiredAmount = r.quantity * item.quantity;

        const usage = await consumeIngredientStock({
          ingredientId: r.ingredientId,
          quantity: requiredAmount,
          session,
        });

        if (!usage) {
          await session.abortTransaction();
          return res.status(400).json({
            message: "Kho không đủ nguyên liệu",
          });
        }
        item.ingredientUsages.push(usage);
      }
    }

    // BƯỚC 3: TẠO ORDER OFFLINE
    const newOrder = new Order({
      userId,
      items: detailedItems,
      totalPrice: total,
      orderType: "OFFLINE",
      paymentMethod: "CASH",
      paymentStatus: "SUCCESS",
      status: "PROCESSING",
      pagerNumber: requestedPagerNumber,
      pagerStatus: "HOLDING",
      pagerReturnedAt: null,
      tableCount: requestedTables,
    });

    await newOrder.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      message: `Tạo đơn offline thành công - thẻ số ${requestedPagerNumber}`,
      order: newOrder,
    });
  } catch (err) {
    await session.abortTransaction();
    if (err?.code === 11000 && err?.keyPattern?.pagerNumber) {
      return res.status(400).json({
        message: `The so ${req.body?.pagerNumber} dang duoc su dung`,
      });
    }
    console.error("CREATE OFFLINE ORDER ERROR:", err);
    res.status(500).json({
      message: "Tạo đơn offline thất bại",
      error: err.message,
    });
  } finally {
    session.endSession();
  }
};

export const updateOfflineOrderTableCount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { tableCount } = req.body;
    const requestedTables = Number(tableCount);

    if (!Number.isInteger(requestedTables) || requestedTables <= 0 || requestedTables > MAX_TABLES) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Số bàn phải từ 1 đến 24" });
    }

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.orderType !== "OFFLINE") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Chỉ cập nhật số bàn cho đơn tại quán" });
    }

    if (order.status !== "PROCESSING") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Chỉ cập nhật số bàn cho đơn đang xử lý" });
    }

    const [activeOfflineTables, reservedTablesToday] = await Promise.all([
      getProcessingOfflineTableCount({ excludeOrderId: id, session }),
      getCurrentSlotReservationTableCount({ session }),
    ]);

    if (activeOfflineTables + reservedTablesToday + requestedTables > MAX_TABLES) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Không đủ bàn trống để tăng số bàn" });
    }

    order.tableCount = requestedTables;
    await order.save({ session });
    await session.commitTransaction();

    const updatedOrder = await Order.findById(id)
      .populate("userId", "name email role")
      .populate("voucherId", "code");

    res.json(updatedOrder);
  } catch (err) {
    await session.abortTransaction();
    console.error("UPDATE OFFLINE TABLE COUNT ERROR:", err);
    res.status(500).json({ message: "Cập nhật số bàn thất bại", error: err.message });
  } finally {
    session.endSession();
  }
};

// Lấy danh sách tất cả order (cho admin) 
export const getOrders = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Tạo query filter theo ngày
    const dateFilter = {};
    
    if (startDate && endDate) {
      // Nếu có cả startDate và endDate
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateFilter.createdAt = {
        $gte: start,
        $lte: end
      };
    } else {
      // MẶC ĐỊNH: Chỉ lấy đơn hàng HÔM NAY
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      dateFilter.createdAt = {
        $gte: today,
        $lt: tomorrow
      };
    }

    // Query orders với date filter
    const orders = await Order.find(dateFilter)
      .populate("userId", "name email role")
      .populate("voucherId", "code")
      .sort({ createdAt: -1 });

    const total = orders.length;

    res.json({
      orders,
      total,
      dateRange: {
        start: startDate || new Date().toISOString().split('T')[0],
        end: endDate || new Date().toISOString().split('T')[0]
      }
    });
  } catch (err) {
    console.error("GET ORDERS ERROR:", err);
    res.status(500).json({ message: "Lấy danh sách đơn hàng thất bại" });
  }
};

// Lấy order theo id
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Cho phép:
    // - Admin/manager xem mọi đơn
    // - Customer chỉ xem được đơn của chính mình
    const user = req.user;
    if (
      user.role === "customer" &&
      order.userId &&
      order.userId.toString() !== user.id
    ) {
      return res.status(403).json({ message: "Bạn không có quyền xem đơn hàng này" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Lấy dữ liệu đơn hàng thất bại" });
  }
};

// Lấy tất cả order theo userId (cho khách hàng xem lịch sử đơn hàng)
export const getAllOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }
    const orders = await Order.find({ userId })
      .populate("voucherId", "code")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy danh sách đơn hàng" });
  }
};

// Cập nhật trạng thái order
export const completeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    if (order.status !== "PROCESSING") {
      return res.status(400).json({ 
        message: "Chỉ có thể hoàn thành đơn hàng đang ở trạng thái 'Đang xử lý'" 
      });
    }

    if (order.paymentStatus !== "SUCCESS") {
      return res.status(400).json({ 
        message: "Chỉ có thể hoàn thành đơn hàng đã thanh toán thành công" 
      });
    }
    order.status = "COMPLETED";
    // Tự động trả thẻ khi hoàn tất đơn
    if (order.pagerStatus === "HOLDING" || !order.pagerStatus) {
      order.pagerStatus = "RETURNED";
      order.pagerReturnedAt = new Date();
    }
    await order.save();
    const updatedOrder = await Order.findById(id)
      .populate("userId", "name email role")
      .populate("voucherId", "code");
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: "Xác nhận hoàn thành đơn hàng thất bại" });
    console.log(err);
  }
};

// Xác nhận thanh toán (chỉ dành cho đơn hàng tiền mặt/COD)
export const confirmPaymentOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    
    // Đã thanh toán thì không cần xác nhận lại
    if (order.paymentStatus === "SUCCESS") {
      return res.status(400).json({ message: "Đơn hàng đã được thanh toán" });
    }
    
    order.paymentStatus = "SUCCESS";
    // Có thể lưu lại thời điểm xác nhận thanh toán nếu muốn
    order.vnp_PayDate = new Date().toISOString(); 
    await order.save();
    
    const updatedOrder = await Order.findById(id)
      .populate("userId", "name email role")
      .populate("voucherId", "code");
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: "Xác nhận thanh toán thất bại" });
    console.log(err);
  }
};

// Hủy đơn hàng (Admin/Manager)
export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const order = await Order.findById(id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: "Không thể hủy đơn hàng đã hoàn tất hoặc đã hủy" 
      });
    }

    if (order.paymentMethod !== "CASH") {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Chỉ có thể hủy thủ công đơn hàng thanh toán tiền mặt",
      });
    }

    // HOÀN LẠI NGUYÊN LIỆU THEO CÔNG THỨC
    const hasIngredientUsages = order.items.some(
      (item) => item.ingredientUsages?.length
    );

    if (hasIngredientUsages) {
      await restoreOrderIngredientUsages({ order, session });
    } else {
      for (const item of order.items) {
        const recipe = await Recipe.findOne({
          productId: item.productId,
        }).session(session);

        if (recipe) {
          for (const r of recipe.items) {
            const requiredAmount = r.quantity * item.quantity;
            await Ingredient.findByIdAndUpdate(
              r.ingredientId,
              {
                $inc: { quantity: requiredAmount },
                $set: { status: true },
              },
              { session }
            );
          }
        }
      }
    }

    order.status = "CANCELLED";
    order.paymentStatus = "FAILED";
    // Tự động trả thẻ khi hủy đơn
    if (order.pagerStatus === "HOLDING" || !order.pagerStatus) {
      order.pagerStatus = "RETURNED";
      order.pagerReturnedAt = new Date();
    }

    if (order.voucherId && order.paymentMethod === "CASH") {
      await Voucher.findByIdAndUpdate(
        order.voucherId,
        { $inc: { usedCount: -1 } },
        { session }
      );
    }

    await order.save({ session });

    await session.commitTransaction();

    const updatedOrder = await Order.findById(id)
      .populate("userId", "name email role")
      .populate("voucherId", "code");
      
    res.status(200).json(updatedOrder);
  } catch (err) {
    await session.abortTransaction();
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({ message: "Hủy đơn hàng thất bại", error: err.message });
  } finally {
    session.endSession();
  }
};

// Thu hồi thẻ bàn (đồ uống đã xong, lấy lại thẻ)
export const returnPager = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.orderType !== "OFFLINE") {
      return res.status(400).json({ message: "Chỉ đơn tại quán mới có thẻ bàn" });
    }

    if (order.pagerStatus === "RETURNED") {
      return res.status(400).json({ message: "Thẻ bàn đã được thu hồi rồi" });
    }

    order.pagerStatus = "RETURNED";
    order.pagerReturnedAt = new Date();
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate("userId", "name email role")
      .populate("voucherId", "code");

    res.json(updatedOrder);
  } catch (err) {
    console.error("RETURN PAGER ERROR:", err);
    res.status(500).json({ message: "Thu hồi thẻ bàn thất bại", error: err.message });
  }
};
