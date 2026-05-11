# Giải thích code trong `auth.middleware.js`

File `auth.middleware.js` chứa các **middleware** (các hàm trung gian) được sử dụng để bảo vệ các tuyến đường (routes/API) của hệ thống. Chức năng chính là xác thực (Authentication) người dùng thông qua chuỗi Token và phân quyền (Authorization) dựa trên vai trò của người dùng.

## 1. Import thư viện `jsonwebtoken`
```javascript
import jwt from "jsonwebtoken";
```
* **Ý nghĩa:** Import thư viện `jsonwebtoken` để có các hàm xử lý xác thực và giải mã token (giải mã xem token này của user nào, có hợp lệ hay không).

## 2. Middleware `verifyToken` (Xác thực người dùng)
Hàm này chặn các request đến API, kiểm tra xem người dùng có truyền lên token hợp lệ hay không.
```javascript
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
```
* Lấy giá trị của header `Authentication` từ request do client gửi lên.

```javascript
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token hoặc token không hợp lệ" });
  }
```
* Kiểm tra xem header này có tồn tại không và có bắt đầu bằng chữ `"Bearer "` hay không. Đây là chuẩn thiết kế phổ biến cho JWT (Bearer Token). Nếu không hợp lệ thì từ chối ngay lập tức với HTTP Status Code 401 (Unauthorized).

```javascript
  const token = authHeader.split(" ")[1];
```
* Chuỗi header thường có dạng `"Bearer eyJhbGciOi..."`, hàm `split(" ")[1]` dùng để tách lấy phần token thực sự ở phía sau chữ Bearer.

```javascript
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // gắn thông tin user vào req để controller dùng
    next(); 
  } catch (error) {
    return res.status(401).json({ message: "Token hết hạn hoặc không hợp lệ" });
  }
};
```
* **Giải mã token:** Sử dụng `jwt.verify` để giải mã token kết hợp với khóa bí mật `process.env.JWT_SECRET`. 
* Nếu Token chính xác và chưa hết hạn, thông tin giải mã (thông tin user) sẽ được gán vào `req.user`. Các hàm phía sau (Controller) có thể dễ dàng lấy `req.user` ra để sử dụng. Sau đó gọi `next()` để cho phép request đi tiếp.
* Nếu giải mã thất bại (token sai, bị chỉnh sửa hoặc hết hạn), code nhảy vào `catch` và báo lỗi 401.

## 3. Middleware `isAdmin` (Kiểm tra quyền Admin)
Hàm này thường được đặt phía sau hàm `verifyToken` ở trên tuyến đường API. Nó kiểm tra xem người dùng này có phải là admin hay không.
```javascript
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: "Bạn không có quyền admin!" });
  }
};
```
* Dựa vào thuộc tính `role` bên trong dữ liệu `req.user` đã được hàm `verifyToken` gán trước đó, nếu role bằng `'admin'` sẽ cho phép đi tiếp bằng hàm `next()`.
* Nếu không, trả về lỗi 403 (Forbidden - Cấm truy cập).

## 4. Middleware `isAdminOrStaff` (Kiểm tra quyền Admin hoặc Quản lý)
```javascript
export const isAdminOrStaff = (req, res, next) => {
  if (req.user && ["admin", "manager"].includes(req.user.role)) {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Bạn không có quyền truy cập!" });
};
```
* Tương tự `isAdmin`, nhưng ở đây nới lỏng quyền hạn hơn. Cho phép đi tiếp nếu vai trò (`role`) của người dùng nằm trong mảng `["admin", "manager"]`. Nghĩa là cả hai vai trò này đều có thể truy cập API.
* Ngược lại, trả về lỗi 403.

---

## Tóm lược quy trình sử dụng
1. User đăng nhập thành công, Server trả về Token.
2. User mang Token đó bỏ vào Header (`Authorization: Bearer <token>`) và gửi request lên API cần bảo mật.
3. Server chạy hàm `verifyToken` để kiểm tra Token. Nếu OK, gắn info user vào `req.user`.
4. (Tuỳ chọn) Server chạy tiếp các hàm `isAdmin` hoặc `isAdminOrStaff` để xác định user có đủ quyền xem tài nguyên trên API này hay không.
5. Cuối cùng, Controller xử lý trả data về cho client!
