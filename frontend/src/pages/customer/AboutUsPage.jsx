import Header from "../../components/customer/Header";
import Footer from "../../components/customer/Footer";

const AboutUsPage = () => {
    return (
        <div>
            <Header activePage={"about"} />

            <div className="w-4xl mx-auto mt-20">
                <h1 className="text-2xl font-bold text-white">Câu chuyện Ca Dao</h1>
                <div className="w-12 h-1 my-5 bg-red-400 rounded"></div>
                <div className="text-lg text-justify italic text-white">
                    Hơn 20 năm qua, Ca Dao đã trở thành điểm đến thân thuộc của biết bao thực khách - nơi ẩm thực không chỉ là trải nghiệm vị giác,
                    mà còn là sự gắn kết giữa các thế hệ và những giá trị xưa cũ. Dù là bữa cơm gia đình hay buổi gặp gỡ đối tác,
                    dù là thực khách địa phương hay du khách quốc tế, ai đến với Ca Dao cũng có thể cảm nhận được cái hồn sông nước
                    và nghĩa tình mộc mạc chan chứa trong từng món ăn - như một cách kể chuyện chân thành, thấm đẫm hương vị miền Tây.
                </div>

                <img src="/about_us.jpg" alt="Toàn cảnh Ca Dao" className="w-full h-auto mt-5 rounded-2xl" />
            </div>

            <Footer />
        </div>
    );
}

export default AboutUsPage