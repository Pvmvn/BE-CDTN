import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import blogCategoryApi from "../../api/blogCategoryApi";

const News = () => {
  const [newsPath, setNewsPath] = useState("/blogs/coffeechill");

  useEffect(() => {
    const loadDefaultCategory = async () => {
      try {
        const categories = await blogCategoryApi.getAll();
        const defaultCategory =
          categories.find((category) => category.slug?.includes("coffee")) ||
          categories[0];

        if (defaultCategory?.slug) {
          setNewsPath(`/blogs/${defaultCategory.slug}`);
        }
      } catch {
        setNewsPath("/blogs/coffeechill");
      }
    };

    loadDefaultCategory();
  }, []);

  return (
    <div>
      <Link to={newsPath}>
        <span className="hover:text-green-700 cursor-pointer">TIN TỨC</span>
      </Link>
    </div>
  );
};

export default News;
