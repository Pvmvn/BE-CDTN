import {
  getDiscountedPrice,
  normalizeProductText,
  normalizeVietnameseText,
  searchProducts,
} from "./ai.tools.js";

// Helper chat cho AI: phân tích ý định, tìm ngữ cảnh món và dựng câu trả lời fallback.
const MENU_RELATED_KEYWORDS = [
  "mon",
  "do uong",
  "menu",
  "gia",
  "sale",
  "giam",
  "coffee",
  "ca phe",
  "matcha",
  "tra",
  "latte",
  "espresso",
  "frappe",
  "goi y",
  "de xuat",
  "phu hop",
  "uong gi",
];

const PERSONALIZATION_KEYWORDS = [
  "cho toi",
  "cho minh",
  "lich su",
  "thuong",
  "hay uong",
  "da tung",
  "ca nhan",
  "phu hop voi toi",
];

export const isFollowUpProductQuestion = (message = "") => {
  const normalizedMessage = normalizeVietnameseText(message);
  return [
    "mon do",
    "ly do",
    "do uong do",
    "vay mon do",
    "vay ly do",
    "size lon",
    "size vua",
    "size nho",
    "vi gi",
    "mui vi",
    "ngot khong",
    "dang khong",
    "de uong khong",
  ].some((keyword) => normalizedMessage.includes(keyword));
};

const findMentionedProduct = (text = "", products = []) => {
  const normalizedText = normalizeProductText(text);
  if (!normalizedText) return null;

  const scoredMatches = products
    .map((product) => {
      const normalizedName = normalizeProductText(product.name);
      if (!normalizedName) return null;

      if (normalizedText.includes(normalizedName)) {
        return { product, score: normalizedName.length + 1000 };
      }

      const nameTokens = normalizedName.split(" ").filter(Boolean);
      const matchedTokens = nameTokens.filter((token) => normalizedText.includes(token));

      if (matchedTokens.length >= Math.max(2, Math.ceil(nameTokens.length / 2))) {
        return { product, score: matchedTokens.length * 10 + normalizedName.length };
      }

      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scoredMatches[0]?.product || null;
};

export const resolveContextProduct = (message, history, products) => {
  const directMatch = findMentionedProduct(message, products);
  if (directMatch) return directMatch;

  if (!isFollowUpProductQuestion(message)) {
    return null;
  }

  const reversedHistory = [...history].reverse();
  for (const item of reversedHistory) {
    const matchedProduct = findMentionedProduct(item.content, products);
    if (matchedProduct) {
      return matchedProduct;
    }
  }

  return null;
};

export const buildProductContextNote = (product) => {
  if (!product) return "";

  return `

Mon dang duoc nhac trong ngu canh:
- Ten mon: ${product.name}
- Danh muc: ${product.productCategoryId?.name || "Khong ro"}
- Gia: ${product.price}
- Giam gia: ${product.discount || 0}
- Mo ta: ${product.description || "Chua co mo ta"}
`.trim();
};

export const buildDescriptionBasedReply = (message, product) => {
  if (!product?.description?.trim()) {
    return null;
  }

  const normalizedMessage = normalizeVietnameseText(message);
  const description = product.description.trim();

  if (
    normalizedMessage.includes("vi gi") ||
    normalizedMessage.includes("mui vi") ||
    normalizedMessage.includes("ngot khong") ||
    normalizedMessage.includes("dang khong") ||
    normalizedMessage.includes("beo khong") ||
    normalizedMessage.includes("de uong khong")
  ) {
    return `Mon ${product.name} co mo ta nhu sau: ${description}`;
  }

  return null;
};

export const shouldUseProductSearch = (message = "", history = []) => {
  const normalizedMessage = normalizeVietnameseText(message);

  if (isFollowUpProductQuestion(message)) {
    return true;
  }

  if (MENU_RELATED_KEYWORDS.some((keyword) => normalizedMessage.includes(keyword))) {
    return true;
  }

  return history.some((item) => {
    const normalizedHistory = normalizeVietnameseText(item.content || "");
    return MENU_RELATED_KEYWORDS.some((keyword) => normalizedHistory.includes(keyword));
  });
};

export const shouldLoadOrderHistoryForChat = (message = "") => {
  const normalizedMessage = normalizeVietnameseText(message);
  return PERSONALIZATION_KEYWORDS.some((keyword) => normalizedMessage.includes(keyword));
};

export const extractSearchCriteria = (message = "") => {
  const normalizedMessage = normalizeVietnameseText(message);
  const criteria = {
    message,
    keyword: "",
    category: "",
    excludeCategory: "",
    discountOnly: false,
    preferLightTaste: false,
    maxPrice: undefined,
    minPrice: undefined,
    sortBy: "discount",
    limit: 8,
  };

  if (normalizedMessage.includes("giam") || normalizedMessage.includes("sale") || normalizedMessage.includes("khuyen mai")) {
    criteria.discountOnly = true;
  }

  if (normalizedMessage.includes("ca phe") || normalizedMessage.includes("coffee")) {
    criteria.category = "ca phe";
  } else if (normalizedMessage.includes("matcha")) {
    criteria.category = "matcha";
  } else if (normalizedMessage.includes("tra")) {
    criteria.category = "tra";
  } else if (normalizedMessage.includes("latte")) {
    criteria.category = "latte";
  } else if (normalizedMessage.includes("espresso")) {
    criteria.category = "espresso";
  } else if (normalizedMessage.includes("frappe")) {
    criteria.category = "frappe";
  }

  if (
    normalizedMessage.includes("khong ca phe") ||
    normalizedMessage.includes("khong coffee") ||
    normalizedMessage.includes("khong chua ca phe")
  ) {
    criteria.excludeCategory = "ca phe";
    if (criteria.category === "ca phe") {
      criteria.category = "";
    }
  }

  if (
    normalizedMessage.includes("it ngot") ||
    normalizedMessage.includes("de uong") ||
    normalizedMessage.includes("thanh")
  ) {
    criteria.preferLightTaste = true;
  }

  const underMatch = normalizedMessage.match(/(?:duoi|toi da|max)\s*(\d+)\s*k/);
  if (underMatch) {
    criteria.maxPrice = Number(underMatch[1]) * 1000;
  }

  const overMatch = normalizedMessage.match(/(?:tren|tu|min)\s*(\d+)\s*k/);
  if (overMatch) {
    criteria.minPrice = Number(overMatch[1]) * 1000;
  }

  if (
    normalizedMessage.includes("mon moi") ||
    normalizedMessage.includes("moi nhat") ||
    normalizedMessage.includes("new")
  ) {
    criteria.sortBy = "newest";
  }

  if (
    normalizedMessage.includes("re nhat") ||
    normalizedMessage.includes("gia re") ||
    normalizedMessage.includes("thap nhat")
  ) {
    criteria.sortBy = "price_asc";
  }

  if (
    normalizedMessage.includes("dat nhat") ||
    normalizedMessage.includes("cao nhat") ||
    normalizedMessage.includes("sang")
  ) {
    criteria.sortBy = "price_desc";
  }

  const keywordSource = normalizedMessage
    .replace(/(?:duoi|toi da|max|tren|tu|min)\s*\d+\s*k/g, " ")
    .replace(/\b(giam|sale|khuyen mai|goi y|de xuat|phu hop|uong gi|cho toi|cho minh|it ngot|khong|mon moi|moi nhat|gia re|re nhat|thap nhat|dat nhat|cao nhat)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  criteria.keyword = keywordSource;
  return criteria;
};

export const formatProductsForPrompt = (products = []) =>
  products.map((product) => ({
    productId: product._id.toString(),
    name: product.name,
    category: product.productCategoryId?.name || "",
    description: product.description || "",
    price: product.price,
    discount: product.discount || 0,
  }));

export const formatOrdersForPrompt = (orders = []) =>
  orders.map((order) => ({
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
    })),
  }));

