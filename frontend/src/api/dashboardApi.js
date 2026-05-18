import axiosClient from "./axiosClient";

const dashboardApi = {
  getSummary: async ({ startDate, endDate } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const res = await axiosClient.get(`/dashboard/summary?${params.toString()}`);
    return res.data;
  },
};

export default dashboardApi;
