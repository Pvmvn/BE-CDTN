# Dashboard thống kê Admin

Tài liệu này mô tả chức năng dashboard thống kê nội bộ admin/staff theo code hiện tại. Các phần chính được đọc từ:

- Backend: `backend/controllers/dashboard/dashboard.controller.js`, `backend/router/dashboard.router.js`, `backend/server.js`
- Frontend: `frontend/src/page/admin/Dashboard.jsx`, `frontend/src/api/dashboardApi.js`, `frontend/src/App.jsx`, `frontend/src/layout/LayoutAdmin.jsx`

## 1. Mục tiêu chức năng

Dashboard cung cấp màn hình tổng quan cho khu vực quản trị, giúp admin/staff theo dõi nhanh tình hình vận hành trong một khoảng ngày:

- Doanh thu đã thanh toán.
- Số lượng đơn hàng.
- Trạng thái đơn hàng và thanh toán.
- Đơn online/tại quán.
- Tình hình đặt bàn.
- Tin nhắn khách hàng chưa đọc.
- Số user, sản phẩm, voucher đang hoạt động.
- Nguyên liệu tồn kho thấp.
- Sản phẩm bán chạy.
- Đơn hàng mới nhất.

## 2. Phân quyền

| Vai trò | Quyền truy cập |
|---|---|
| `admin` | Được xem dashboard. |
| `manager` | Được xem dashboard. |
| `customer` | Không được truy cập khu vực `/admin`. |

Backend bảo vệ API bằng middleware:

- `verifyToken`
- `isAdminOrStaff`

Frontend bảo vệ route `/admin` bằng `AdminGuard`.

## 3. API dashboard

### 3.1. Endpoint

