import { useEffect, useState } from "react";
import AOS from "aos";
import Header from "../../components/customer/Header";
import Footer from "../../components/customer/Footer";

const slides = ["/slide1.jpg", "/slide2.jpg", "/slide3.jpg", "/slide4.jpg"];

const AboutUsPage = () => {
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: false, offset: 80 });
    }, []);

    return (
        <>
            <Header activePage={"about"} />

            <div className="w-7xl mx-auto py-10 text-white">

                <div data-aos="fade-up" className="text-center mb-16">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Hơn 20 năm hương vị Việt</p>
                    <h1 className="text-5xl font-bold mb-5">Câu chuyện Ca Dao</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                <div className="grid lg:grid-cols-2 gap-16 mb-20">
                    <div data-aos="fade-right" className="flex flex-col gap-6">
                        <p className="text-xl text-gray-300 leading-relaxed italic">
                            Hơn 20 năm qua, Ca Dao đã trở thành điểm đến thân thuộc của biết bao thực khách — nơi ẩm thực
                            không chỉ là trải nghiệm vị giác, mà còn là sự gắn kết giữa các thế hệ và những giá trị xưa cũ.
                        </p>
                        <p className="text-lg text-gray-400 leading-relaxed">
                            Dù là bữa cơm gia đình hay buổi gặp gỡ đối tác, dù là thực khách địa phương hay du khách quốc tế,
                            ai đến với Ca Dao cũng có thể cảm nhận được cái hồn sông nước và nghĩa tình mộc mạc chan chứa
                            trong từng món ăn — như một cách kể chuyện chân thành, thấm đẫm hương vị miền Tây.
                        </p>
                    </div>

                    <div data-aos="fade-left" className="flex flex-col gap-3">
                        <div className="overflow-hidden rounded-2xl aspect-video bg-black/40">
                            <img
                                key={activeSlide}
                                src={slides[activeSlide]}
                                alt={`Slide ${activeSlide + 1}`}
                                className="w-full h-full object-cover transition-opacity duration-500 animate-fade-in"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {slides.map((src, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveSlide(idx)}
                                    className={`overflow-hidden rounded-lg aspect-video border-2 transition-all duration-200 ${idx === activeSlide
                                        ? "border-[#e4c590] opacity-100 scale-105"
                                        : "border-transparent opacity-50 hover:opacity-75"
                                        }`}
                                >
                                    <img src={src} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default AboutUsPage