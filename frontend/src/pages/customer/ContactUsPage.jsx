import Header from "../../components/customer/Header";

const ContactUsPage = () => {
    return (
        <div>
            <Header activePage={"contact"} />

            <div className="w-7xl mx-auto mt-20 flex gap-5">
                <div className="flex-3">
                    <h1 className="text-2xl mb-2 font-bold text-white">Đóng góp ý kiến</h1>
                    <p className="text-white italic">Quý khách sẽ nhận được phản hồi trong vòng 24 giờ!</p>
                    <form action="">
                        <div className="w-12 h-1 my-5 bg-red-400 rounded"></div>
                        <div className="flex flex-col gap-5">
                            <input type="text" placeholder="Họ và tên" className="p-3 rounded-lg bg-gray-800 text-white focus:outline-none" />
                            <input type="email" placeholder="Email" className="p-3 rounded-lg bg-gray-800 text-white focus:outline-none" />
                            <textarea placeholder="Nội dung góp ý" className="p-3 rounded-lg bg-gray-800 text-white focus:outline-none h-50 resize-none"></textarea>
                            <button type="submit" className="bg-red-400 text-white py-3 rounded-lg cursor-pointer hover:bg-red-500 transition-colors">Gửi góp ý</button>
                        </div>
                    </form>
                </div>

                <div className="flex-2 flex flex-col text-white">
                    <div className="mb-5">
                        <h1 className="text-2xl mb-2 font-bold text-white">Thông tin liên hệ</h1>
                        <p className="text-white italic">Liên hệ với chúng tôi qua các kênh chính thức</p>
                        <div className="w-12 h-1 my-5 bg-red-400 rounded"></div>
                        <div className="space-y-2">
                            <p><i class="fa-solid fa-phone"></i> 0901.033.999 - 02923.731.620</p>
                            <p><i class="fa-solid fa-envelope"></i> cadaorestaurant@gmail.com</p>
                            <p
                                className="hover:underline cursor-pointer"
                                onClick={() => window.open("https://www.facebook.com/CADAORestaurantCoffee", "_blank")}
                            >
                                <i class="fa-brands fa-facebook"></i> CA DAO Restaurant & Café
                            </p>
                        </div>
                    </div>
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d245.55005732333564!2d105.7798902719566!3d10.033280895393727!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a089cffcb732bd%3A0x9245b6f9082bc25f!2sCA%20DAO%20Restaurant%20%26%20Caf%C3%A9!5e0!3m2!1svi!2s!4v1773410182422!5m2!1svi!2s"
                        className="rounded-lg w-full flex-1"
                    >
                    </iframe>
                </div>
            </div>
        </div>
    );
}

export default ContactUsPage