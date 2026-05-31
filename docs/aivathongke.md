### Bảng đặc tả UseCase AI gợi ý món

| UC | AI gợi ý món |
|---|---|
| Tác nhân | Khách hàng đã đăng nhập |
| Mô tả | Khách hàng mở trang menu, hệ thống tự động lấy danh sách gợi ý món cá nhân hóa dựa trên lịch sử đặt hàng và menu đang bán. Khách hàng cũng có thể mở trợ lý AI để đặt câu hỏi về khẩu vị, mức giá, món đang giảm giá hoặc món phù hợp theo nhu cầu. |
| Tiền điều kiện | Người dùng đã đăng nhập; token hợp lệ; hệ thống có sản phẩm đang bán. |
| Hậu điều kiện thành công | Hệ thống trả về danh sách gợi ý món hoặc câu trả lời AI; khách hàng có thể mở chi tiết món được đề xuất. |
| Hậu điều kiện lỗi | Nếu token không hợp lệ hoặc AI lỗi, frontend hiển thị thông báo tương ứng; nếu Gemini hết quota, backend dùng cơ chế fallback từ dữ liệu menu và lịch sử đơn hàng. |

### Đặc tả chức năng

| Luồng | Nội dung |
|---|---|
| Luồng lấy gợi ý tự động | 1. Khách hàng đã đăng nhập mở trang Menu. |
|  | 2. Frontend tải danh sách sản phẩm, danh mục, voucher đang khả dụng. |
|  | 3. `useEffect` gọi `GET /ai/recommend-products` nếu có `user`. |
|  | 4. Backend `verifyToken` xác thực người dùng. |
|  | 5. Backend lấy tối đa 40 sản phẩm đang bán và tối đa 12 đơn hàng gần nhất chưa bị hủy của người dùng. |
|  | 6. Backend tạo prompt gửi Gemini để sinh tối đa 5 món gợi ý kèm lý do và điểm số. |
|  | 7. Nếu Gemini trả dữ liệu hợp lệ, backend ánh xạ `productId` sang sản phẩm thực tế và trả về `recommendations`. |
|  | 8. Nếu Gemini bị lỗi quota `429`, backend tạo gợi ý fallback dựa trên lịch sử mua, danh mục thường dùng, giảm giá và độ mới của sản phẩm. |
|  | 9. Frontend hiển thị khối “Gợi ý dành cho bạn”; khách hàng có thể bấm vào món để mở modal chi tiết. |
| Luồng chat với trợ lý AI | 1. Khách hàng bấm `Mở trợ lý tư vấn AI`. |
|  | 2. Frontend hiển thị khung chat với lời chào mặc định và các câu hỏi gợi ý. |
|  | 3. Khách hàng nhập câu hỏi và gửi form. |
|  | 4. Frontend gọi `POST /ai/chat` với `message`. |
|  | 5. Backend kiểm tra `message` không rỗng, lấy tối đa 40 sản phẩm đang bán và 5 đơn hàng gần nhất của người dùng. |
|  | 6. Backend dựng prompt yêu cầu AI chỉ tư vấn trong phạm vi menu THREESTAR, trả lời tiếng Việt, ngắn gọn tối đa 4 câu. |
|  | 7. Backend gọi Gemini để sinh câu trả lời. |
|  | 8. Nếu Gemini hết quota `429`, backend trả lời fallback bằng cách chọn tối đa 3 sản phẩm phù hợp theo từ khóa như `giảm`, `cà phê`, `matcha`. |
|  | 9. Frontend thêm phản hồi của AI vào danh sách `chatMessages`. |
| Luồng phụ | 1. Nếu người dùng chưa đăng nhập, frontend không hiển thị khối AI và không gọi API AI. |
|  | 2. Nếu `message` rỗng, backend trả lỗi `Vui lòng nhập nội dung cần hỏi`. |
|  | 3. Nếu chưa cấu hình `GEMINI_API_KEY`, backend trả lỗi `Chưa cấu hình GEMINI_API_KEY`. |
|  | 4. Nếu AI không phản hồi được, frontend hiển thị thông điệp lỗi trong khung chat hoặc bỏ qua phần gợi ý tự động. |



