import { useEffect } from "react";
import AOS from "aos";
import Header from "../../components/customer/Header";
import Footer from "../../components/customer/Footer";

const ContactUsPage = () => {
    useEffect(() => {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: false, offset: 80 });
    }, []);

    return (
        <>
            <Header activePage={"contact"} />

            <div className="w-7xl mx-auto py-10 text-white">

                <div data-aos="fade-up" className="text-center mb-16">
                    <p className="text-xs tracking-[0.3em] text-[#e4c590] uppercase mb-3">Chúng tôi luôn sẵn sàng lắng nghe</p>
                    <h1 className="text-5xl font-bold mb-5">Liên hệ với chúng tôi</h1>
                    <div className="w-12 h-px bg-[#e4c590]/60 mx-auto" />
                </div>

                <div className="grid lg:grid-cols-5 gap-10 items-start">

                    <div data-aos="fade-right" className="lg:col-span-3 flex flex-col gap-5">
                        <h2 className="text-xl font-semibold">Đóng góp ý kiến</h2>
                        <p className="text-gray-400 text-sm">Quý khách sẽ nhận được phản hồi trong vòng 24 giờ!</p>
                        <form className="flex flex-col gap-5">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs tracking-widest text-gray-400 uppercase">Họ và tên</span>
                                <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                    <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Nguyễn Văn A"
                                        className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                                    />
                                </div>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs tracking-widest text-gray-400 uppercase">Email</span>
                                <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                    <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                    <input
                                        type="email"
                                        placeholder="example@email.com"
                                        className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                                    />
                                </div>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs tracking-widest text-gray-400 uppercase">Nội dung góp ý</span>
                                <div className="flex items-start gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus-within:border-[#e4c590] transition-colors">
                                    <svg className="w-4 h-4 text-[#e4c590]/60 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <textarea
                                        placeholder="Chia sẻ trải nghiệm của bạn..."
                                        rows={5}
                                        className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none resize-none text-sm"
                                    />
                                </div>
                            </label>
                            <button
                                type="submit"
                                className="group relative overflow-hidden w-fit px-8 py-3 border border-[#e4c590] text-[#e4c590] cursor-pointer"
                            >
                                <span className="absolute inset-0 bg-[#e4c590] origin-left scale-x-0 transition-transform duration-500 ease-in-out group-hover:scale-x-100" />
                                <span className="relative z-10 text-sm font-bold tracking-widest transition-colors duration-500 group-hover:text-black">GỬI GÓP Ý</span>
                            </button>
                        </form>
                    </div>

                    <div data-aos="fade-left" className="lg:col-span-2 flex flex-col gap-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Thông tin liên hệ</h2>
                            <div className="flex flex-col gap-3 text-gray-300">
                                <div className="flex items-start gap-3">
                                    <span className="text-[#e4c590] mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" /></svg>
                                    </span>
                                    <span>0901.033.999 &mdash; 02923.731.620</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#e4c590] mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </span>
                                    <span>cadaorestaurant@gmail.com</span>
                                </div>
                                <div
                                    className="flex items-start gap-3 cursor-pointer hover:text-[#e4c590] transition-colors"
                                    onClick={() => window.open("https://www.facebook.com/CADAORestaurantCoffee", "_blank")}
                                >
                                    <span className="text-[#e4c590] mt-0.5">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                                    </span>
                                    <span>CA DAO Restaurant &amp; Café</span>
                                </div>
                            </div>
                        </div>

                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d245.55005732333564!2d105.7798902719566!3d10.033280895393727!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a089cffcb732bd%3A0x9245b6f9082bc25f!2sCA%20DAO%20Restaurant%20%26%20Caf%C3%A9!5e0!3m2!1svi!2s!4v1773410182422!5m2!1svi!2s"
                            className="w-full h-64 rounded-xl border border-white/10"
                            allowFullScreen
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default ContactUsPage