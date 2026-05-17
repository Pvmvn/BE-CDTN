import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "react-modal";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { FaImage } from "react-icons/fa6";
import { IoIosRemoveCircle } from "react-icons/io";
import voucherApi from "../../../api/voucherApi";
import productCategoryApi from "../../../api/productCategoryApi";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll";
import useUpAndGetLinkImage from "../../../hooks/useUpAndGetLinkImage";

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const getCategoryIds = (voucher) =>
  voucher?.conditions?.applicableCategories?.map((category) =>
    typeof category === "string" ? category : category._id
  ) || [];

const ModalUpdateVoucher = ({
  isOpenModalUpdateVoucher,
  setIsOpenModalUpdateVoucher,
  selectedVoucher,
  setVouchers,
}) => {
  useLockBodyScroll(isOpenModalUpdateVoucher);

  const inputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(selectedVoucher?.image || "");
  const { handleImageUpload } = useUpAndGetLinkImage();

  const defaultValues = useMemo(
    () => ({
      code: selectedVoucher?.code || "",
      description: selectedVoucher?.description || "",
      discountType: selectedVoucher?.discountType || "amount",
      discountValue: selectedVoucher?.discountValue || "",
      startDate: toDateTimeLocal(selectedVoucher?.startDate),
      endDate: toDateTimeLocal(selectedVoucher?.endDate),
      usageLimit: selectedVoucher?.usageLimit || "",
      perUserLimit: selectedVoucher?.perUserLimit || "",
      minOrderValue: selectedVoucher?.conditions?.minOrderValue || 0,
      maxDiscountAmount:
        selectedVoucher?.conditions?.maxDiscountAmount != null
          ? selectedVoucher.conditions.maxDiscountAmount
          : "",
      applicableCategories: getCategoryIds(selectedVoucher),
    }),
    [selectedVoucher]
  );

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    watch,
    formState: { errors },
  } = useForm({ defaultValues });

  const discountType = watch("discountType");

  useEffect(() => {
    reset(defaultValues);
    setImagePreview(selectedVoucher?.image || "");
    setImageFile(null);
  }, [defaultValues, reset, selectedVoucher]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await productCategoryApi.getAll();
        setCategories(res);
      } catch {
        toast.error("Không tải được danh mục");
      }
    };

    if (isOpenModalUpdateVoucher) fetchCategories();
  }, [isOpenModalUpdateVoucher]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 8MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    if (isLoading) return;
    if (!imagePreview && !imageFile) {
      toast.error("Ảnh voucher bắt buộc");
      return;
    }

    try {
      setIsLoading(true);

      let image = selectedVoucher.image;
      if (imageFile) {
        const imageURLs = await handleImageUpload([imageFile]);
        if (!imageURLs[0]) {
          toast.error("Upload ảnh thất bại");
          return;
        }
        image = imageURLs[0];
      }

      const payload = {
        ...data,
        code: data.code.trim(),
        description: data.description.trim(),
        discountValue: Number(data.discountValue),
        usageLimit: Number(data.usageLimit),
        perUserLimit: Number(data.perUserLimit),
        minOrderValue: Number(data.minOrderValue),
        maxDiscountAmount:
          data.discountType === "percent" &&
          data.maxDiscountAmount != null &&
          data.maxDiscountAmount !== ""
            ? Number(data.maxDiscountAmount)
            : null,
        image,
      };

      const response = await voucherApi.updateVoucher(selectedVoucher._id, payload);
      const now = new Date();
      const start = new Date(response.startDate);
      const end = new Date(response.endDate);
      const updatedVoucher = {
        ...response,
        status:
          response.status === "inactive"
            ? "inactive"
            : now < start
            ? "upcoming"
            : now > end
            ? "expired"
            : "active",
      };

      setVouchers((prev) =>
        prev.map((voucher) =>
          voucher._id === selectedVoucher._id ? updatedVoucher : voucher
        )
      );
      toast.success("Cập nhật voucher thành công!");
      setIsOpenModalUpdateVoucher(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật voucher");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      appElement={document.getElementById("root")}
      isOpen={isOpenModalUpdateVoucher}
      onRequestClose={() => setIsOpenModalUpdateVoucher(false)}
      style={{
        overlay: {
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 50,
        },
        content: {
          top: "2rem",
          left: "auto",
          right: "auto",
          bottom: "auto",
          padding: 0,
          border: "none",
          borderRadius: "0.5rem",
          width: "100%",
          maxWidth: "700px",
        },
      }}
    >
      <div className="bg-white rounded-md w-full flex flex-col select-none">
        <div className="w-full bg-green-700 text-white py-3 px-4">
          <p className="font-bold text-lg">Cập nhật voucher</p>
        </div>

        <form
          className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <label className="font-medium">Mã voucher *</label>
            <input
              {...register("code", {
                required: "Mã voucher bắt buộc",
                minLength: {
                  value: 6,
                  message: "Mã voucher phải tối thiểu 6 ký tự",
                },
                maxLength: {
                  value: 20,
                  message: "Mã voucher tối đa 20 ký tự",
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message:
                    "Mã voucher không được chứa dấu hoặc ký tự đặc biệt",
                },
              })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Nhập mã voucher"
            />
            {errors.code && (
              <p className="text-red-500 text-sm">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="font-medium">Mô tả *</label>
            <input
              {...register("description", { required: "Mô tả bắt buộc" })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Nhập mô tả voucher"
            />
            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-medium">Loại giảm giá *</label>
              <select
                {...register("discountType", { required: true })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="amount">Tiền</option>
                <option value="percent">Phần trăm</option>
              </select>
            </div>
            <div>
              <label className="font-medium">Giá trị giảm *</label>
              <input
                type="number"
                {...register("discountValue", {
                  required: "Bắt buộc",
                  min: { value: 1, message: "Phải > 0" },
                  validate: (value) => {
                    if (discountType === "percent" && Number(value) > 100) {
                      return "Giảm phần trăm không được lớn hơn 100";
                    }
                    return true;
                  },
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.discountValue && (
                <p className="text-red-500 text-sm">
                  {errors.discountValue.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-medium">Thời gian bắt đầu *</label>
              <input
                type="datetime-local"
                {...register("startDate", {
                  required: "Thời gian bắt đầu bắt buộc",
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <label className="font-medium">Thời gian kết thúc *</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border rounded-lg"
                {...register("endDate", {
                  required: "Thời gian kết thúc bắt buộc",
                  validate: (value) => {
                    const startDate = new Date(getValues("startDate"));
                    const endDate = new Date(value);
                    if (endDate <= startDate)
                      return "Thời gian kết thúc phải lớn hơn thời gian bắt đầu";
                    return true;
                  },
                })}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="font-medium mb-1 block">Danh mục áp dụng</label>
            <Controller
              name="applicableCategories"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={categories.map((category) => ({
                    value: category._id,
                    label: category.name,
                  }))}
                  isMulti
                  placeholder="Tất cả sản phẩm"
                  className="basic-multi-select"
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                  classNamePrefix="select"
                  onChange={(selected) =>
                    field.onChange(selected.map((item) => item.value))
                  }
                  value={categories
                    .filter((category) => field.value.includes(category._id))
                    .map((category) => ({
                      value: category._id,
                      label: category.name,
                    }))}
                />
              )}
            />
          </div>

          <div>
            <label className="font-medium">Ảnh voucher *</label>
            <input
              type="file"
              ref={inputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
            <FaImage
              className="text-3xl cursor-pointer mt-2"
              onClick={() => inputRef.current.click()}
            />
            {imagePreview && (
              <div className="relative inline-block mt-2">
                <img
                  src={imagePreview}
                  alt="voucher"
                  className="w-16 h-16 object-cover rounded"
                />
                <IoIosRemoveCircle
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 cursor-pointer bg-black text-white rounded-full hover:bg-red-500 transition"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-medium">Số lượng mã *</label>
              <input
                type="number"
                {...register("usageLimit", {
                  required: "Bắt buộc",
                  min: { value: 1, message: "Phải lớn hơn 0" },
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.usageLimit && (
                <p className="text-red-500 text-sm">
                  {errors.usageLimit.message}
                </p>
              )}
            </div>

            <div>
              <label className="font-medium">Số lượt dùng / người *</label>
              <input
                type="number"
                {...register("perUserLimit", {
                  required: "Bắt buộc",
                  min: { value: 1, message: "Phải lớn hơn 0" },
                  validate: (value) => {
                    const usageLimit = Number(getValues("usageLimit"));
                    if (Number(value) > usageLimit)
                      return "Lượt người dùng phải nhỏ hơn số lượng mã";
                    return true;
                  },
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.perUserLimit && (
                <p className="text-red-500 text-sm">
                  {errors.perUserLimit.message}
                </p>
              )}
            </div>

            <div>
              <label className="font-medium">Giá trị đơn tối thiểu *</label>
              <input
                type="number"
                {...register("minOrderValue", {
                  required: "Bắt buộc",
                  min: {
                    value: 0,
                    message: "Giá trị đơn tối thiểu không được nhỏ hơn 0",
                  },
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.minOrderValue && (
                <p className="text-red-500 text-sm">
                  {errors.minOrderValue.message}
                </p>
              )}
            </div>
          </div>

          {discountType === "percent" && (
            <div>
              <label className="font-medium">Giá trị giảm tối đa</label>
              <input
                type="number"
                {...register("maxDiscountAmount", {
                  min: {
                    value: 1,
                    message: "Giá trị giảm tối đa phải lớn hơn 0",
                  },
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.maxDiscountAmount && (
                <p className="text-red-500 text-sm">
                  {errors.maxDiscountAmount.message}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4 mt-4">
            <button
              type="button"
              className="w-full border px-4 py-2 rounded-md cursor-pointer"
              onClick={() => setIsOpenModalUpdateVoucher(false)}
            >
              Hủy
            </button>
            <button
              className="bg-green-600 w-full text-white rounded-md px-2 py-2 cursor-pointer"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <img
                  src="/loading.gif"
                  alt="Đang tải..."
                  className="w-7 h-7 mx-auto"
                />
              ) : (
                "Cập nhật"
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ModalUpdateVoucher;
