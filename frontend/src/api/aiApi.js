import axiosClient from "./axiosClient";

const aiApi = {
  recommendProducts: async () => {
    const res = await axiosClient.get("/ai/recommend-products");
    return res.data;
  },
  chat: async (message, history = []) => {
    const res = await axiosClient.post("/ai/chat", { message, history });
    return res.data;
  },
};

export default aiApi;
