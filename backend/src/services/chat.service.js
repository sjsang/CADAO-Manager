const OpenAI = require("openai");
const chatRepository = require("../repositories/chat.repository");

const AI_MODEL = process.env.AI_CHAT_MODEL || "openai/gpt-4o-mini";
const AI_TIMEOUT_MS = 15_000;
const HISTORY_LIMIT = 6;
const FALLBACK_MSG = "Xin lỗi bạn, mình đang gặp sự cố nhỏ. Bạn vui lòng thử lại nhé!";

const createHttpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return null;
    }

    return new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1"
    });
};

const removeAccents = (str) =>
    String(str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim();

const callAI = async (payload) => {
    const client = getOpenAIClient();
    if (!client) {
        throw createHttpError(500, "OPENAI_API_KEY chưa được cấu hình.");
    }

    return Promise.race([
        client.chat.completions.create(payload),
        new Promise((_, reject) => setTimeout(() => reject(new Error("AI request timed out")), AI_TIMEOUT_MS))
    ]);
};

const SYSTEM_PROMPT = `Bạn là trợ lý AI tư vấn nhà hàng CADAO.

QUY TẮC GIAO TIẾP:
- Xưng "mình", gọi khách là "bạn".
- Trả lời ngắn gọn, rõ ràng, tối đa 4-6 dòng.
- Không bịa thông tin món ăn, giá, voucher.

KHI TƯ VẤN:
- Khách hỏi món ăn / danh mục / loại món: dùng tool search_menu_items.
- Khách hỏi món rẻ nhất hoặc đắt nhất: dùng tool get_menu_items_by_price.
- Khách hỏi ưu đãi / mã giảm / voucher: dùng tool get_promotions.
- Nếu có voucher thì nhắc khách nhập mã ở bước thanh toán.

XỬ LÝ TỒN KHO:
- is_available = false: báo món tạm hết, gợi ý món khác nếu có.

ĐỊNH DẠNG:
- Liệt kê ngắn dạng gạch đầu dòng, mỗi món/mã 1 dòng.
- Giá hiển thị theo VND.`;

const tools = [
    {
        type: "function",
        function: {
            name: "search_menu_items",
            description: "Tìm món theo tên, mô tả, danh mục, loại món.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Từ khóa tìm món" }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_menu_items_by_price",
            description: "Lấy món theo giá tăng dần hoặc giảm dần.",
            parameters: {
                type: "object",
                properties: {
                    sort: {
                        type: "string",
                        enum: ["asc", "desc"],
                        description: "asc = rẻ nhất, desc = đắt nhất"
                    },
                    limit: {
                        type: "number",
                        description: "Số lượng món cần lấy"
                    }
                },
                required: ["sort"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_promotions",
            description: "Lấy danh sách voucher đang hoạt động.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    }
];

const executeSearchMenuItems = async (query) => {
    const keyword = String(query || "").trim();
    if (!keyword) {
        return JSON.stringify({ message: "Từ khóa tìm kiếm trống." });
    }

    const normalized = removeAccents(keyword);
    const rows = await chatRepository.searchMenuItems(keyword, 5);
    const fallbackRows = normalized && normalized !== keyword
        ? await chatRepository.searchMenuItems(normalized, 5)
        : [];

    const merged = [...rows];
    fallbackRows.forEach((item) => {
        if (!merged.some((existing) => Number(existing.id) === Number(item.id))) {
            merged.push(item);
        }
    });

    if (merged.length === 0) {
        return JSON.stringify({ message: `Không tìm thấy món phù hợp với từ khóa "${keyword}".` });
    }

    return JSON.stringify(
        merged.slice(0, 5).map((item) => ({
            name: item.name,
            price: item.price,
            category: item.category_name,
            menuType: item.menu_type_name,
            soldCount: item.sold_count,
            isAvailable: item.is_available,
            description: String(item.description || "").slice(0, 150)
        }))
    );
};

const executeGetMenuItemsByPrice = async (sort = "asc", limit = 1) => {
    const items = await chatRepository.getMenuItemsByPrice({ sort, limit });
    if (items.length === 0) {
        return JSON.stringify({ message: "Hiện không có món phù hợp." });
    }

    return JSON.stringify(
        items.map((item) => ({
            name: item.name,
            price: item.price,
            category: item.category_name,
            menuType: item.menu_type_name,
            soldCount: item.sold_count,
            isAvailable: item.is_available
        }))
    );
};

const executeGetPromotions = async () => {
    const vouchers = await chatRepository.getActiveVouchers();
    if (vouchers.length === 0) {
        return JSON.stringify({ message: "Hiện chưa có voucher nào đang hoạt động." });
    }

    return JSON.stringify({
        message: "Danh sách voucher hiện tại",
        vouchers: vouchers.map((v) => ({
            code: v.code,
            discountPercent: v.discount_percent,
            discountAmount: v.discount_amount,
            minOrderValue: v.min_order_value,
            maxDiscount: v.max_discount,
            remainingUsage: v.usage_limit === null ? null : Number(v.usage_limit) - Number(v.used_count || 0),
            expiryDate: v.expiry_date
        }))
    });
};

const startConversation = async (customerId) => {
    const admin = await chatRepository.getAdminUser();
    if (!admin) {
        throw createHttpError(404, "Không tìm thấy admin để hỗ trợ chat.");
    }

    let conversation = await chatRepository.getConversationByCustomerId(customerId);
    if (!conversation) {
        conversation = await chatRepository.createConversation(customerId, admin.id);
    }

    return conversation;
};

const assertConversationAccess = (conversation, currentUser) => {
    if (!conversation) {
        throw createHttpError(404, "Hội thoại không tồn tại.");
    }

    if (currentUser.role === "customer" && Number(conversation.customer_id) !== Number(currentUser.id)) {
        throw createHttpError(403, "Bạn không có quyền truy cập hội thoại này.");
    }
};

const sendMessage = async ({ currentUser, conversationId, text }) => {
    const content = String(text || "").trim();
    if (!content) {
        throw createHttpError(400, "Nội dung tin nhắn không được để trống.");
    }

    const conversation = await chatRepository.getConversationById(conversationId);
    assertConversationAccess(conversation, currentUser);

    const isSenderAdmin = currentUser.role === "admin";
    const isRequestingHuman = content === "[REQUEST_HUMAN]";
    const actualText = isRequestingHuman ? "Mình muốn được nhân viên tư vấn trực tiếp." : content;

    const userMessage = await chatRepository.createMessage({
        conversationId,
        senderType: isSenderAdmin ? "admin" : "customer",
        senderCustomerId: isSenderAdmin ? null : currentUser.id,
        senderUserId: isSenderAdmin ? currentUser.id : null,
        text: actualText
    });

    if (!isSenderAdmin && isRequestingHuman) {
        await chatRepository.setBotActiveStatus(conversationId, false);

        const handoffMessage = await chatRepository.createMessage({
            conversationId,
            senderType: "bot",
            senderUserId: conversation.admin_user_id,
            text: "Hệ thống đã ghi nhận yêu cầu. Bạn vui lòng chờ một lát, nhân viên hỗ trợ sẽ phản hồi bạn ngay nhé!"
        });

        return {
            userMessage,
            aiMessage: handoffMessage,
            isBotActive: false
        };
    }

    if (isSenderAdmin || !conversation.is_bot_active) {
        return {
            userMessage,
            aiMessage: null,
            isBotActive: Boolean(conversation.is_bot_active)
        };
    }

    try {
        const history = await chatRepository.getRecentMessages(conversationId, HISTORY_LIMIT);
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map((msg) => ({
                role: msg.sender_type === "customer" ? "user" : "assistant",
                content: msg.text
            }))
        ];

        const firstResponse = await callAI({
            model: AI_MODEL,
            messages,
            tools,
            tool_choice: "auto",
            temperature: 0.5
        });

        let aiResponseMsg = firstResponse.choices[0]?.message || { content: "" };

        if (aiResponseMsg.tool_calls?.length > 0) {
            messages.push(aiResponseMsg);

            for (const toolCall of aiResponseMsg.tool_calls) {
                let dbResult = JSON.stringify({ message: "Tool không được hỗ trợ." });
                const args = toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};

                if (toolCall.function.name === "search_menu_items") {
                    dbResult = await executeSearchMenuItems(args.query);
                }

                if (toolCall.function.name === "get_menu_items_by_price") {
                    dbResult = await executeGetMenuItemsByPrice(args.sort, args.limit);
                }

                if (toolCall.function.name === "get_promotions") {
                    dbResult = await executeGetPromotions();
                }

                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: toolCall.function.name,
                    content: dbResult
                });
            }

            const secondResponse = await callAI({
                model: AI_MODEL,
                messages,
                temperature: 0.5
            });

            aiResponseMsg = secondResponse.choices[0]?.message || { content: "" };
        }

        const aiText = String(aiResponseMsg.content || "").trim() || FALLBACK_MSG;
        const aiMessage = await chatRepository.createMessage({
            conversationId,
            senderType: "bot",
            senderUserId: conversation.admin_user_id,
            text: aiText
        });

        return {
            userMessage,
            aiMessage,
            isBotActive: true
        };
    } catch (error) {
        console.error("AI chat error:", error.message || error);

        const aiMessage = await chatRepository.createMessage({
            conversationId,
            senderType: "bot",
            senderUserId: conversation.admin_user_id,
            text: FALLBACK_MSG
        });

        return {
            userMessage,
            aiMessage,
            isBotActive: true
        };
    }
};

