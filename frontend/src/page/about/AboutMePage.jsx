import React from "react";
import { useEffect } from "react";
import { Parallax } from "react-scroll-parallax";

const AboutMePage = () => {
  useEffect(() => {
    document.title = `Về Three Star`;
  }, []);
  return (
    <div className="mx-auto w-full space-y-10">
      <div className="w-full flex flex-col items-center min-h-[700px] h-screen md:h-screen bg-[url('/banner-page-coffeego.png')] bg-cover bg-center bg-no-repeat px-4">
        <img src="/coffee-go-text.png" className="h-38 w-100" alt="" />
        <h1 className="text-orange-500 font-bold text-2xl max-w-2xl max-sm:text-md text-center">
          Mỗi tách cà phê là một hành trình – và “ThreeStar” là nơi bắt đầu của
          những khoảnh khắc đáng nhớ.
        </h1>
        <p className="text-md max-sm:text-xs max-w-3xl pt-10 text-center">
          Ở ThreeStar, mỗi nụ cười, mỗi cuộc trò chuyện đều mang trong mình hơi
          ấm và năng lượng tích cực – nơi bạn tìm thấy sự sẻ chia, cảm hứng và
          một chút an yên giữa nhịp sống vội vã.
        </p>
      </div>
      <div className="flex max-lg:flex-col max-lg:text-center max-lg:items-center px-20 max-md:px-4 gap-x-10 pt-10">
        <div className="flex-1 space-y-6">
          <h3 className="text-6xl font-bold">Chuyện "Nhà"</h3>
          <p className="text-xl font-md">
            Three Star tin rằng, giá trị thật nằm ở những khoảnh khắc kết nối.
            Mỗi cuộc gặp gỡ, mỗi câu chuyện được sẻ chia đều là nguồn cảm hứng
            để chúng tôi không ngừng lan toả năng lượng tích cực. Chúng tôi mong
            rằng, Three Star sẽ là nơi mọi người tìm thấy sự gắn kết, niềm vui và
            ý nghĩa trong từng hành trình của mình.
          </p>
        </div>
        <div className="relative shrink-0 flex-1">
          <img
            src="/aboutus-banner1.png"
            className="w-full object-cover max-h-[600px]"
            alt=""
          />
          <div className="absolute top-[10%] left-[6%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/sticker.png"
                alt="sticker"
                className="w-38 max-md:w-16"
              />
            </Parallax>
          </div>
          <div className="absolute bottom-[40%] left-[6%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/slogan-coffee.png"
                alt="sticker"
                className="w-30 max-md:w-16 rounded-2xl object-cover"
              />
            </Parallax>
          </div>
          <div className="absolute top-[40%] right-[6%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/slogan-coffee1.png"
                alt="sticker"
                className="w-25 max-md:w-14 rounded-2xl object-cover"
              />
            </Parallax>
          </div>
          <div className="absolute bottom-[10%] left-[2%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/sticker2-banner1.png"
                alt="sticker"
                className="w-40 max-md:w-16 rounded-2xl object-cover"
              />
            </Parallax>
          </div>
        </div>
      </div>
      <div className="flex max-lg:flex-col max-lg:text-center max-lg:items-center px-20 max-md:px-4 gap-x-10 pt-10">
        <div className="flex-1 space-y-6 lg:hidden">
          <h3 className="text-4xl max-sm:xl font-bold">
            ☕ Nguyên bản từ hành trình của hạt cà phê – chân thật như chính
            “Go”
          </h3>
          <p className="text-xl font-md">
            Three Star tin rằng, giá trị thật nằm ở những khoảnh khắc kết nối.
            Mỗi cuộc gặp gỡ, mỗi câu chuyện được sẻ chia đều là nguồn cảm hứng
            để chúng tôi không ngừng lan toả năng lượng tích cực. Chúng tôi mong
            rằng, Three Star sẽ là nơi mọi người tìm thấy sự gắn kết, niềm vui và
            ý nghĩa trong từng hành trình của mình.
          </p>
        </div>
        <div className="relative shrink-0 flex-1">
          <img
            src="/aboutus-banner2.png"
            className="w-full object-cover"
            alt="cà phê"
          />
          <div className="absolute top-[1%] left-[1%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/sticker-mood.png"
                alt="sticker"
                className="w-50 max-md:w-16"
              />
            </Parallax>
          </div>
          <div className="absolute top-[30%] right-[-4%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/sticker-coffee1.png"
                alt="sticker"
                className="w-12 max-md:w-16 rounded-2xl object-cover"
              />
            </Parallax>
          </div>

          <div className="absolute bottom-[-5%] left-[-4%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/sticker5-banner2.png"
                alt="sticker"
                className="w-40 max-md:w-16 rounded-2xl object-cover"
              />
            </Parallax>
          </div>
          <div className="absolute bottom-[3%] left-[25%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/sticker-coffee.png"
                alt="sticker"
                className="w-10 max-md:w-16 rounded-2xl object-cover"
              />
            </Parallax>
          </div>
        </div>
        <div className="flex-1 space-y-6 max-lg:hidden">
          <h3 className="text-4xl max-sm:xl font-bold">
            ☕ Nguyên bản từ hành trình của hạt cà phê – chân thật như chính
            “Star”
          </h3>
          <p className="text-xl font-md ">
            Three Star tin rằng, giá trị thật nằm ở những khoảnh khắc kết nối.
            Mỗi cuộc gặp gỡ, mỗi câu chuyện được sẻ chia đều là nguồn cảm hứng
            để chúng tôi không ngừng lan toả năng lượng tích cực. Chúng tôi mong
            rằng, Three Star sẽ là nơi mọi người tìm thấy sự gắn kết, niềm vui và
            ý nghĩa trong từng hành trình của mình.
          </p>
        </div>
      </div>
      <div className="flex max-lg:flex-col max-lg:text-center max-lg:items-center px-20 max-md:px-4 gap-x-10 pt-10">
        <div className="flex-1 space-y-6">
          <h3 className="text-4xl max-sm:xl font-bold">
            🍃 Chân thật từ đồi trà – thanh mát như nhịp sống an nhiên
          </h3>
          <p className="text-xl font-md">
            Giữa những đồi trà xanh ngát, nơi sương sớm quyện cùng hương đất
            trời, Three Star tìm thấy nguồn cảm hứng cho hành trình của mình. Mỗi
            búp trà đều được hái bằng đôi tay tận tâm, giữ trọn hương vị tự
            nhiên và tinh khiết nhất từ núi đồi. Với Three Star, chất lượng không
            chỉ nằm ở lá trà được chọn lọc, mà còn ở khoảnh khắc bình yên mà
            tách trà mang lại — khi hương vị thanh mát ấy khiến bạn chậm lại,
            hít sâu, và mỉm cười nhẹ nhàng giữa guồng quay cuộc sống. Bởi chúng
            tôi tin rằng, mỗi tách trà ngon là một khoảng dừng đẹp — nơi con
            người tìm lại sự cân bằng, và niềm vui giản dị được ủ trong từng
            ngụm trà thanh.
          </p>
        </div>
        <div className="relative shrink-0 flex-1">
          <img
            src="/aboutus-banner3.png"
            className="w-full object-cover"
            alt="cà phê"
          />
          <div className="absolute top-[1%] left-[1%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/sticker1-banner3.png"
                alt="sticker"
                className="w-30 max-md:w-16"
              />
            </Parallax>
          </div>
          <div className="absolute top-[1%] right-[-4%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/sticker3-banner3.png"
                alt="sticker"
                className="w-40 max-md:w-16 rounded-2xl object-cover"
              />
            </Parallax>
          </div>

          <div className="absolute bottom-[1%] left-[-4%] z-[20]">
            <Parallax speed={10}>
              <img
                src="/sticker2-banner3.png"
                alt="sticker"
                className="w-40 max-md:w-16 rounded-2xl object-cover"
              />
            </Parallax>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMePage;
