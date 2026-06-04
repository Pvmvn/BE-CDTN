import Order from "../../model/order.model.js";
import Product from "../../model/product.model.js";
// Tool dữ liệu cho AI: chỉ chuyên truy vấn/lọc dữ liệu món và lịch sử đơn từ hệ thống.
export const MAX_PRODUCTS_FOR_AI = 40;
export const MAX_RECOMMENDATION_ORDERS = 12;

export const normalizeVietnameseText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
export const normalizeProductText = (value = "") =>
  normalizeVietnameseText(value).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

export const getDiscountedPrice = (product) =>
  Math.round(product.price * (1 - (product.discount || 0) / 100));

// Tool 1: lấy danh sách món đang bán để AI có dữ liệu menu mới nhất.
export const getActiveProducts = async ({ limit = MAX_PRODUCTS_FOR_AI } = {}) => {
  return Product.find({ status: true })
    .populate("productCategoryId", "name")
    .sort({ discount: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

// Tool 2: lấy lịch sử đơn gần đây của user để AI gợi ý cá nhân hóa.
export const getUserOrderHistory = async ({
  userId,
  limit = MAX_RECOMMENDATION_ORDERS,
} = {}) => {
  return Order.find({ userId, status: { $ne: "CANCELLED" } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Tool 3: tìm món theo filter rõ ràng để AI chỉ kéo đúng dữ liệu đang cần.
export const searchProducts = ({
  products = [],
  message = "",
  keyword = "",
  category = "",
  excludeCategory = "",
  discountOnly = false,
  preferLightTaste = false,
  maxPrice,
  minPrice,
  useDiscountedPrice = true,
  sortBy = "discount",
  limit = 3,
} = {}) => {
  const normalizedMessage = normalizeVietnameseText(message);
  const normalizedKeyword = normalizeProductText(keyword || message || "");
  const normalizedCategory = normalizeProductText(category);
  const normalizedExcludeCategory = normalizeProductText(excludeCategory);

  let candidates = products.filter((product) => {
    const searchableText = normalizeProductText(
      `${product.name} ${product.productCategoryId?.name || ""} ${product.description || ""}`
    );
    const comparePrice = useDiscountedPrice ? getDiscountedPrice(product) : product.price;

    if (discountOnly && (product.discount || 0) <= 0) {
      return false;
    }

    if (normalizedCategory && !searchableText.includes(normalizedCategory)) {
      return false;
    }

    if (normalizedExcludeCategory && searchableText.includes(normalizedExcludeCategory)) {
      return false;
    }

    if (typeof minPrice === "number" && comparePrice < minPrice) {
      return false;
    }

    if (typeof maxPrice === "number" && comparePrice > maxPrice) {
      return false;
    }

    if (normalizedKeyword) {
      const keywordTokens = normalizedKeyword.split(" ").filter(Boolean);
      if (!keywordTokens.every((token) => searchableText.includes(token))) {
        return false;
      }
    }

    return true;
  });

  // Nếu yêu cầu "ít ngọt" thì chấm điểm mềm theo mô tả thay vì filter cứng,
  // vì dữ liệu hiện tại chưa có trường độ ngọt riêng.
  const lightTasteScore = (product) => {
    if (!preferLightTaste) return 0;
    const searchableText = normalizeProductText(
      `${product.name} ${product.productCategoryId?.name || ""} ${product.description || ""}`
    );

    let score = 0;
    if (searchableText.includes("it ngot") || searchableText.includes("thanh")) score += 3;
    if (searchableText.includes("tra") || searchableText.includes("cold brew")) score += 2;
    if (searchableText.includes("socola") || searchableText.includes("caramel")) score -= 2;
    if (searchableText.includes("frappe") || searchableText.includes("sua")) score -= 1;
    return score;
  };

  // Nếu filter quá chặt thì lùi về category hoặc token message để vẫn có kết quả hữu ích.
  if (!candidates.length && normalizedCategory) {
    candidates = products.filter((product) =>
      normalizeProductText(`${product.name} ${product.productCategoryId?.name || ""}`).includes(normalizedCategory) &&
      (!normalizedExcludeCategory ||
        !normalizeProductText(`${product.name} ${product.productCategoryId?.name || ""}`).includes(normalizedExcludeCategory))
    );
  }

  if (!candidates.length && normalizedMessage) {
    candidates = products.filter((product) => {
      const searchableText = normalizeProductText(
        `${product.name} ${product.productCategoryId?.name || ""} ${product.description || ""}`
      );
      return normalizedMessage
        .split(" ")
        .filter(Boolean)
        .some((token) => token.length > 2 && searchableText.includes(token));
    });
  }

  if (!candidates.length) {
    candidates = products;
  }

  return candidates
    .slice()
    .sort((a, b) => {
      const priceA = getDiscountedPrice(a);
      const priceB = getDiscountedPrice(b);
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }

      if (sortBy === "price_asc") {
        return priceA - priceB || lightTasteScore(b) - lightTasteScore(a);
      }

      if (sortBy === "price_desc") {
        return priceB - priceA || lightTasteScore(b) - lightTasteScore(a);
      }

      return (
        lightTasteScore(b) - lightTasteScore(a) ||
        (b.discount || 0) - (a.discount || 0) ||
        priceA - priceB
      );
    })
    .slice(0, limit);
};
