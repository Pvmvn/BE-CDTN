import axiosClient from "./axiosClient";

const aiApi = {
  recommendProducts: async () => {
    const res = await axiosClient.get("/ai/recommend-products");
    return res.data;
  },
  chat: async (message) => {
    const res = await axiosClient.post("/ai/chat", { message });
    return res.data;
  },
};

export default aiApi;
