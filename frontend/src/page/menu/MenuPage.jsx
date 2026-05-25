import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Bot, X, AlertCircle } from "lucide-react";
import productApi from "../../api/productApi";
import productCategoryApi from "../../api/productCategoryApi";
import { useParams } from "react-router-dom";
import { formatCurrencyVN } from "../../utils/formatCurrencyVN.js";
import { Link } from "react-router-dom";
import ModalDetailProduct from "../../components/modal/customerProduct/ModalDetailProduct.jsx";
import voucherApi from "../../api/voucherApi.js";
import CouponItem from "../../components/CouponItem.jsx";
import aiApi from "../../api/aiApi.js";
import useAuthStore from "../../store/authStore.js";
const MenuPage = () => {
  const [products, setProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const { categorySlug } = useParams();
  const [productDetail, setProductDetail] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Bạn muốn uống vị nào hôm nay? Tôi có thể gợi ý món ít ngọt, nhiều cà phê, món đang giảm giá hoặc món hợp lịch sử đặt hàng của bạn.",
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { user } = useAuthStore();
  const [isOpenModalDetailProduct, setIsOpenModalDetailProduct] =
    useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  useEffect(() => {
      document.title = `Tất cả sản phẩm`;
  }, []);
  // lấy 10 sản phẩm random
  useEffect(() => {
    const getLimitProducts = async () => {
      try {
        const data = await productApi.getLimitedProducts();
        setProducts(data);
      } catch (error) {
        toast.error(error.response.data.message);
      }
    };
    getLimitProducts();
  }, []);
  // lấy danh mục sản phẩm
  useEffect(() => {
    const getCategoryProduct = async () => {
      try {
        const data = await productCategoryApi.getAll();
        setProductCategories(data);
      } catch (error) {
        toast.error(error.response.data.message);
      }
    };
    getCategoryProduct();
  }, []);
  useEffect(() => {
    const getProductByCategory = async () => {
      try {
        const data = await productApi.getByCategory(categorySlug);
        setProducts(data);
      } catch (error) {
        toast.error(error.response.data.message);
      }
    };
    if (categorySlug) {
      getProductByCategory();
    }
  }, [categorySlug]);
  useEffect(() => {
    const getAvailableVouchers = async() => {
      try {
        const data = await voucherApi.getAvailableVouchers();
        setVouchers(data);
      } catch (error) {
        toast.error(error.response.data.message);
      }
    }
    getAvailableVouchers();
  }, []);

  useEffect(() => {
    const getRecommendations = async () => {
      if (!user) {
        setRecommendations([]);
        return;
      }

      try {
        setIsLoadingRecommendations(true);
        const data = await aiApi.recommendProducts();
        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.warn(
          error.response?.data?.message || "Khong the lay goi y mon bang AI"
        );
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    getRecommendations();
  }, [user]);

  const openProductDetail = (product) => {
    if (product.status) {
      setProductDetail(product);
      setIsOpenModalDetailProduct(true);
    }
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    const message = chatInput.trim();

    if (!message || isChatLoading) return;

    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: message }]);

    try {
      setIsChatLoading(true);
      const data = await aiApi.chat(message);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Tôi chưa có câu trả lời phù hợp, bạn thử hỏi theo khẩu vị hoặc mức giá nhé.",
        },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error.response?.data?.message || "Hiện tôi chưa kết nối được AI, bạn thử lại sau nhé.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="mx-auto px-20 max-sm:px-4 pt-24 w-full bg-gradient-to-b bg-amber-100 to-white">
      
      {vouchers.length > 0 && !isVoucherOpen && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setIsVoucherOpen(true)}
            className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-red-700 animate-bounce"
          >
            <AlertCircle className="w-6 h-6" />
            Có mã giảm giá dành cho bạn!
          </button>
        </div>
      )}

      {vouchers.length > 0 && isVoucherOpen && (
        <div className="mt-10 flex w-full justify-center">
          <div className="relative rounded-2xl border border-red-100 bg-red-50 p-6 shadow-xl w-fit max-w-full">
            <button
              onClick={() => setIsVoucherOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="mb-6 flex items-center justify-center gap-2 px-8 text-2xl font-bold text-red-600">
              <AlertCircle className="w-6 h-6" /> Ưu đãi hôm nay
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {vouchers.map((voucher) => (
                <CouponItem key={voucher._id} voucher={voucher} />
              ))}
            </div>
          </div>
        </div>
      )}
      {user && !isChatOpen && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-orange-600"
          >
            <Bot className="w-6 h-6" />
            Mở trợ lý tư vấn AI
          </button>
        </div>
      )}
      {user && isChatOpen && (
        <section className="mt-10 bg-white/90 border border-orange-100 shadow-xl rounded-2xl overflow-hidden relative">
          <button
            onClick={() => setIsChatOpen(false)}
            className="absolute right-4 top-4 p-2 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full z-10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-orange-100">
              <div className="mb-4">
                {/* <p className="text-sm font-semibold text-orange-600">AI Gemini</p> */}
                <h2 className="text-2xl font-bold">Trợ lý tư vấn món</h2>
              </div>

              <div className="h-72 overflow-y-auto rounded-xl bg-amber-50/70 p-4 space-y-3">
                {chatMessages.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        item.role === "user"
                          ? "bg-orange-500 text-white rounded-br-sm"
                          : "bg-white text-gray-700 shadow rounded-bl-sm"
                      }`}
                    >
                      {item.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-500 shadow rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                      AI đang trả lời...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="mt-4 flex gap-3">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ví dụ: Tôi muốn món cà phê ít ngọt"
                  className="flex-1 rounded-xl border border-orange-200 bg-white px-4 py-3 outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Gửi
                </button>
              </form>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-sm font-semibold text-orange-600">Bạn có thể hỏi</p>
              <div className="mt-4 grid gap-3">
                {[
                  "Tôi thích cà phê ít ngọt, nên uống món nào?",
                  "Món nào hợp để uống buổi sáng?",
                  "Có món nào đang giảm giá không?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="text-left rounded-xl bg-amber-50 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50"
                    onClick={() => setChatInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      {user && (isLoadingRecommendations || recommendations.length > 0) && (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              {/* <p className="text-sm font-semibold text-orange-600">AI Gemini</p> */}
              <h2 className="text-2xl font-bold">Gợi ý dành cho bạn</h2>
            </div>
            {isLoadingRecommendations && (
              <span className="text-sm text-gray-500">Đang phân tích...</span>
            )}
          </div>

          {recommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {recommendations.map(({ product, reason }) => (
                <button
                  key={product._id}
                  type="button"
                  className="text-left bg-white rounded-xl shadow-lg p-5 hover:-translate-y-1 transition-transform"
                  onClick={() => openProductDetail(product)}
                >
                  <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-amber-50">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="font-bold truncate">{product.name}</p>
                    <p className="text-red-500 font-bold">
                      {formatCurrencyVN(
                        product.discount > 0
                          ? product.price * (1 - product.discount / 100)
                          : product.price
                      )}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-3">{reason}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      <h1 className="text-2xl font-bold text-center mt-10">Sản phẩm từ THREESTAR</h1>
      <div className="flex flex-col justify-center items-center mt-10 gap-y-20 max-sm:gap-y-10">
        <div className="flex justify-start gap-x-10 gap-y-4 overflow-x-auto w-full py-2 px-2 md:justify-center max-w-4xl md:flex-wrap">
          {productCategories.map((category) => (
            <Link key={category._id} to={`/menu/${category.slug}`}>
              <div className="flex-shrink-0 text-center space-y-2 w-24">
                <div
                  className={`flex justify-center items-center px-4 py-4 rounded-2xl cursor-pointer ${
                    category.name === categorySlug
                      ? "bg-yellow-500"
                      : "bg-yellow-100"
                  }`}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-20 h-20 object-cover rounded-full"
                  />
                </div>
                <p
                  className={`${
                    category.name === categorySlug
                      ? "text-orange-500"
                      : "text-gray-400"
                  } text-xs font-semibold`}
                >
                  {category.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-center flex-wrap w-full gap-x-10 mx-auto gap-y-14">
          {products &&
            products.length > 0 &&
            products.map((product) => (
              <div key={product._id} className="w-full relative flex sm:flex-col sm:max-w-[230px] max-sm:gap-x-6 gap-y-4 rounded-xl px-4 py-4 shadow-xl cursor-pointer"
               onClick={() => openProductDetail(product)}
              >
                {!product.status && (
                  <div className="absolute top-0 left-0 w-full h-full bg-black/30 rounded-xl z-10 flex items-center justify-center">
                    <p className="text-white font-bold">Hết hàng</p>
                  </div>
                )}
                <img
                  src={product.image}
                  className="w-full max-sm:w-20 max-sm:h-20 object-cover"
                  alt={product.name}
                />
                <div className="space-y-4">
                  <p className="text-lg truncate">{product.name}</p>
                  <div className="flex items-center gap-4 text-lg">
                    {product.discount > 0 && (
                      <span className="line-through text-gray-400">
                        {formatCurrencyVN(product.price)}
                      </span>
                    )}
                    <span className="text-red-500 font-bold">
                      {product.discount > 0
                        ? formatCurrencyVN(
                            product.price * (1 - product.discount / 100)
                          )
                        : formatCurrencyVN(product.price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      {isOpenModalDetailProduct && (
        <ModalDetailProduct
          isOpenModalDetailProduct={isOpenModalDetailProduct}
          setIsOpenModalDetailProduct={setIsOpenModalDetailProduct}
          productDetail={productDetail}
        />
      )}
    </div>
  );
};

export default MenuPage;
