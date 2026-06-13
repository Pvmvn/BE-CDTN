import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import productApi from "../../api/productApi";
import orderApi from "../../api/orderApi";
import reservationApi from "../../api/reservationApi";
import { formatCurrencyVN } from "../../utils/formatCurrencyVN";
import { FiPlus, FiMinus, FiTrash2, FiShoppingCart } from "react-icons/fi";
import useAuthStore from "../../store/authStore";

const OfflineOrderPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [pagerNumber, setPagerNumber] = useState("");
  const [tableCount, setTableCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tableUsage, setTableUsage] = useState({
    maxTables: 24,
    offlineTableCount: 0,
    onlineReservedTableCount: 0,
    availableTableCount: 24,
  });
  const [onlineReservations, setOnlineReservations] = useState([]);
  const {user} = useAuthStore()
  // Load products
  useEffect(() => {
    loadProducts();
    loadTableUsage();
    loadOnlineReservations();
  }, []);
  useEffect(() => {
      document.title = `Gọi món`;
  }, []);
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAllProducts();
      // Chỉ lấy sản phẩm còn bán
      setProducts(data.filter((p) => p.status === true));
    } catch {
      toast.error("Lỗi khi tải danh sách món");
    } finally {
      setLoading(false);
    }
  };

  const loadTableUsage = async () => {
    try {
      const data = await reservationApi.getTableUsage();
      setTableUsage(data);
    } catch {
      // Không chặn tạo đơn nếu chỉ lỗi phần hiển thị tình trạng bàn.
    }
  };

  const getTodayString = () => new Date().toISOString().split("T")[0];

  const loadOnlineReservations = async () => {
    try {
      const today = getTodayString();
      const data = await reservationApi.getAll({ startDate: today, endDate: today });
      setOnlineReservations(
        (data.reservations || [])
          .filter((reservation) => reservation.status !== "CANCELLED")
          .sort((a, b) => String(a.time).localeCompare(String(b.time)))
      );
    } catch {
      // Không chặn tạo đơn nếu chỉ lỗi phần danh sách đặt bàn online.
    }
  };
  
  // Thêm món vào giỏ
  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.productId === product._id);
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const price = product.price * (1 - product.discount / 100);
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          price,
          quantity: 1,
          note: "",
        },
      ]);
    }
    toast.success(`Đã thêm ${product.name}`);
  };

  // Tăng số lượng
  const increaseQuantity = (productId) => {
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Giảm số lượng
  const decreaseQuantity = (productId) => {
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  // Xóa món
  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  // Update note
  const updateNote = (productId, note) => {
    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, note } : item
      )
    );
  };

  // Tính tổng
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Filter products
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tạo đơn
  const handleCreateOrder = async () => {
    const parsedPagerNumber = Number(pagerNumber);
    if (!Number.isInteger(parsedPagerNumber) || parsedPagerNumber <= 0) {
      toast.error("Thiếu số thẻ");
      return;
    }

    if (tableCount <= 0 || tableCount > 24) {
      toast.error("Số bàn phải từ 1 đến 24");
      return;
    }

    if (cart.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }

    try {
      setSubmitting(true);
      if (!user || !user.id) {
        toast.error("Vui lòng đăng nhập");
        return;
      }
      const orderData = {
        userId: user.id,
        pagerNumber: parsedPagerNumber,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          note: item.note,
        })),
        tableCount,
      };
      const result = await orderApi.createOrderOffline(orderData);
      toast.success(`Tạo đơn thành công! Số thẻ: ${result.order?.pagerNumber || "N/A"}`);
      setCart([]);
      setPagerNumber("");
      setTableCount(1);
      loadTableUsage();
      loadOnlineReservations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Tạo đơn thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-b bg-amber-50 to-white pt-10 ">
      {/* BÊN TRÁI - DANH SÁCH MÓN */}
      <div className="w-2/3 p-6 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Danh sách món
          </h2>

          {/* Search */}
          <input
            type="text"
            placeholder="Tìm kiếm món..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-2">Đang tải...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const finalPrice = product.price * (1 - product.discount / 100);
                return (
                  <div
                    key={product._id}
                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-contain rounded-md mb-3"
                    />
                    <h3 className="font-semibold text-gray-800 mb-1 truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        {product.discount > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatCurrencyVN(product.price)}
                          </span>
                        )}
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrencyVN(finalPrice)}
                        </p>
                      </div>
                      {product.discount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredProducts.length === 0 && !loading && (
            <p className="text-center text-gray-500 py-12">
              Không tìm thấy món nào
            </p>
          )}
        </div>
      </div>

      {/* BÊN PHẢI - GIỎ HÀNG & THÔNG TIN ĐƠN */}
      <div className="w-1/3 bg-white shadow-xl rounded-xs p-6 overflow-y-auto mr-6">
        <div className="flex items-center gap-2 mb-6">
          <FiShoppingCart className="text-2xl text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Giỏ hàng</h2>
        </div>

        {/* Số thẻ bàn */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số thẻ bàn <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={pagerNumber}
            onChange={(e) => setPagerNumber(e.target.value)}
            placeholder="Nhập số thẻ..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Số bàn đang dùng */}
        <div className="mb-6">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Chọn số lượng bàn <span className="text-red-500">*</span>
            </label>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTableCount((value) => Math.max(1, value - 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg cursor-pointer"
              >
                <FiMinus />
              </button>
              <input
                type="number"
                min={1}
                max={24}
                value={tableCount}
                onChange={(e) =>
                  setTableCount(Math.max(1, Math.min(24, Number(e.target.value) || 1)))
                }
                className="w-20 px-3 py-2 border rounded-lg text-center font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setTableCount((value) => Math.min(24, value + 1))}
                className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer"
              >
                <FiPlus />
              </button>
            </div>
            
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Đang phục vụ tại quán: {tableUsage.offlineTableCount || 0} bàn, còn trống sau đơn này:{" "}
            {Math.max(
              0,
              (tableUsage.maxTables || 24) -
                (tableUsage.offlineTableCount || 0) -
                (tableUsage.onlineReservedTableCount || 0) -
                tableCount
            )}{" "}
            bàn
          </p>
        </div>

        {/* Lịch đặt bàn online hôm nay */}
        <div className="mb-6 rounded-lg border border-orange-100 bg-orange-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-sm font-semibold text-orange-800">
              Đặt bàn online hôm nay
            </p>
            <span className="text-xs font-semibold text-orange-700">
              {onlineReservations.length} lịch
            </span>
          </div>
          {onlineReservations.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {onlineReservations.map((reservation) => (
                <div
                  key={reservation._id}
                  className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-xs border border-orange-100"
                >
                  <div>
                    <p className="font-bold text-gray-800">{reservation.time}</p>
                    <p className="text-gray-500 truncate max-w-[160px]">
                      {reservation.name} - {reservation.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-700">
                      {reservation.tableCount || reservation.people || 1} bàn
                    </p>
                    <p className="text-gray-500">
                      {reservation.status === "PENDING" ? "Đang chờ" : "Đã đến"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-orange-700">
              Chưa có lịch đặt bàn online trong hôm nay.
            </p>
          )}
        </div>

        {/* Danh sách món trong giỏ */}
        <div className="space-y-3 mb-6 max-h-[calc(100vh-400px)] overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FiShoppingCart className="text-6xl mx-auto mb-4" />
              <p>Giỏ hàng trống</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="border rounded-lg p-3 bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800 flex-1">
                    {item.name}
                  </h4>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decreaseQuantity(item.productId)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded cursor-pointer"
                    >
                      <FiMinus />
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increaseQuantity(item.productId)}
                      className="w-7 h-7 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded cursor-pointer"
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrencyVN(item.price * item.quantity)}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Ghi chú..."
                  value={item.note}
                  onChange={(e) => updateNote(item.productId, e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            ))
          )}
        </div>

        {/* Tổng tiền */}
        <div className="border-t-2 pt-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Số món:</span>
            <span className="font-semibold">{cart.length}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-gray-800">Tổng cộng:</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrencyVN(totalPrice)}
            </span>
          </div>
        </div>

        {/* Nút tạo đơn */}
        <button
          onClick={handleCreateOrder}
          className="w-full py-3 rounded-lg font-semibold text-white transition-colors cursor-pointer bg-orange-600"
        >
          {submitting ? "Đang tạo đơn..." : "Tạo đơn"}
        </button>
      </div>
    </div>
  );
};

export default OfflineOrderPage;
