import { useState } from 'react'
import { toast } from 'react-toastify';
const usePreviewImage = (limit) => {
  const [selectedFile, setSelectedFile] = useState([]);
  const [selectedFileNames, setSelectedFileNames] = useState([]);
  const maxSizeFile = 8 * 1024 * 1024;
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if(selectedFile.length > limit - 1) return toast.error(`Bạn chỉ được phép đăng ${limit} ảnh`)
    if(file && file.type.startsWith("image/")){
      if(file.size > maxSizeFile){
        setSelectedFile([]);
        setSelectedFileNames([]);
        return
      } 
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setSelectedFile([...selectedFile, reader.result]);
        setSelectedFileNames([...selectedFileNames, file.name]);
      }
      e.target.value = "";
    }else {
      setSelectedFile([]);
      setSelectedFileNames([]);
    }
  }
  return {
    selectedFile,
    selectedFileNames,
    handleImageChange,
    setSelectedFile,
    setSelectedFileNames,
  }
}

export default usePreviewImage
