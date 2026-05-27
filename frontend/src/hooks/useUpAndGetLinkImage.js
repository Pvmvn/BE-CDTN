import { toast } from "react-toastify";
import axiosClient from "../api/axiosClient";

const dataUrlToFile = (dataUrl, fileName) => {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], fileName, { type: mime });
};

const useUpAndGetLinkImage = () => {
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file, index) => {
      if (typeof file === "string" && file.startsWith("data:")) {
        formData.append("images", dataUrlToFile(file, `image-${index}.png`));
        return;
      }

      formData.append("images", file);
    });

    try {
      const res = await axiosClient.post("/uploads/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data.urls || [];
    } catch {
      toast.error("Da xay ra loi. Hay thu lai!");
      return [];
    }
  };

  return {
    handleImageUpload,
  };
};

export default useUpAndGetLinkImage;
