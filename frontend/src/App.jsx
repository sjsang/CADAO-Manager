import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/customer/HomePage'
import MenuPage from './pages/customer/MenuPage'
import AboutUsPage from './pages/customer/AboutUsPage'
import ContactUsPage from './pages/customer/ContactUsPage'
import CartPage from './pages/customer/CartPage'
import CustomerRegis from './pages/auth/CustomerRegis'
import CustomerLogin from './pages/auth/CustomerLogin'
import CheckoutPage from './pages/customer/CheckoutPage'
import ProfilePage from './pages/customer/ProfilePage'
import OrderDetailPage from './pages/customer/OrderDetailPage'

import AdminLogin from './pages/auth/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import OrderManager from './pages/admin/OrderManager'
import MenuManager from './pages/admin/MenuManager'
import CustomerManager from './pages/admin/CustomerManager'
import StaffManager from './pages/admin/StaffManager'

const App = () => {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/about" element={<AboutUsPage />} />
      <Route path="/contact" element={<ContactUsPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout/:orderCode" element={<CheckoutPage />} />
      <Route path="/orders/:orderCode" element={<OrderDetailPage />} />

      <Route path="/register" element={<CustomerRegis />} />
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/orders" element={<OrderManager />} />
      <Route path="/admin/menu" element={<MenuManager />} />
      <Route path="/admin/customers" element={<CustomerManager />} />
      <Route path="/admin/staff" element={<StaffManager />} />
    </Routes>
  );
}

export default App