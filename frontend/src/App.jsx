import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/customer/HomePage'
import MenuPage from './pages/customer/MenuPage'
import AboutUsPage from './pages/customer/AboutUsPage'
import ContactUsPage from './pages/customer/ContactUsPage'
import CartPage from './pages/customer/CartPage'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/about" element={<AboutUsPage />} />
      <Route path="/contact" element={<ContactUsPage />} />
      <Route path="/cart" element={<CartPage />} />
    </Routes>
  );
}

export default App