export const buildFallbackChatReply = (message, products, history = []) => {
  const lowerMessage = message.toLowerCase();
  const contextProduct = resolveContextProduct(message, history, products);
  const descriptionBasedReply = buildDescriptionBasedReply(message, contextProduct);

  if (descriptionBasedReply) {
    return descriptionBasedReply;
  }

  const outOfScopeKeywords = [
    "thoi tiet",
    "ha noi",
    "lam tho",
    "viet tho",
    "ke chuyen",
    "jailbreak",
    "bypass",
    "hack",
  ];

  if (outOfScopeKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return "Toi chi ho tro tu van mon, gia, uu dai va dat mon cua THREESTAR. Ban muon toi goi y do uong hoac mon nao phu hop khong?";
  }

  if (contextProduct && (lowerMessage.includes("size") || lowerMessage.includes("vị") || lowerMessage.includes("vi "))) {
    if (lowerMessage.includes("size")) {
      return `Hien tai THREESTAR chua co thong tin ve size cua mon ${contextProduct.name}. Neu ban muon, toi co the goi y them mon tuong tu trong menu.`;
    }

    return `Hien tai THREESTAR chua co thong tin chi tiet hon ngoai mo ta san pham cua mon ${contextProduct.name}. Ban co the xem mo ta mon hoac toi goi y mon khac cung nhom cho ban.`;
  }

  const selected = searchProducts({ products, message, limit: 3 });

  if (!selected.length) {
    return "Hiện chưa có sản phẩm đang bán để tôi tư vấn. Bạn quay lại sau nhé.";
  }

  const names = selected
    .map((product) => `${product.name} (${getDiscountedPrice(product).toLocaleString("vi-VN")}đ)`)
    .join(", ");

  return `Hiện tôi gợi ý ${names}. Gemini đang hết quota nên tôi đang tư vấn theo dữ liệu menu có sẵn.`;
};
