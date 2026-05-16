import { useEffect, useState } from "react";
import { Search, Edit2, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import userApi from "../../api/userApi";
import ModalConfirmDelete from "../../components/modal/ModalConfirmDelete";
import ModalUpdateRoleUser from "../../components/modal/adminUser/ModalUpdateRoleUser";
import ModalUpdateUser from "../../components/modal/adminUser/ModalUpdateUser";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [getUsersByRouter, setGetUsersByRouter] = useState("users");
  const [isOpenModalUpdateRoleUser, setIsOpenModalUpdateRoleUser] =
    useState(false);
  const [isOpenModalUpdateUser, setIsOpenModalUpdateUser] = useState(false);
  const [isOpenConfirmDelete, setIsOpenConfirmDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    document.title = "Quản lý người dùng";
  }, []);

  useEffect(() => {
    const getAllUsersByButton = async () => {
      try {
        const res = await userApi.getAllUsers(getUsersByRouter);
        setUsers(res);
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi tải người dùng");
      }
    };

    getAllUsersByButton();
  }, [getUsersByRouter]);

  const handleUpdateRoleUser = async () => {
    try {
      const res = await userApi.updateUserRole(selectedUser._id, {
        role: selectedUser.role,
      });
      setUsers((prev) =>
        prev.map((user) => (user._id === selectedUser._id ? res : user))
      );
      toast.success("Phân quyền thành công");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi phân quyền");
    } finally {
      setIsOpenModalUpdateRoleUser(false);
      setSelectedUser(null);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const res = await userApi.updateUser(selectedUser._id, {
        name: selectedUser.name,
        email: selectedUser.email,
      });
      setUsers((prev) =>
        prev.map((user) => (user._id === selectedUser._id ? res : user))
      );
      toast.success("Cập nhật người dùng thành công");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật người dùng");
    } finally {
      setIsOpenModalUpdateUser(false);
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await userApi.deleteUser(selectedUser._id);
      setUsers((prev) => prev.filter((user) => user._id !== selectedUser._id));
      toast.success("Xóa người dùng thành công");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi xóa người dùng");
    } finally {
      setIsOpenConfirmDelete(false);
      setSelectedUser(null);
    }
  };

  const getListLabel = () =>
    (getUsersByRouter === "users" && "người dùng") ||
    (getUsersByRouter === "users/role/manager" && "nhân viên") ||
    (getUsersByRouter === "users/role/admin" && "admin");

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Quản lý người dùng
            </h2>
            <p className="text-gray-600 mt-1">Danh sách {getListLabel()}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-x-4 mt-4">
          <button
            className={`px-4 py-1 rounded-sm text-white cursor-pointer ${
              getUsersByRouter === "users"
                ? "bg-green-600"
                : "bg-green-600 shadow-inner opacity-60"
            }`}
            onClick={() => setGetUsersByRouter("users")}
          >
            Tất cả
          </button>
          <button
            className={`px-4 py-1 rounded-sm text-white cursor-pointer ${
              getUsersByRouter === "users/role/manager"
                ? "bg-blue-600"
                : "bg-blue-600 shadow-inner opacity-60"
            }`}
            onClick={() => setGetUsersByRouter("users/role/manager")}
          >
            Nhân viên
          </button>
          <button
            className={`px-4 py-1 rounded-sm text-white cursor-pointer ${
              getUsersByRouter === "users/role/admin"
                ? "bg-orange-600"
                : "bg-orange-600 shadow-inner opacity-60"
            }`}
            onClick={() => setGetUsersByRouter("users/role/admin")}
          >
            Admin
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[
                "STT",
                "Tên người dùng",
                "Email",
                "Vai trò",
                "Phân quyền",
                "Thao tác",
              ].map((head) => (
                <th
                  key={head}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {users
              .filter((user) =>
                user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((user, index) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{index + 1}</td>
                  <td className="px-6 py-4 text-sm truncate max-w-[200px]">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      className="text-green-600 hover:text-green-800 cursor-pointer"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsOpenModalUpdateRoleUser(true);
                      }}
                      title="Phân quyền"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-x-4">
                      <button
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsOpenModalUpdateUser(true);
                        }}
                        title="Sửa người dùng"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsOpenConfirmDelete(true);
                        }}
                        title="Xóa người dùng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {isOpenModalUpdateRoleUser && selectedUser && (
        <ModalUpdateRoleUser
          isOpenModalUpdateRoleUser={isOpenModalUpdateRoleUser}
          setIsOpenModalUpdateRoleUser={setIsOpenModalUpdateRoleUser}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          onConfirm={handleUpdateRoleUser}
        />
      )}

      {isOpenModalUpdateUser && selectedUser && (
        <ModalUpdateUser
          isOpenModalUpdateUser={isOpenModalUpdateUser}
          setIsOpenModalUpdateUser={setIsOpenModalUpdateUser}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          onConfirm={handleUpdateUser}
        />
      )}

      {isOpenConfirmDelete && selectedUser && (
        <ModalConfirmDelete
          content={`Bạn có chắc chắn muốn xóa người dùng ${selectedUser.name}?`}
          isOpenConfirmDelete={isOpenConfirmDelete}
          setIsOpenConfirmDelete={setIsOpenConfirmDelete}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  );
}
