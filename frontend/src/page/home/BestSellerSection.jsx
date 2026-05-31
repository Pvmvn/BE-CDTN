import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Card from "../../components/Card";
import ModalDetailProduct from "../../components/modal/customerProduct/ModalDetailProduct";
import productApi from "../../api/productApi";

const BestSellerSection = () => {
  const [products, setProducts] = useState([]);
  const [productDetail, setProductDetail] = useState(null);
  const [isOpenModalDetailProduct, setIsOpenModalDetailProduct] =
    useState(false);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await productApi.getLimitedProducts();
        setProducts((data || []).slice(0, 4));
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Khong the tai mon ban chay"
        );
      }
    };

    getProducts();
  }, []);

  const openProductDetail = (product) => {
    setProductDetail(product);
    setIsOpenModalDetailProduct(true);
  };

  return (
    <div className="flex flex-col px-20 max-lg:px-4 ">
      <h2 className="text-center text-2xl font-bold">Mon ban chay</h2>
      <div className="grid w-full flex-1 grid-cols-4 gap-6 gap-x-20 py-20 max-lg:grid-cols-2 max-lg:gap-x-6 max-lg:py-10">
        {products.map((product) => (
          <Card key={product._id} product={product} onClick={openProductDetail} />
        ))}
      </div>
      {isOpenModalDetailProduct && (
        <ModalDetailProduct
          isOpenModalDetailProduct={isOpenModalDetailProduct}
          setIsOpenModalDetailProduct={setIsOpenModalDetailProduct}
          productDetail={productDetail}
        />
      )}
    </div>
  );
};

export default BestSellerSection;
