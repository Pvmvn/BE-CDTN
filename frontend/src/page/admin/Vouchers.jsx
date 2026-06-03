import { useEffect, useState } from "react";
import { Plus, Search, Edit2 } from "lucide-react";
import { MdDelete, MdUpdateDisabled } from "react-icons/md";
import { toast } from "react-toastify";
import voucherApi from "../../api/voucherApi";
import { formatCurrencyVN } from "../../utils/formatCurrencyVN";
import { formatDatetimeVN } from "../../utils/formatDatetimeVN";
import ModalCreateVoucher from "../../components/modal/adminVoucher/ModalCreateVoucher";
import ModalConfirmDelete from "../../components/modal/ModalConfirmDelete";
import ModalUpdateVoucher from "../../components/modal/adminVoucher/ModalUpdateVoucher";
import { filterBySearchTerm } from "../../utils/adminSearch";

const getVoucherStatusConfig = (status) => {
  switch (status) {
    case "upcoming":
      return {
        className: "bg-blue-600",
        label: "Chua toi ngay",
        canToggle: true,
      };
    case "expired":
      return {
        className: "bg-yellow-600",
        label: "Da het han",
        canToggle: false,
      };
    case "active":
      return {
        className: "bg-green-600",
        label: "Dang hoat dong",
        canToggle: true,
      };
    default:
      return {
        className: "bg-red-600",
        label: "Vo hieu hoa",
        canToggle: true,
      };
  }
};