### Bảng đặc tả UseCase dashboard thống kê

| UC | Dashboard thống kê |
|---|---|
| Tác nhân | Admin, Manager |
| Mô tả | Người quản trị hoặc quản lý truy cập khu vực `/admin` để xem báo cáo tổng quan theo ngày, gồm doanh thu, giá vốn, lãi gộp, đơn hàng, đặt bàn, cảnh báo kho, người dùng, voucher, nguyên liệu sắp hết, sản phẩm bán chạy và đơn hàng mới nhất. |
| Tiền điều kiện | Người dùng đã đăng nhập; token hợp lệ; vai trò là `admin` hoặc `manager`. |
| Hậu điều kiện thành công | Dashboard hiển thị đầy đủ số liệu tổng hợp trong khoảng ngày được chọn. |
| Hậu điều kiện lỗi | Nếu không có quyền hoặc lỗi truy vấn dữ liệu, hệ thống trả lỗi và frontend hiển thị thông báo tải dashboard thất bại. |

### Đặc tả chức năng

| Luồng | Nội dung |
|---|---|
| Luồng chính | 1. Admin/manager truy cập route `/admin`; `AdminGuard` cho phép vào khu vực quản trị. |
|  | 2. Trang `Dashboard` khởi tạo `startDate` và `endDate` mặc định là hôm nay. |
|  | 3. `useEffect` gọi `GET /dashboard/summary?startDate=...&endDate=...` khi bộ lọc ngày thay đổi. |
|  | 4. Backend `verifyToken` xác thực JWT, `isAdminOrStaff` kiểm tra vai trò `admin` hoặc `manager`. |
|  | 5. Controller dựng khoảng thời gian đầu ngày - cuối ngày từ `startDate`, `endDate`. |
|  | 6. Backend dùng `Promise.all` để tổng hợp song song dữ liệu từ `Order`, `User`, `Product`, `Ingredient`, `Voucher`, `Contact`, `Reservation`, `ImportReceipt`. |
|  | 7. Backend tính các nhóm số liệu: doanh thu đã thanh toán, giá vốn, lãi gộp, biên lãi gộp, tổng đơn, trạng thái đơn/thanh toán, số user, số sản phẩm, số đặt bàn, voucher hoạt động, tin nhắn chưa đọc, giá trị tồn kho, phiếu nhập và chi phí nhập nguyên liệu. |
|  | 8. Backend tổng hợp `topProducts`, `recentOrders`, `lowStockIngredients` và trả JSON về frontend. |
|  | 9. Frontend hiển thị các thẻ thống kê, bảng breakdown, bảng sản phẩm bán chạy, bảng nguyên liệu sắp hết và bảng đơn hàng mới nhất. |
| Luồng lọc dữ liệu | 1. Người dùng chọn nhanh `Hôm nay`, `Hôm qua`, `7 ngày`, `30 ngày` hoặc tự chọn `Từ ngày` / `Đến ngày`. |
|  | 2. Frontend cập nhật `startDate`, `endDate` và gọi lại API dashboard. |
|  | 3. Nút `Tải lại` cho phép gọi lại API với bộ lọc hiện tại. |
| Luồng phụ | 1. Nếu token không hợp lệ hoặc người dùng không phải `admin/manager`, backend trả lỗi 401/403. |
|  | 2. Nếu không có dữ liệu trong kỳ, dashboard vẫn hiển thị với giá trị mặc định `0` và các bảng rỗng. |
|  | 3. Ngưỡng cảnh báo tồn kho được tính theo đơn vị: `g/ml <= 1000`, `cái <= 10`, còn lại mặc định `<= 100`. |