import Modal from "react-modal";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";
import { formatCurrencyVN } from "../../utils/formatCurrencyVN";
import { TiDelete } from "react-icons/ti";

// Component ModalConditionsVoucher: Hiển thị popup chi tiết điều kiện sử dụng của một mã giảm giá (voucher)
const ModalConditionsVoucher = ({
  isOpenModalConditionsVoucher, // Trạng thái đóng/mở modal
  setIsOpenModalConditionsVoucher, // Hàm thay đổi trạng thái modal (để đóng modal)
  voucher, // Dữ liệu của voucher cần hiển thị
}) => {
  // Khóa cuộn trang nền khi modal đang mở để tăng trải nghiệm người dùng
  useLockBodyScroll(isOpenModalConditionsVoucher);

  return (
    <Modal
      appElement={document.getElementById("root")}
      isOpen={isOpenModalConditionsVoucher}
      onRequestClose={() => setIsOpenModalConditionsVoucher(false)}
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 50,
        },
        content: {
          top: "8rem",
          left: "auto",
          right: "auto",
          bottom: "auto",
          padding: 0,
          border: "none",
          background: "white",
          borderRadius: "0.5rem",
          overflow: "visible",
          width: "100%",
          maxWidth: "460px",
        },
      }}
    >
      <div className="overflow-hidden rounded-md w-full flex flex-col select-none pb-10">
        {/* Phần Header của Modal: Hiển thị tiêu đề và nút đóng (X) */}
        <div className="w-full bg-amber-500 text-white py-3 px-4 relative">
          <TiDelete className="text-3xl cursor-pointer absolute right-0 top-0"
           onClick={() => setIsOpenModalConditionsVoucher(false)}
          />
          <p className="font-bold text-xl text-center">
            NHẬP MÃ: {voucher.code}
          </p>
        </div>
        <div className="p-2 px-4 space-y-4 bg-gray-200">
          <p>Mã khuyến mãi: {voucher.code}</p>
        </div>
        {/* Phần Nội dung: Hiển thị chi tiết các điều kiện áp dụng của voucher */}
        <div className="flex flex-col px-4 mt-4">
          <p>Điều kiện:</p>
          <p>
            - Giảm{" "}
            {/* Logic hiển thị mức giảm giá: nếu là theo % thì hiển thị % và mức giảm tối đa (nếu có), ngược lại hiển thị số tiền cố định */}
            {voucher.discountType === "percent"
              ? `${voucher.discountValue}% (${
                  voucher.conditions.maxDiscountAmount &&
                  `tối đa ${formatCurrencyVN(
                    voucher.conditions.maxDiscountAmount
                  )}`
                })`
              : `${formatCurrencyVN(voucher.discountValue)}`}{" "}
            cho hóa đơn từ {formatCurrencyVN(voucher.conditions.minOrderValue)}
          </p>
          <p>
            -{" "}
            {/* Logic hiển thị danh mục áp dụng: hiển thị tên các danh mục nếu có, nếu không thì báo áp dụng cho tất cả */}
            {voucher.conditions.applicableCategories.length > 0
              ? `Áp dụng cho các sản phẩm trong danh mục ${voucher.conditions.applicableCategories.map(
                  (category, i) => {
                    if(i === 0) {
                     return category.name.toLowerCase()
                    }else {
                      return `, ${category.name.toLowerCase()}`
                    }}
                )}`
              : "Áp dụng cho tất cả sản phẩm"}
          </p>
          <p className="text-xs text-red-600 font-normal mt-2">  * Hãy đăng ký tài khoản để sử dụng mã khuyến mãi</p>
        </div>
      </div>
    </Modal>
  );
};

export default ModalConditionsVoucher;