```http
GET /api/dashboard/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### 3.2. Request

| Query | Bắt buộc | Mô tả |
|---|---|---|
| `startDate` | Không | Ngày bắt đầu thống kê. Nếu không truyền, backend mặc định là hôm nay. |
| `endDate` | Không | Ngày kết thúc thống kê. Nếu không truyền, backend mặc định là ngày bắt đầu/hôm nay. |

Request cần header:

```http
Authorization: Bearer <token>
```

### 3.3. Response chính

```json
{
  "dateRange": {
    "start": "2026-05-17",
    "end": "2026-05-17"
  },
  "totals": {
    "revenue": 0,
    "paidOrders": 0,
    "orders": 0,
    "users": 0,
    "products": 0,
    "reservations": 0,
    "unreadContacts": 0,
    "activeVouchers": 0,
    "lowStockIngredients": 0
  },
  "breakdowns": {
    "orderStatus": {
      "PROCESSING": 0,
      "COMPLETED": 0,
      "CANCELLED": 0
    },
    "orderType": {
      "ONLINE": 0,
      "OFFLINE": 0
    },
    "paymentStatus": {
      "PENDING": 0,
      "SUCCESS": 0,
      "FAILED": 0
    },
    "users": {
      "customer": 0,
      "manager": 0,
      "admin": 0
    },
    "products": {
      "active": 0,
      "inactive": 0
    },
    "reservations": {
      "PENDING": 0,
      "COMPLETED": 0,
      "CANCELLED": 0
    }
  },
  "lowStockIngredients": [],
  "recentOrders": [],
  "topProducts": []
}
```

## 4. Nguồn dữ liệu thống kê

| Nhóm thống kê | Collection/model | Cách tính |
|---|---|---|
| Doanh thu | `Order` | Cộng `totalPrice` của đơn có `paymentStatus = SUCCESS` và `status != CANCELLED` trong khoảng ngày. |
| Số đơn đã thanh toán | `Order` | Đếm đơn có `paymentStatus = SUCCESS` và không bị hủy. |
| Tổng đơn hàng | `Order` | Đếm đơn trong khoảng ngày. |
| Trạng thái đơn | `Order` | Group theo `status`: `PROCESSING`, `COMPLETED`, `CANCELLED`. |
| Loại đơn | `Order` | Group theo `orderType`: `ONLINE`, `OFFLINE`. |
| Trạng thái thanh toán | `Order` | Group theo `paymentStatus`: `PENDING`, `SUCCESS`, `FAILED`. |
| Người dùng | `User` | Group theo `role`: `customer`, `manager`, `admin`. |
| Sản phẩm | `Product` | Group theo `status`: `true` là đang bán, `false` là ngừng bán. |
| Đặt bàn | `Reservation` | Group theo `status` trong khoảng ngày. |
| Tin nhắn chưa đọc | `Contact` | Đếm contact có `status = new`. |
| Voucher hoạt động | `Voucher` | Đếm voucher có `status = active`. |
| Nguyên liệu tồn thấp | `Ingredient` | Lấy nguyên liệu có `quantity <= 100`, sắp xếp tăng dần. |
| Sản phẩm bán chạy | `Order.items` | Unwind `items`, group theo `items.productId`, tính tổng `quantity` và doanh thu dòng món. |
| Đơn mới nhất | `Order` | Lấy 8 đơn mới nhất trong khoảng ngày. |

## 5. Luồng xử lý backend

1. Frontend gọi `dashboardApi.getSummary({ startDate, endDate })`.
2. Backend nhận request tại `GET /api/dashboard/summary`.
3. Middleware `verifyToken` xác thực JWT.
4. Middleware `isAdminOrStaff` kiểm tra role `admin` hoặc `manager`.
5. Controller tạo khoảng ngày từ `startDate`, `endDate`.
6. Controller chạy các truy vấn độc lập bằng `Promise.all`.
7. Backend chuẩn hóa các nhóm thống kê còn thiếu về `0`.
8. Backend trả JSON tổng hợp cho frontend.

## 6. Luồng xử lý frontend

1. Route `/admin` render page `Dashboard`.
2. Page khởi tạo bộ lọc ngày mặc định là hôm nay.
3. `useEffect` gọi API dashboard khi `startDate` hoặc `endDate` thay đổi.
4. Người dùng có thể chọn nhanh:
   - Hôm nay
   - Hôm qua
   - 7 ngày
   - 30 ngày
5. Dashboard hiển thị:
   - Các thẻ chỉ số tổng quan.
   - Bảng phân rã trạng thái đơn hàng/thanh toán/vận hành.
   - Bảng sản phẩm bán chạy.
   - Bảng nguyên liệu sắp hết.
   - Bảng đơn hàng mới nhất.

## 7. File đã thêm/cập nhật

| File | Nội dung |
|---|---|
| `backend/controllers/dashboard/dashboard.controller.js` | Controller tổng hợp số liệu dashboard. |
| `backend/router/dashboard.router.js` | Router `/api/dashboard/summary`. |
| `backend/server.js` | Mount router dashboard tại `/api/dashboard`. |
| `frontend/src/api/dashboardApi.js` | API client gọi dashboard backend. |
| `frontend/src/page/admin/Dashboard.jsx` | Giao diện dashboard admin. |
| `frontend/src/App.jsx` | Thêm route index `/admin` trỏ đến `Dashboard`. |
| `frontend/src/layout/LayoutAdmin.jsx` | Thêm menu `Dashboard`, bỏ màn hình chào mừng cũ để render `Outlet`. |

## 8. Ghi chú kỹ thuật

- Dashboard chỉ tính doanh thu từ đơn đã thanh toán thành công và không bị hủy.
- Ngưỡng cảnh báo tồn kho hiện tại là `quantity <= 100`.
- `topProducts` lấy từ `Order.items`, vì order lưu snapshot `name`, `price`, `quantity` tại thời điểm đặt hàng.
- API dashboard chỉ dùng một request tổng hợp để tránh frontend phải gọi nhiều API riêng lẻ.
- Khi build frontend, Vite có cảnh báo Node hiện tại là `20.17.0`; Vite khuyến nghị `20.19+` hoặc `22.12+`.
