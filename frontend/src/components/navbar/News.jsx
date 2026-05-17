import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import blogCategoryApi from "../../api/blogCategoryApi";

const News = () => {
  const [newsPath, setNewsPath] = useState("");

  useEffect(() => {
    const loadDefaultCategory = async () => {
      try {
        const categories = await blogCategoryApi.getAll();
        const defaultCategory = categories[0];

        if (defaultCategory?.slug) {
          setNewsPath(`/blogs/${defaultCategory.slug}`);
        }
      } catch {
        setNewsPath("");
      }
    };

    loadDefaultCategory();
  }, []);

  return (
    <div>
      {newsPath ? (
        <Link to={newsPath}>
          <span className="hover:text-green-700 cursor-pointer">TIN TỨC</span>
        </Link>
      ) : (
        <span className="text-gray-400 cursor-not-allowed">TIN TỨC</span>
      )}
    </div>
  );
};

export default News;
