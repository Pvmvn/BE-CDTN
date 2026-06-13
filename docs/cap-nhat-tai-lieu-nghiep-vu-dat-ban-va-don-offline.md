# Cập nhật tài liệu nghiệp vụ đặt bàn và đơn offline

Tài liệu này tổng hợp nội dung cần sửa trong báo cáo theo đúng các nhóm: `mô tả nghiệp vụ`, `use case`, `đặc tả` và `ERD` sau khi nghiệp vụ đặt bàn online và đơn offline đã được đổi sang mô hình quản lý theo `số lượng bàn` trên tổng `24 bàn`.

## 1. Mô tả nghiệp vụ

### 1.1. Mô tả nghiệp vụ đặt bàn online

Nội dung cũ cần thay:

```txt
Khách hàng đặt bàn và hệ thống tự động gán bàn số 1, 2, 3... cho khách.
```

Nội dung mới nên dùng:

```txt
Khách hàng đặt số lượng bàn cần sử dụng theo ngày và khung giờ mong muốn.
Hệ thống không còn gán số bàn cụ thể cho khách đặt online.
Hệ thống kiểm tra tổng số bàn đã được giữ bởi khách online trong khung giờ đó và số bàn đang được sử dụng tại quán để đảm bảo tổng số bàn sử dụng không vượt quá 24.
```

Ý nghĩa nghiệp vụ:

- Khách online không biết mình ngồi bàn số mấy ngay lúc đặt.
- Hệ thống chỉ giữ `sức chứa` theo số lượng bàn.
- Việc bố trí bàn cụ thể sẽ do nhân viên xử lý khi khách đến quán.

### 1.2. Mô tả nghiệp vụ đơn offline tại quán

Nội dung cũ cần thay:

```txt
Nhân viên nhập số thẻ bàn để tạo đơn offline.
```

Nội dung mới nên dùng:

```txt
Nhân viên tạo đơn offline cho khách tại quán bằng cách chọn món và khai báo số bàn khách đang sử dụng.
Hệ thống tự động cấp số thẻ phục vụ còn trống cho đơn offline.
Đơn offline đang xử lý sẽ chiếm một số lượng bàn thực tế và ảnh hưởng trực tiếp đến số bàn còn trống dành cho khách đặt online.
```

Ý nghĩa nghiệp vụ:

- `tableCount` là số bàn khách đang dùng tại quán.
- `pagerNumber` là số thẻ phục vụ hoặc mã nhận diện đơn.
- `pagerNumber` không còn được hiểu là số bàn.

### 1.3. Mô tả nghiệp vụ đồng bộ online và offline

Nội dung mới nên bổ sung vào phần mô tả tổng quan:

```txt
Hệ thống quản lý sức chứa quán theo một logic thống nhất dựa trên tổng 24 bàn.
Khách đặt bàn online sẽ giữ trước một số lượng bàn trong khung giờ tương ứng.
Khách gọi món offline tại quán sẽ sử dụng một số lượng bàn thực tế.
Hai luồng này cùng làm giảm số bàn khả dụng còn lại của quán.
```

## 2. Use Case

### 2.1. Use case đặt bàn online

#### Tên use case

`Đặt bàn online theo số lượng bàn`

#### Tác nhân

- Khách hàng

#### Mô tả

Khách hàng nhập thông tin liên hệ, chọn ngày, giờ và số lượng bàn cần sử dụng. Hệ thống kiểm tra số bàn còn khả dụng trong khung giờ được chọn. Nếu đủ bàn, hệ thống tạo yêu cầu đặt bàn với trạng thái chờ xác nhận.

#### Tiền điều kiện

- Khách nhập đủ họ tên, số điện thoại, email, ngày, giờ và số bàn.
- Số bàn yêu cầu hợp lệ trong khoảng từ `1` đến `24`.
- Giờ đặt nằm trong thời gian quán cho phép nhận đặt bàn.
- Thời điểm đặt không thuộc quá khứ.

#### Hậu điều kiện thành công

- Yêu cầu đặt bàn được tạo thành công.
- Hệ thống giữ trước `tableCount` bàn trong khung giờ được chọn.
- Reservation có trạng thái `PENDING`.

#### Hậu điều kiện lỗi

- Không tạo đặt bàn nếu thiếu dữ liệu.
- Không tạo đặt bàn nếu số bàn không hợp lệ.
- Không tạo đặt bàn nếu thời gian không hợp lệ hoặc đã qua.
- Không tạo đặt bàn nếu tổng số bàn đã giữ online cộng với số bàn đang phục vụ tại quán vượt quá `24`.

