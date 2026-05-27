import Order from "../../model/order.model.js";
import Product from "../../model/product.model.js";

const MAX_PRODUCTS_FOR_PROMPT = 40;
const MAX_ORDERS_FOR_PROMPT = 12;
const MAX_RECOMMENDATIONS = 5;

const extractJson = (text) => {
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");

  if (start === -1 || end === -1 || end <= start) return null;
  return JSON.parse(raw.slice(start, end + 1));
};

const buildPrompt = ({ userName, products, orders }) => {
  const productList = products.map((product) => ({
    productId: product._id.toString(),
    name: product.name,
    category: product.productCategoryId?.name || "",
    price: product.price,
    discount: product.discount || 0,
  }));

  const orderHistory = orders.map((order) => ({
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      productId: item.productId?.toString(),
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  }));

  return `
Bạn là trợ lý AI gợi ý món cho quán CoffeeGo.
Khách hàng: ${userName || "Khách hàng"}.

Hãy dựa trên lịch sử đặt món và danh sách sản phẩm đang bán để gợi ý tối đa ${MAX_RECOMMENDATIONS} món phù hợp.

Yêu cầu bắt buộc:
- Chỉ chọn productId có trong danh sách sản phẩm đang bán.
- Không bịa productId.
- Ưu tiên món phù hợp với lịch sử mua hàng, danh mục hay mua, giá và giảm giá.
- Nếu khách chưa có lịch sử mua hàng, hãy gợi ý món phổ biến/dễ chọn từ danh sách hiện có.
- Trả về JSON hợp lệ, không kèm giải thích ngoài JSON.
- Mỗi phần tử gồm: productId, reason, score.
- score là số từ 0 đến 1.
- reason viết tiếng Việt, ngắn gọn, tối đa 140 ký tự.

Danh sách sản phẩm đang bán:
${JSON.stringify(productList)}

Lịch sử đặt món gần đây:
${JSON.stringify(orderHistory)}

Định dạng trả về:
[
  {
    "productId": "...",
    "reason": "...",
    "score": 0.9
  }
]
`.trim();
};

const getDiscountedPrice = (product) => {
  return Math.round(product.price * (1 - (product.discount || 0) / 100));
};

const buildFallbackRecommendations = (products, orders) => {
  const orderedCount = new Map();
  const orderedCategoryCount = new Map();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const productId = item.productId?.toString();
      if (!productId) return;
      orderedCount.set(productId, (orderedCount.get(productId) || 0) + item.quantity);
    });
  });

  products.forEach((product) => {
    const productId = product._id.toString();
    const categoryName = product.productCategoryId?.name || "";
    if (orderedCount.has(productId) && categoryName) {
      orderedCategoryCount.set(
        categoryName,
        (orderedCategoryCount.get(categoryName) || 0) + orderedCount.get(productId)
      );
    }
  });

  const scoredProducts = products.map((product) => {
    const productId = product._id.toString();
    const categoryName = product.productCategoryId?.name || "";
    const orderedScore = orderedCount.get(productId) || 0;
    const categoryScore = orderedCategoryCount.get(categoryName) || 0;
    const discountScore = product.discount || 0;
    const recentScore = product.createdAt ? new Date(product.createdAt).getTime() / 10000000000000 : 0;

    return {
      product,
      score: orderedScore * 4 + categoryScore * 2 + discountScore / 10 + recentScore,
    };
  });

  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RECOMMENDATIONS)
    .map(({ product, score }) => ({
      product,
      reason: product.discount > 0
        ? `Món này đang giảm ${product.discount}% và phù hợp để thử hôm nay.`
        : "Món này phù hợp với menu hiện có và lịch sử đặt hàng của bạn.",
      score: Math.max(0.5, Math.min(0.95, score / 20 || 0.65)),
      source: "fallback",
    }));
};

const buildFallbackChatReply = (message, products) => {
  const lowerMessage = message.toLowerCase();
  let candidates = products;

  if (lowerMessage.includes("giảm") || lowerMessage.includes("sale")) {
    candidates = products.filter((product) => product.discount > 0);
  }

  if (lowerMessage.includes("cà phê") || lowerMessage.includes("coffee")) {
    candidates = products.filter((product) =>
      `${product.name} ${product.productCategoryId?.name || ""}`.toLowerCase().includes("cà phê")
      || `${product.name} ${product.productCategoryId?.name || ""}`.toLowerCase().includes("coffee")
    );
  }

  if (lowerMessage.includes("matcha")) {
    candidates = products.filter((product) =>
      `${product.name} ${product.productCategoryId?.name || ""}`.toLowerCase().includes("matcha")
    );
  }

  if (!candidates.length) {
    candidates = products;
  }

  const selected = candidates
    .slice()
    .sort((a, b) => (b.discount || 0) - (a.discount || 0))
    .slice(0, 3);

  if (!selected.length) {
    return "Hiện chưa có sản phẩm đang bán để tôi tư vấn. Bạn quay lại sau nhé.";
  }

  const names = selected
    .map((product) => `${product.name} (${getDiscountedPrice(product).toLocaleString("vi-VN")}đ)`)
    .join(", ");

  return `Hiện tôi gợi ý ${names}. Gemini đang hết quota nên tôi đang tư vấn theo dữ liệu menu có sẵn.`;
};