const getMessages = async ({ currentUser, conversationId }) => {
    const conversation = await chatRepository.getConversationById(conversationId);
    assertConversationAccess(conversation, currentUser);

    return chatRepository.getMessagesByConversationId(conversationId);
};

const getConversations = async (currentUser) => {
    if (currentUser.role === "admin") {
        return chatRepository.getConversationsForAdmin();
    }

    if (currentUser.role === "customer") {
        return chatRepository.getConversationsForCustomer(currentUser.id);
    }

    throw createHttpError(403, "Vai trò không được phép truy cập danh sách chat.");
};

const toggleBot = async ({ currentUser, conversationId, isBotActive }) => {
    if (currentUser.role !== "admin") {
        throw createHttpError(403, "Chỉ admin mới được bật/tắt bot.");
    }

    const conversation = await chatRepository.getConversationById(conversationId);
    if (!conversation) {
        throw createHttpError(404, "Hội thoại không tồn tại.");
    }

    return chatRepository.setBotActiveStatus(conversationId, Boolean(isBotActive));
};

const markMessagesAsRead = async ({ currentUser, conversationId }) => {
    const conversation = await chatRepository.getConversationById(conversationId);
    assertConversationAccess(conversation, currentUser);

    const readRole = currentUser.role === "admin" ? "admin" : "customer";
    await chatRepository.markMessagesAsRead(conversationId, readRole);
};

const getUnreadCount = async (currentUser) => {
    return chatRepository.getUnreadCount({ userId: currentUser.id, role: currentUser.role });
};

module.exports = {
    startConversation,
    sendMessage,
    getMessages,
    getConversations,
    toggleBot,
    markMessagesAsRead,
    getUnreadCount
};