### 2.2. Use case tạo đơn offline tại quán

#### Tên use case

`Tạo đơn offline và ghi nhận số bàn đang sử dụng`

#### Tác nhân

- Nhân viên
- Quản trị viên

#### Mô tả

Nhân viên chọn món cho khách tại quán, khai báo số bàn đang được sử dụng, sau đó hệ thống tự động cấp số thẻ phục vụ còn trống để tạo đơn offline. Đơn offline sau khi tạo sẽ chiếm một số lượng bàn thực tế trong tổng số bàn khả dụng của quán.

#### Tiền điều kiện

- Nhân viên đã đăng nhập.
- Có ít nhất một món trong đơn.
- Số bàn sử dụng hợp lệ từ `1` đến `24`.
- Tổng số bàn đang phục vụ tại quán cộng với số bàn đã được giữ online và số bàn của đơn mới không vượt quá `24`.

#### Hậu điều kiện thành công

- Đơn offline được tạo.
- Hệ thống tự cấp `pagerNumber` còn trống.
- Đơn được lưu với `tableCount`.
- Số bàn đang sử dụng tại quán tăng lên tương ứng.

#### Hậu điều kiện lỗi

- Không tạo đơn nếu giỏ món trống.
- Không tạo đơn nếu số bàn vượt quá giới hạn.
- Không tạo đơn nếu quán không còn đủ bàn trống.

### 2.3. Use case cập nhật số bàn của đơn offline

#### Tên use case

`Tăng hoặc giảm số bàn đang dùng của đơn offline`

#### Tác nhân

- Nhân viên
- Quản trị viên

#### Mô tả

Trong quá trình phục vụ, nếu khách dùng thêm bàn hoặc trả bớt bàn, nhân viên có thể cập nhật lại `tableCount` của đơn offline đang xử lý để số liệu số bàn còn trống được đồng bộ với thực tế.

#### Tiền điều kiện

- Đơn offline tồn tại.
- Đơn đang ở trạng thái `PROCESSING`.
- Số bàn mới vẫn hợp lệ trong khoảng từ `1` đến `24`.
- Tổng số bàn sau khi cập nhật không vượt quá `24`.

#### Hậu điều kiện thành công

- `tableCount` của đơn offline được cập nhật.
- Hệ thống tính lại số bàn đang phục vụ tại quán.
- Số bàn còn trống cho khách online được đồng bộ lại.

## 3. Đặc tả chức năng

### 3.1. Đặc tả chức năng đặt bàn online

#### Dữ liệu đầu vào

- `name`
- `phone`
- `email`
- `date`
- `time`
- `tableCount`
- `note`

#### Kiểm tra hợp lệ

- Tất cả trường bắt buộc phải có dữ liệu.
- `tableCount` phải từ `1` đến `24`.
- `reservationTime` phải tạo được từ `date` và `time`.
- `reservationTime` không được nhỏ hơn thời điểm hiện tại.
- `time` phải nằm trong giờ mở cửa cho phép nhận đặt.

#### Logic xử lý

1. Ghép `date` và `time` thành `reservationTime`.
2. Kiểm tra số bàn khách yêu cầu.
3. Lấy tất cả reservation chưa bị hủy trong cùng `date` và `time`.
4. Tính tổng số bàn đã giữ online trong khung giờ đó.
5. Lấy tổng số bàn đang được dùng bởi các đơn offline `PROCESSING`.
6. Kiểm tra:

```txt
reservedOnlineTables + activeOfflineTables + requestedTables <= 24
```

7. Nếu thỏa điều kiện thì tạo reservation mới.

#### Dữ liệu đầu ra

Reservation mới có các trường chính:

- `date`
- `time`
- `reservationTime`
- `tableCount`
- `status = PENDING`

### 3.2. Đặc tả chức năng tạo đơn offline

#### Dữ liệu đầu vào

- `userId`
- `items`
- `tableCount`

#### Kiểm tra hợp lệ

- `items` không được rỗng.
- `tableCount` phải từ `1` đến `24`.
- Sản phẩm phải còn bán.
- Sản phẩm phải có công thức.
- Nguyên liệu trong kho phải đủ.
- Tổng số bàn sau khi cộng thêm đơn mới không vượt `24`.

#### Logic xử lý

1. Kiểm tra danh sách món.
2. Kiểm tra số bàn đang sử dụng.
3. Tính số bàn offline đang phục vụ.
4. Tính số bàn online đã giữ trước trong khung giờ hiện tại.
5. Nếu đủ bàn thì tiếp tục.
6. Tự tìm `pagerNumber` còn trống nhỏ nhất.
7. Tính tiền từng món.
8. Trừ kho theo công thức.
9. Tạo đơn offline với:

```txt
orderType = OFFLINE
paymentMethod = CASH
paymentStatus = SUCCESS
status = PROCESSING
tableCount = số bàn đang dùng
pagerNumber = số thẻ được cấp tự động
```

#### Dữ liệu đầu ra

Order offline mới gồm:

- `items`
- `totalPrice`
- `tableCount`
- `pagerNumber`
- `status`

### 3.3. Đặc tả chức năng cập nhật số bàn của đơn offline

#### Dữ liệu đầu vào

- `orderId`
- `tableCount`

#### Kiểm tra hợp lệ

- Đơn phải tồn tại.
- Đơn phải là `OFFLINE`.
- Đơn phải đang `PROCESSING`.
- `tableCount` mới phải từ `1` đến `24`.
- Tổng số bàn sau cập nhật không vượt quá `24`.

#### Logic xử lý

1. Tìm đơn offline theo `orderId`.
2. Loại trừ chính đơn đang sửa khỏi tổng số bàn offline hiện tại.
3. Tính lại:

```txt
otherOfflineTables + reservedOnlineTables + newTableCount <= 24
```

4. Nếu thỏa điều kiện thì cập nhật `tableCount`.

#### Dữ liệu đầu ra

- Order offline đã được cập nhật số bàn mới.

## 4. ERD cần cập nhật

### 4.1. Reservation

Phần `Reservation` trong ERD hoặc mô tả dữ liệu cần sửa theo hướng:

```txt
RESERVATION
- _id
- name
- phone
- email
- date
- time
- reservationTime
- tableCount
- note
- status
- createdAt
- updatedAt
```

Lưu ý:

- `tableCount` là thuộc tính nghiệp vụ chính của đặt bàn online.
- `tableNumber` không còn là dữ liệu trọng tâm của flow mới.

### 4.2. Order

Phần `Order` trong ERD hoặc mô tả dữ liệu cần bổ sung:

```txt
ORDER
- _id
- userId
- pagerNumber
- tableCount
- items
- totalPrice
- orderType
- paymentMethod
- paymentStatus
- status
- createdAt
- updatedAt
```

Lưu ý:

- `pagerNumber` là số thẻ phục vụ.
- `tableCount` là số bàn đơn offline đang chiếm dụng.
- `pagerNumber` không đồng nghĩa với số bàn.

### 4.3. Quan hệ nghiệp vụ cần ghi chú thêm

Nên bổ sung ghi chú ở phần ERD hoặc mô tả quan hệ:

```txt
Reservation và Order không liên kết trực tiếp bằng khóa ngoại,
nhưng cả hai cùng tác động đến sức chứa bàn của quán.
```

Hoặc diễn đạt:

```txt
Reservation giữ trước số bàn cho khách online theo khung giờ.
Order OFFLINE phản ánh số bàn đang được sử dụng thực tế tại quán.
Tổng hai nhóm này không được vượt quá 24 bàn.
```

## 5. Các câu trong tài liệu nên thay thế

Các câu cũ nên bỏ:

- `Hệ thống tự động gán bàn số 1 đến 24 cho khách đặt online.`
- `Khách đặt bàn theo số người.`
- `Nhân viên nhập số thẻ bàn khi tạo đơn offline.`
- `pagerNumber là số bàn.`

Các câu mới nên thay:

- `Khách đặt theo số lượng bàn cần sử dụng.`
- `Hệ thống quản lý sức chứa quán theo tổng 24 bàn.`
- `Hệ thống tự cấp số thẻ phục vụ còn trống khi tạo đơn offline.`
- `Đơn offline và đặt bàn online cùng ảnh hưởng đến số bàn khả dụng của quán.`

## 6. Đoạn mô tả ngắn có thể chèn vào báo cáo

```txt
Sau khi cập nhật nghiệp vụ, chức năng đặt bàn online không còn gán số bàn cụ thể cho khách mà quản lý theo số lượng bàn yêu cầu trên tổng 24 bàn của quán. Đồng thời, đơn gọi món offline tại quán cũng lưu số lượng bàn đang sử dụng để phản ánh sức chứa thực tế. Hệ thống tự cấp số thẻ phục vụ cho đơn offline và cho phép nhân viên tăng hoặc giảm số bàn đang dùng trong quá trình phục vụ. Nhờ đó, số bàn còn trống cho khách đặt online và khách tại quán luôn được đồng bộ theo cùng một logic thống nhất.
```
