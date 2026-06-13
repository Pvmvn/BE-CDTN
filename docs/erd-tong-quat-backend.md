# ERD tổng quát backend

Tài liệu này được tổng hợp lại từ các schema trong `backend/model`. Hệ thống dùng MongoDB với Mongoose nên các thực thể như `CART_ITEM`, `ORDER_ITEM`, `RECIPE_ITEM`, `RECEIPT_ITEM` và `VOUCHER_CATEGORY` là thực thể logic để biểu diễn mảng nhúng hoặc mảng ObjectId trong ERD, không phải collection riêng.

## 1. ERD tổng quát

```mermaid
erDiagram
  USER ||--o| CART : owns
  USER ||--o{ ORDER : creates
  USER |o--o{ IMPORT_RECEIPT : creates

  PRODUCT_CATEGORY ||--o{ PRODUCT : contains
  PRODUCT ||--o| RECIPE : has
  CART ||--o{ CART_ITEM : has
  PRODUCT ||--o{ CART_ITEM : selected_as

  ORDER ||--|{ ORDER_ITEM : has
  PRODUCT ||--o{ ORDER_ITEM : ordered_as

  RECIPE ||--|{ RECIPE_ITEM : has
  INGREDIENT ||--o{ RECIPE_ITEM : used_by

  IMPORT_RECEIPT ||--|{ RECEIPT_ITEM : has
  INGREDIENT ||--o{ RECEIPT_ITEM : appears_in

  VOUCHER |o--o{ ORDER : applied_to
  VOUCHER ||--o{ VOUCHER_CATEGORY : limits
  PRODUCT_CATEGORY ||--o{ VOUCHER_CATEGORY : selected_by

  BLOG_CATEGORY ||--o{ BLOG : contains

  USER {
    ObjectId _id PK
    string name
    string email
    string password
    string role
    datetime createdAt
    datetime updatedAt
  }

  PRODUCT_CATEGORY {
    ObjectId _id PK
    string name
    string slug
    string image
    datetime createdAt
    datetime updatedAt
  }

  PRODUCT {
    ObjectId _id PK
    ObjectId productCategoryId FK
    string name
    string description
    number price
    string image
    boolean status
    number discount
    datetime createdAt
    datetime updatedAt
  }

  INGREDIENT {
    ObjectId _id PK
    string name
    string unit
    number quantity
    number lastPrice
    number totalCost
    boolean status
    datetime createdAt
    datetime updatedAt
  }

  RECIPE {
    ObjectId _id PK
    ObjectId productId FK
    array items
    datetime createdAt
    datetime updatedAt
  }

  RECIPE_ITEM {
    ObjectId recipeId FK
    ObjectId ingredientId FK
    number quantity
    string unit
  }

  CART {
    ObjectId _id PK
    ObjectId userId FK
    array items
    datetime createdAt
    datetime updatedAt
  }

  CART_ITEM {
    ObjectId cartId FK
    ObjectId productId FK
    number quantity
    string note
  }

  ORDER {
    ObjectId _id PK
    ObjectId userId FK
    ObjectId voucherId FK
    number pagerNumber
    number tableCount
    number voucherDiscount
    array items
    number totalPrice
    object delivery
    string orderType
    string paymentMethod
    string paymentStatus
    string vnp_TxnRef
    string vnp_TransactionNo
    string vnp_PayDate
    number vnp_Amount
    string status
    datetime createdAt
    datetime updatedAt
  }

  ORDER_ITEM {
    ObjectId orderId FK
    ObjectId productId FK
    string name
    number quantity
    number price
    string note
  }

  IMPORT_RECEIPT {
    ObjectId _id PK
    ObjectId createdBy FK
    array items
    string note
    string type
    datetime createdAt
    datetime updatedAt
  }

  RECEIPT_ITEM {
    ObjectId receiptId FK
    ObjectId ingredientId FK
    string ingredientName
    string unit
    number quantity
    number pricePerUnit
    number totalCost
  }

  VOUCHER {
    ObjectId _id PK
    string code
    string description
    string discountType
    number discountValue
    datetime startDate
    datetime endDate
    number usageLimit
    number usedCount
    number perUserLimit
    string image
    object conditions
    string status
    datetime createdAt
    datetime updatedAt
  }

  VOUCHER_CATEGORY {
    ObjectId voucherId FK
    ObjectId productCategoryId FK
  }

  BLOG_CATEGORY {
    ObjectId _id PK
    string name
    string slug
    datetime createdAt
    datetime updatedAt
  }

  BLOG {
    ObjectId _id PK
    ObjectId categoryId FK
    string title
    string slug
    array images
    object content
    datetime createdAt
    datetime updatedAt
  }

  CONTACT {
    ObjectId _id PK
    string name
    string email
    string phone
    string message
    string status
    datetime createdAt
    datetime updatedAt
  }

  RESERVATION {
    ObjectId _id PK
    string name
    string phone
    string email
    string date
    string time
    datetime reservationTime
    number people
    number tableCount
    number tableNumber
    string note
    string status
    datetime createdAt
    datetime updatedAt
  }
```

## 2. Collection thật trong MongoDB

Các collection thật tương ứng với model hiện tại:

- `users`
- `productcategories`
- `products`
- `ingredients`
- `recipes`
- `carts`
- `orders`
- `importreceipts`
- `vouchers`
- `blogcategories`
- `blogs`
- `contacts`
- `reservations`

## 3. Thực thể logic khi vẽ ERD

