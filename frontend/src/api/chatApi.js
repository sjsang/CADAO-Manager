import axiosClient from "./axiosClient";

const chatApi = {
    startConversation() {
        return axiosClient.post("/chats/conversations/start");
    },

    getConversations() {
        return axiosClient.get("/chats/conversations");
    },

    getMessages(conversationId) {
        return axiosClient.get(`/chats/conversations/${conversationId}/messages`);
    },

    sendMessage(payload) {
        return axiosClient.post("/chats/messages", payload);
    },

    markAsRead(conversationId) {
        return axiosClient.patch(`/chats/conversations/${conversationId}/read`);
    },

    toggleBot(conversationId, isBotActive) {
        return axiosClient.patch(`/chats/conversations/${conversationId}/bot-status`, { isBotActive });
    },

    getUnreadCount() {
        return axiosClient.get("/chats/unread-count");
    },



    getConversationSummary(conversationId) {
        return axiosClient.get(`/chats/conversations/${conversationId}/summary`);
    },

    getDashboardStats(params = {}) {
        return axiosClient.get("/chats/dashboard-stats", { params });
    }
};

export default chatApi;