const callGemini = async (prompt, { responseMimeType = "text/plain" } = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    const error = new Error("Chua cau hinh GEMINI_API_KEY");
    error.statusCode = 503;
    throw error;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
        responseMimeType,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || "Gemini khong tra ve ket qua hop le";
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

export const recommendProducts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [products, orders] = await Promise.all([
      Product.find({ status: true })
        .populate("productCategoryId", "name")
        .sort({ discount: -1, createdAt: -1 })
        .limit(MAX_PRODUCTS_FOR_PROMPT)
        .lean(),
      Order.find({ userId, status: { $ne: "CANCELLED" } })
        .sort({ createdAt: -1 })
        .limit(MAX_ORDERS_FOR_PROMPT)
        .lean(),
    ]);

    if (!products.length) {
      return res.json({ recommendations: [] });
    }

    let recommendations;

    try {
      const prompt = buildPrompt({
        userName: req.user.name,
        products,
        orders,
      });
      const geminiText = await callGemini(prompt, { responseMimeType: "application/json" });
      const parsed = extractJson(geminiText);

      if (!Array.isArray(parsed)) {
        return res.status(502).json({ message: "AI tra ve dinh dang khong hop le" });
      }

      const productMap = new Map(products.map((product) => [product._id.toString(), product]));
      const seen = new Set();

      recommendations = parsed
        .filter((item) => item?.productId && productMap.has(item.productId) && !seen.has(item.productId))
        .slice(0, MAX_RECOMMENDATIONS)
        .map((item) => {
          seen.add(item.productId);
          const product = productMap.get(item.productId);
          return {
            product,
            reason: String(item.reason || "Phu hop voi so thich dat mon cua ban").slice(0, 160),
            score: Math.max(0, Math.min(1, Number(item.score) || 0)),
            source: "gemini",
          };
        });
    } catch (error) {
      if (error.statusCode !== 429 && error.statusCode !== 503) throw error;
      recommendations = buildFallbackRecommendations(products, orders);
    }

    return res.json({ recommendations });
  } catch (error) {
    console.error("AI RECOMMEND PRODUCTS ERROR:", error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode === 503
        ? "Chua cau hinh GEMINI_API_KEY"
        : "Khong the lay goi y mon bang AI",
      error: error.message,
    });
  }
};

export const chatWithCoffeeAssistant = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Vui long nhap noi dung can hoi" });
    }

    const [products, orders] = await Promise.all([
      Product.find({ status: true })
        .populate("productCategoryId", "name")
        .sort({ discount: -1, createdAt: -1 })
        .limit(MAX_PRODUCTS_FOR_PROMPT)
        .lean(),
      Order.find({ userId: req.user.id, status: { $ne: "CANCELLED" } })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const productList = products.map((product) => ({
      productId: product._id.toString(),
      name: product.name,
      category: product.productCategoryId?.name || "",
      price: product.price,
      discount: product.discount || 0,
    }));

    const orderHistory = orders.map((order) => ({
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
    }));

    const prompt = `
Bạn là nhân viên tư vấn món của quán THREESTAR.
Hãy trả lời khách bằng tiếng Việt, thân thiện, ngắn gọn trong tối đa 4 câu.
Chỉ tư vấn dựa trên danh sách sản phẩm đang bán bên dưới.
Nếu khách hỏi ngoài phạm vi menu, đặt món, vị đồ uống, giá, ưu đãi hoặc gợi ý món, hãy lịch sự hướng khách quay lại chủ đề THREESTAR.
Khi gợi ý món, nêu tên món và lý do phù hợp. Không bịa món ngoài danh sách.

Khách hàng: ${req.user.name || "Khách hàng"}

Danh sách sản phẩm đang bán:
${JSON.stringify(productList)}

Lịch sử đặt món gần đây:
${JSON.stringify(orderHistory)}

Câu hỏi của khách:
${message.trim()}
`.trim();

    let reply;

    try {
      reply = await callGemini(prompt);
    } catch (error) {
      if (error.statusCode !== 429 && error.statusCode !== 503) throw error;
      reply = buildFallbackChatReply(message, products);
    }

    return res.json({
      reply: reply.trim(),
    });
  } catch (error) {
    console.error("AI CHAT ERROR:", error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode === 503
        ? "Chua cau hinh GEMINI_API_KEY"
        : "Khong the chat voi AI",
      error: error.message,
    });
  }
};