Các thực thể dưới đây không phải collection riêng, mà là dữ liệu nhúng hoặc mảng tham chiếu:

- `CART_ITEM`: nhúng trong `Cart.items`.
- `ORDER_ITEM`: nhúng trong `Order.items`.
- `RECIPE_ITEM`: nhúng trong `Recipe.items`.
- `RECEIPT_ITEM`: nhúng trong `ImportReceipt.items`.
- `VOUCHER_CATEGORY`: biểu diễn `Voucher.conditions.applicableCategories`.

Khi vẽ theo ERD logic, các thực thể nhúng được bổ sung khóa cha như `cartId`, `orderId`, `recipeId`, `receiptId`, `voucherId` để thể hiện quan hệ rõ ràng. Trong MongoDB hiện tại, các khóa cha này không lưu trong từng item vì item đã nằm bên trong document cha.

## 4. Phân tích mối quan hệ

### 4.1. Quan hệ có khóa ngoại thật trong schema

Các quan hệ dưới đây có field `ObjectId` và `ref` trong code, nên có thể vẽ như quan hệ chính trong ERD:

- `User` - `Cart`: quan hệ `1 - 0..1`. `Cart.userId` tham chiếu `User._id` và có `unique: true`, nên một user có tối đa một giỏ hàng.
- `User` - `Order`: quan hệ `1 - N`. `Order.userId` tham chiếu `User._id`, mỗi đơn thuộc một user.
- `User` - `ImportReceipt`: quan hệ `0..1 - N`. `ImportReceipt.createdBy` tham chiếu `User._id`, nhưng có thể `null`.
- `ProductCategory` - `Product`: quan hệ `1 - N`. `Product.productCategoryId` tham chiếu `ProductCategory._id`.
- `Product` - `Recipe`: quan hệ `1 - 0..1`. `Recipe.productId` tham chiếu `Product._id` và có `unique: true`, nên một sản phẩm có tối đa một công thức.
- `Voucher` - `Order`: quan hệ `1 - N` theo phía voucher, nhưng `Order.voucherId` có thể `null`, nên một đơn có thể không dùng voucher.
- `BlogCategory` - `Blog`: quan hệ `1 - N`. `Blog.categoryId` tham chiếu `BlogCategory._id`.

### 4.2. Quan hệ qua mảng nhúng

Các quan hệ dưới đây không có collection trung gian riêng. Chúng được lưu dưới dạng mảng nhúng trong MongoDB, nhưng khi vẽ ERD logic có thể tách thành thực thể con để dễ hiểu:

- `Cart` - `CartItem`: quan hệ `1 - N`. `Cart.items` là mảng nhúng.
- `CartItem` - `Product`: mỗi dòng giỏ hàng có `productId` tham chiếu `Product._id`.
- `Order` - `OrderItem`: quan hệ `1 - N`. `Order.items` là mảng nhúng.
- `OrderItem` - `Product`: mỗi dòng đơn hàng có `productId` tham chiếu `Product._id`, đồng thời lưu snapshot `name`, `price`, `quantity`.
- `Recipe` - `RecipeItem`: quan hệ `1 - N`. `Recipe.items` là mảng nhúng.
- `RecipeItem` - `Ingredient`: mỗi dòng công thức có `ingredientId` tham chiếu `Ingredient._id`.
- `ImportReceipt` - `ReceiptItem`: quan hệ `1 - N`. `ImportReceipt.items` là mảng nhúng.
- `ReceiptItem` - `Ingredient`: mỗi dòng phiếu kho có `ingredientId` tham chiếu `Ingredient._id`.
- `Voucher` - `VoucherCategory`: `Voucher.conditions.applicableCategories` là mảng `ObjectId`.
- `VoucherCategory` - `ProductCategory`: mỗi phần tử trong `applicableCategories` tham chiếu `ProductCategory._id`.

### 4.3. Các thực thể độc lập

Các collection dưới đây không có khóa ngoại trực tiếp tới collection khác trong schema hiện tại:

- `Contact`: lưu phản hồi/liên hệ khách hàng.
- `Reservation`: lưu yêu cầu đặt bàn online, không tham chiếu `User` hoặc `Order`.

## 5. Ghi chú về Reservation và Order

`Reservation` và `Order` không có khóa ngoại trực tiếp trong code, nên không nên nối bằng quan hệ FK trong ERD vật lý.

Tuy nhiên, hai collection này có quan hệ nghiệp vụ:

```txt
Reservation giữ trước số lượng bàn cho khách online theo khung giờ.
Order OFFLINE phản ánh số lượng bàn đang được sử dụng thực tế tại quán.
Tổng số bàn từ hai luồng này được dùng để kiểm soát sức chứa tối đa 24 bàn.
```

Nếu cần biểu diễn trên ERD nghiệp vụ, có thể dùng đường nét đứt hoặc ghi chú:

```txt
RESERVATION .. ORDER : cùng tác động đến số bàn khả dụng
```

## 6. Kiểu dữ liệu ID

Trong code hiện tại, các khóa chính và khóa ngoại dùng `ObjectId`:

- `_id` của các collection là `ObjectId`.
- `userId`, `productCategoryId`, `productId`, `ingredientId`, `voucherId`, `categoryId`, `createdBy` là `ObjectId`.

Các mã nghiệp vụ không phải `ObjectId`:

- `pagerNumber`: `number`.
- `tableCount`: `number`.
- `vnp_TxnRef`, `vnp_TransactionNo`, `vnp_PayDate`: `string`.
- `code`, `slug`, `email`: `string`.
