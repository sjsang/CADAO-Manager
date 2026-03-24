import { useEffect } from "react";
import AOS from "aos";
import Header from "../../components/customer/Header";
import Footer from "../../components/customer/Footer";

const AboutUsPage = () => {
    useEffect(() => {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: false, offset: 80 });
    }, []);

    return (
        <>
            <Header activePage={"about"} />

            <div className="w-7xl mx-auto py-20 text-white">

                <div data-aos="fade-up" className="text-center mb-16">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Hơn 20 năm hương vị Việt</p>
                    <h1 className="text-5xl font-bold mb-5">Câu chuyện Ca Dao</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
                    <div data-aos="fade-right" className="flex flex-col gap-6">
                        <p className="text-lg text-gray-300 leading-relaxed italic">
                            Hơn 20 năm qua, Ca Dao đã trở thành điểm đến thân thuộc của biết bao thực khách — nơi ẩm thực
                            không chỉ là trải nghiệm vị giác, mà còn là sự gắn kết giữa các thế hệ và những giá trị xưa cũ.
                        </p>
                        <p className="text-gray-400 leading-relaxed">
                            Dù là bữa cơm gia đình hay buổi gặp gỡ đối tác, dù là thực khách địa phương hay du khách quốc tế,
                            ai đến với Ca Dao cũng có thể cảm nhận được cái hồn sông nước và nghĩa tình mộc mạc chan chứa
                            trong từng món ăn — như một cách kể chuyện chân thành, thấm đẫm hương vị miền Tây.
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            {[
                                { num: "20+", label: "Năm hoạt động" },
                                { num: "50+", label: "Món ăn" },
                                { num: "4.4★", label: "Đánh giá trung bình" },
                            ].map(stat => (
                                <div key={stat.label} className="text-center p-4 border border-white/10 rounded-xl bg-black/30">
                                    <p className="text-2xl font-bold text-[#e4c590]">{stat.num}</p>
                                    <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div data-aos="fade-left">
                        <img src="/about_us.jpg" alt="Toàn cảnh Ca Dao" className="w-full h-auto rounded-2xl border border-white/10 shadow-2xl shadow-black/60" />
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default AboutUsPage