export default function Vouchers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [vouchers, setVouchers] = useState([]);
  const [isOpenModalCreateVoucher, setIsOpenModalCreateVoucher] =
    useState(false);
  const [isOpenModalUpdateVoucher, setIsOpenModalUpdateVoucher] =
    useState(false);
  const [voucherSelected, setVoucherSelected] = useState(null);
  const [isOpenModalConfirmDelete, setIsOpenModalConfirmDelete] =
    useState(false);
  const { filteredItems: filteredVouchers } = filterBySearchTerm(
    vouchers,
    searchTerm,
    (voucher) => voucher.code
  );

  useEffect(() => {
    const getAllVouchers = async () => {
      try {
        const res = await voucherApi.getAllVouchers();
        setVouchers(res);
      } catch (error) {
        toast.error(error.response?.data?.message || "Loi khi tai voucher");
      }
    };

    getAllVouchers();
  }, []);

  useEffect(() => {
    document.title = "Quan ly voucher";
  }, []);

  const handleClickToggleVoucherStatus = async (voucher) => {
    try {
      const res = await voucherApi.toggleVoucherStatus(voucher._id);
      setVouchers((prev) =>
        prev.map((item) => (item._id === voucher._id ? { ...item, ...res } : item))
      );

      toast.success(
        res.status === "inactive"
          ? "Vo hieu hoa voucher thanh cong"
          : "Kich hoat lai voucher thanh cong"
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Loi khi cap nhat trang thai voucher"
      );
    }
  };

  const handleClickDeleteVoucher = async (voucherId) => {
    try {
      await voucherApi.deleteVoucher(voucherId);
      setVouchers((prev) => prev.filter((voucher) => voucher._id !== voucherId));
      toast.success("Xoa voucher thanh cong");
    } catch (err) {
      toast.error(err.response?.data?.message || "Loi khi xoa voucher");
    } finally {
      setIsOpenModalConfirmDelete(false);
    }
  };

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Quan ly voucher</h2>
            <p className="text-gray-600 mt-1">Danh sach voucher</p>
          </div>
          <button
            onClick={() => setIsOpenModalCreateVoucher(true)}
            className="flex items-center cursor-pointer space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Them voucher</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tim kiem ma voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[
                "STT",
                "Ma voucher",
                "Mo ta (Dieu kien)",
                "Luot / Khach",
                "Hinh anh",
                "Bat dau",
                "Gia tri",
                "Da su dung / So luong ma",
                "Tinh trang",
                "Thao tac",
              ].map((head) => (
                <th
                  key={head}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {filteredVouchers.map((voucher, index) => {
                const statusConfig = getVoucherStatusConfig(voucher.status);

                return (
                  <tr key={voucher._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm max-w-[10px]">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4 text-sm truncate max-w-[200px]">
                      {voucher.code}
                    </td>

                    <td className="px-6 py-4 text-sm max-w-[300px]">
                      {voucher.description} (don hang tu{" "}
                      {formatCurrencyVN(voucher.conditions.minOrderValue)}
                      {voucher.discountType === "percent"
                        ? `, giam ${voucher.discountValue}%${
                            voucher.conditions.maxDiscountAmount != null &&
                            voucher.conditions.maxDiscountAmount > 0
                              ? `, toi da ${formatCurrencyVN(
                                  voucher.conditions.maxDiscountAmount
                                )}`
                              : ""
                          }`
                        : `, giam ${formatCurrencyVN(voucher.discountValue)}`}
                      {voucher.conditions.applicableCategories.length > 0
                        ? `, cho don hang co tat ca san pham trong danh muc ${voucher.conditions.applicableCategories
                            .map((category) => category.name.toLowerCase())
                            .join(", ")}`
                        : ", ap dung cho tat ca san pham"}
                      )
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {voucher.perUserLimit} / account
                    </td>

                    <td className="px-6 py-4 shrink-0">
                      <img
                        src={voucher.image}
                        alt={voucher.code}
                        className="w-18 h-18 object-contain rounded-xl shrink-0"
                      />
                    </td>

                    <td className="px-6 py-4 text-sm max-w-[240px]">
                      {`${formatDatetimeVN(voucher.startDate)} den ${formatDatetimeVN(
                        voucher.endDate
                      )}`}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {voucher.discountType === "percent"
                        ? `${voucher.discountValue}% ${
                            voucher.conditions.maxDiscountAmount > 0
                              ? `(toi da ${formatCurrencyVN(
                                  voucher.conditions.maxDiscountAmount
                                )})`
                              : ""
                          }`
                        : formatCurrencyVN(voucher.discountValue)}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {voucher.usedCount}/{voucher.usageLimit}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() =>
                          statusConfig.canToggle &&
                          handleClickToggleVoucherStatus(voucher)
                        }
                        disabled={!statusConfig.canToggle}
                        title={
                          statusConfig.canToggle
                            ? "Bam de bat/tat voucher tam thoi"
                            : "Voucher het han khong the doi trang thai"
                        }
                        className={`${statusConfig.className} text-white px-4 py-2 whitespace-nowrap rounded-lg ${
                          statusConfig.canToggle
                            ? "cursor-pointer hover:opacity-90"
                            : "cursor-not-allowed opacity-80"
                        }`}
                      >
                        {statusConfig.label}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center space-x-4">
                        <button
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Sua voucher"
                          onClick={() => {
                            setVoucherSelected(voucher);
                            setIsOpenModalUpdateVoucher(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className={`text-red-600 ${
                            statusConfig.canToggle
                              ? "hover:text-red-800 cursor-pointer"
                              : "cursor-not-allowed opacity-50"
                          }`}
                          title={
                            statusConfig.canToggle
                              ? "Bat/tat voucher"
                              : "Voucher het han khong the doi trang thai"
                          }
                          disabled={!statusConfig.canToggle}
                          onClick={() =>
                            statusConfig.canToggle &&
                            handleClickToggleVoucherStatus(voucher)
                          }
                        >
                          <MdUpdateDisabled className="w-4 h-4" />
                        </button>
                        <button
                          className="text-yellow-600 cursor-pointer"
                          title="Xoa voucher"
                          onClick={() => {
                            setVoucherSelected(voucher);
                            setIsOpenModalConfirmDelete(true);
                          }}
                        >
                          <MdDelete className="text-xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {isOpenModalCreateVoucher && (
        <ModalCreateVoucher
          isOpenModalCreateVoucher={isOpenModalCreateVoucher}
          setIsOpenModalCreateVoucher={setIsOpenModalCreateVoucher}
          setVouchers={setVouchers}
        />
      )}

      {isOpenModalUpdateVoucher && voucherSelected && (
        <ModalUpdateVoucher
          isOpenModalUpdateVoucher={isOpenModalUpdateVoucher}
          setIsOpenModalUpdateVoucher={setIsOpenModalUpdateVoucher}
          selectedVoucher={voucherSelected}
          setVouchers={setVouchers}
        />
      )}

      {isOpenModalConfirmDelete && voucherSelected && (
        <ModalConfirmDelete
          isOpenConfirmDelete={isOpenModalConfirmDelete}
          setIsOpenConfirmDelete={setIsOpenModalConfirmDelete}
          content={`Ban co chac chan muon xoa voucher ${voucherSelected.code}`}
          onConfirm={() => handleClickDeleteVoucher(voucherSelected._id)}
        />
      )}
    </div>
  );
}
