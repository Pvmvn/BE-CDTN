import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Masonry from "react-masonry-css";
import blogCategoryApi from "../../api/blogCategoryApi";
import { toast } from "react-toastify";
import blogApi from "../../api/blogAPI";
import { motion } from "framer-motion";
import BlogCard from "../../components/BlogCard";
import { Parallax } from "react-scroll-parallax";

const MotionDiv = motion.div;

const NewsPage = () => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [blogcategories, setBlogCategories] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [isCategoryLoaded, setIsCategoryLoaded] = useState(false);
  useEffect(() => {
      document.title = `Tin tức`;
  }, []);
  useEffect(() => {
    const fetchAllCategoryBlog = async () => {
      try {
        const data = await blogCategoryApi.getAll();
        setBlogCategories(data);
        setIsCategoryLoaded(true);

        const categoryExists = data.some(
          (category) => category.slug === categorySlug
        );
        if (data.length > 0 && (!categorySlug || !categoryExists)) {
          navigate(`/blogs/${data[0].slug}`, { replace: true });
        }
      } catch (error) {
        setIsCategoryLoaded(true);
        toast.error(error.response?.data?.message || "Không tải được danh mục bài viết");
      }
    };
    fetchAllCategoryBlog();
  }, [categorySlug, navigate]);
  
  useEffect(() => {
    if (!isCategoryLoaded || !categorySlug) return;

    const currentCategory = blogcategories.find(
      (category) => category.slug === categorySlug
    );
    if (!currentCategory) {
      setBlogs([]);
      return;
    }

    const fetchBlogsByCategorySlug = async () => {
      try {
        const data = await blogApi.getByCategory(categorySlug);
        setBlogs(data);
      } catch {
        toast.error("Đã có lỗi xảy ra khi hiển thị bài viết");
      }
    };
    fetchBlogsByCategorySlug();
  }, [blogcategories, categorySlug, isCategoryLoaded]);
  
  const currentCategory = blogcategories.find(
    (category) => category.slug === categorySlug
  );
  
  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1,
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-yellow-50 via-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-y-6 pb-16 relative">
          <div className="absolute top-[36%] right-[10%] z-[20] max-lg:hidden">
            <Parallax speed={10}>
              <img
                src="/sticker.png"
                alt="sticker"
                className="w-24 opacity-80"
              />
            </Parallax>
          </div>
          
          <h1 className="text-center text-4xl lg:text-5xl font-bold text-gray-900 max-w-3xl">
            {currentCategory ? currentCategory.name : categorySlug}
          </h1>
          
          <p className="text-center max-w-2xl text-base lg:text-lg text-gray-600 leading-relaxed px-4">
            "Tin tức nhà THREESTAR" là nơi nhà chia sẻ những câu chuyện đằng sau
            mỗi ly nước bạn cầm trên tay. Từ hành trình tìm kiếm nguyên liệu,
            những vùng đất cà phê xa xôi, cho đến cách chúng tôi gìn giữ hương vị
            nguyên bản và lan tỏa những giá trị ý nghĩa.
          </p>
          
          <div className="flex flex-wrap gap-3 items-center justify-center mt-4">
            {blogcategories &&
              blogcategories.length > 0 &&
              blogcategories.map((category) => (
                <Link key={category._id} to={`/blogs/${category.slug}`}>
                  <button
                    className={`${
                      categorySlug === category.slug
                        ? "bg-amber-600 text-white shadow-lg scale-105"
                        : "text-amber-600 bg-white hover:bg-amber-50"
                    } rounded-full px-6 py-2.5 border border-amber-600 cursor-pointer font-semibold transition-all duration-200 hover:shadow-md`}
                  >
                    {category.name}
                  </button>
                </Link>
              ))}
          </div>
        </div>

        {/* Masonry Grid */}
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-auto -ml-8"
          columnClassName="pl-8 bg-clip-padding"
        >
          {blogs &&
            blogs.length > 0 &&
            blogs.map((blog, index) => (
              <MotionDiv
                key={blog._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: index * 0.1 
                }}
                viewport={{ once: true, amount: 0.2 }}
                className="mb-8"
              >
                <BlogCard
                  blog={blog}
                  fromNewsPage={true}
                  categorySlug={categorySlug}
                />
              </MotionDiv>
            ))}
        </Masonry>
      </div>
    </div>
  );
};

export default NewsPage;
