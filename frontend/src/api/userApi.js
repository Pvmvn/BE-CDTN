import axiosClient from "./axiosClient";

const userApi = {
  getAllUsers: async(router) => {
    const res = await axiosClient.get(`/${router}`);
    return res.data
  },
  
  updateUserRole: async(id, data) => {
    const res = await axiosClient.patch(`/users/${id}`, data);
    return res.data
  },

  updateUser: async(id, data) => {
    const res = await axiosClient.put(`/users/${id}`, data);
    return res.data
  },

  deleteUser: async(id) => {
    const res = await axiosClient.delete(`/users/${id}`);
    return res.data
  }
}
export default userApi
