import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Gift,
  Loader2,
  Mail,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import dashboardApi from "../../api/dashboardApi";
import { formatCurrencyVN } from "../../utils/formatCurrencyVN";
import { formatDatetimeVN } from "../../utils/formatDatetimeVN";

const getTodayString = () => new Date().toISOString().split("T")[0];

const statusLabels = {
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  PENDING: "Đang chờ",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  ONLINE: "Online",
  OFFLINE: "Tại quán",
};

const StatCard = ({ title, value, icon: Icon, tone = "green", hint }) => {
  const toneClass = {
    green: "bg-green-50 text-green-700 border-green-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  }[tone];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
        <div className={`p-3 rounded-lg border ${toneClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const BreakdownTable = ({ title, rows }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-200">
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <table className="w-full">
      <tbody className="divide-y divide-gray-100">
        {rows.map((row) => (
          <tr key={row.label}>
            <td className="px-4 py-3 text-sm text-gray-600">{row.label}</td>
            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getSummary({ startDate, endDate });
      setSummary(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tải dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [startDate, endDate]);

  const quickDateRanges = useMemo(
    () => [
      { key: "today", label: "Hôm nay" },
      { key: "yesterday", label: "Hôm qua" },
      { key: "week", label: "7 ngày" },
      { key: "month", label: "30 ngày" },
    ],
    []
  );

  const handleQuickDate = (type) => {
    const today = new Date();
    const todayStr = getTodayString();

    if (type === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
      return;
    }

    if (type === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
      return;
    }

    if (type === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setStartDate(weekAgo.toISOString().split("T")[0]);
      setEndDate(todayStr);
      return;
    }

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    setStartDate(monthAgo.toISOString().split("T")[0]);
    setEndDate(todayStr);
  };

  const orderStatusRows = summary
    ? [
        { label: "Đang xử lý", value: summary.breakdowns.orderStatus.PROCESSING },
        { label: "Hoàn tất", value: summary.breakdowns.orderStatus.COMPLETED },
        { label: "Đã hủy", value: summary.breakdowns.orderStatus.CANCELLED },
      ]
    : [];

  const paymentRows = summary
    ? [
        { label: "Đang chờ", value: summary.breakdowns.paymentStatus.PENDING },
        { label: "Thành công", value: summary.breakdowns.paymentStatus.SUCCESS },
        { label: "Thất bại", value: summary.breakdowns.paymentStatus.FAILED },
      ]
    : [];

  const operationRows = summary
    ? [
        { label: "Đơn online", value: summary.breakdowns.orderType.ONLINE },
        { label: "Đơn tại quán", value: summary.breakdowns.orderType.OFFLINE },
        { label: "Đặt bàn đang chờ", value: summary.breakdowns.reservations.PENDING },
        { label: "Tin nhắn chưa đọc", value: summary.totals.unreadContacts },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard thống kê</h2>
            <p className="text-gray-500 mt-1">
              Tổng quan vận hành, đơn hàng, doanh thu và cảnh báo nội bộ.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={getTodayString()}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={loadSummary}
              className="self-end inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {quickDateRanges.map((item) => (
            <button
              key={item.key}
              onClick={() => handleQuickDate(item.key)}
              className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !summary ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Đang tải thống kê...
        </div>
      ) : null}

      {summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Doanh thu đã thanh toán"
              value={formatCurrencyVN(summary.totals.revenue)}
              hint={`${summary.totals.paidOrders} đơn đã thanh toán`}
              icon={TrendingUp}
              tone="green"
            />
            <StatCard
              title="Tổng đơn hàng"
              value={summary.totals.orders}
              hint={`${summary.breakdowns.orderType.ONLINE} online, ${summary.breakdowns.orderType.OFFLINE} tại quán`}
              icon={ClipboardList}
              tone="blue"
            />
            <StatCard
              title="Đặt bàn"
              value={summary.totals.reservations}
              hint={`${summary.breakdowns.reservations.PENDING} yêu cầu đang chờ`}
              icon={CalendarClock}
              tone="violet"
            />
            <StatCard
              title="Cảnh báo kho"
              value={summary.totals.lowStockIngredients}
              hint="Nguyên liệu còn tối đa 100 đơn vị"
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              title="Người dùng"
              value={summary.totals.users}
              hint={`${summary.breakdowns.users.admin} admin, ${summary.breakdowns.users.manager} quản lý`}
              icon={Users}
              tone="slate"
            />
            <StatCard
              title="Sản phẩm"
              value={summary.totals.products}
              hint={`${summary.breakdowns.products.active} đang bán`}
              icon={Package}
              tone="green"
            />
            <StatCard
              title="Voucher hoạt động"
              value={summary.totals.activeVouchers}
              icon={Gift}
              tone="rose"
            />
            <StatCard
              title="Tin nhắn chưa đọc"
              value={summary.totals.unreadContacts}
              icon={Mail}
              tone="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <BreakdownTable title="Trạng thái đơn hàng" rows={orderStatusRows} />
            <BreakdownTable title="Trạng thái thanh toán" rows={paymentRows} />
            <BreakdownTable title="Vận hành" rows={operationRows} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-800">Sản phẩm bán chạy</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.topProducts.map((item) => (
                      <tr key={String(item._id || item.name)}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                          {formatCurrencyVN(item.revenue)}
                        </td>
                      </tr>
                    ))}
                    {summary.topProducts.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                          Chưa có dữ liệu bán hàng trong khoảng ngày này
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-gray-800">Nguyên liệu sắp hết</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nguyên liệu
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Tồn kho
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.lowStockIngredients.map((item) => (
                      <tr key={item._id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.status
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.status ? "Còn dùng" : "Ngừng dùng"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {summary.lowStockIngredients.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                          Không có nguyên liệu dưới ngưỡng cảnh báo
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Đơn hàng mới nhất</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {["Mã đơn", "Thời gian", "Loại", "Thanh toán", "Trạng thái", "Tổng tiền"].map(
                      (head) => (
                        <th
                          key={head}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          {head}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-4 py-3 text-sm font-mono">
                        #{order._id?.slice(-6)}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {formatDatetimeVN(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {statusLabels[order.orderType] || order.orderType}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {statusLabels[order.paymentStatus] || order.paymentStatus}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {statusLabels[order.status] || order.status}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {formatCurrencyVN(order.totalPrice)}
                      </td>
                    </tr>
                  ))}
                  {summary.recentOrders.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        Không có đơn hàng trong khoảng ngày này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
