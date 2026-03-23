import { RESTAURANT_FOOTER_TEXT } from "../../constants/restaurantInfo";

const Footer = () => {
    return (
        <footer className="w-full py-5 text-center text-gray-400 text-sm">
            <p>{RESTAURANT_FOOTER_TEXT}</p>
        </footer>
    );
}

export default Footer;