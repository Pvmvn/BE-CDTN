import Modal from "react-modal";
import useLockBodyScroll from "../../../hooks/useLockBodyScroll";

const ModalUpdateUser = ({
  isOpenModalUpdateUser,
  setIsOpenModalUpdateUser,
  selectedUser,
  setSelectedUser,
  onConfirm,
}) => {
  useLockBodyScroll(isOpenModalUpdateUser);

  const handleChange = (field, value) => {
    setSelectedUser((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      appElement={document.getElementById("root")}
      isOpen={isOpenModalUpdateUser}
      onRequestClose={() => setIsOpenModalUpdateUser(false)}
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 50,
        },
        content: {
          top: "8rem",
          left: "auto",
          right: "auto",
          bottom: "auto",
          padding: 0,
          border: "none",
          background: "white",
          borderRadius: "0.5rem",
          overflow: "visible",
          width: "100%",
          maxWidth: "460px",
        },
      }}
    >
      <div className="overflow-hidden rounded-md w-full flex flex-col select-none">
        <div className="w-full py-3 px-4 relative border-b-1 border-b-gray-400">
          <p className="font-bold text-xl">Sửa người dùng</p>
        </div>

        <div className="flex flex-col gap-y-4 mt-4 px-4">
          <label className="flex flex-col gap-y-1">
            <span className="font-medium">Tên người dùng</span>
            <input
              value={selectedUser?.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="border px-3 py-2 rounded-md outline-none focus:ring-2 focus:ring-green-500"
            />
          </label>

          <label className="flex flex-col gap-y-1">
            <span className="font-medium">Email</span>
            <input
              value={selectedUser?.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              className="border px-3 py-2 rounded-md outline-none focus:ring-2 focus:ring-green-500"
            />
          </label>
        </div>

        <div className="flex items-center gap-x-6 px-4 w-full py-8">
          <button
            className="w-full border px-2 py-2 rounded-md cursor-pointer"
            onClick={() => setIsOpenModalUpdateUser(false)}
          >
            Hủy
          </button>
          <button
            className="bg-green-600 w-full rounded-md px-2 py-2 cursor-pointer text-white"
            onClick={onConfirm}
          >
            Cập nhật
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalUpdateUser;
