import { Navigate, Route, Routes } from 'react-router-dom'
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
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import MenuManager from './pages/admin/MenuManager'
import MenuCreate from './pages/admin/MenuCreate'
import MenuDetail from './pages/admin/MenuDetail'
import CustomerManager from './pages/admin/CustomerManager'
import StaffManager from './pages/admin/StaffManager'

const getTokenPayload = () => {
  const token = sessionStorage.getItem('token');

  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const isAdminAuthenticated = () => {
  const payload = getTokenPayload();
  return payload?.role === 'admin';
};

const AdminRoute = ({ children }) => {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const AdminLoginRoute = () => {
  if (isAdminAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <AdminLogin />;
};

const App = () => {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/menus" element={<MenuPage />} />
      <Route path="/about" element={<AboutUsPage />} />
      <Route path="/contact" element={<ContactUsPage />} />
      <Route path="/cart-items" element={<CartPage />} />
      <Route path="/orders/:orderCode/checkout" element={<CheckoutPage />} />
      <Route path="/orders/:orderCode" element={<OrderDetailPage />} />

      <Route path="/auth/register" element={<CustomerRegis />} />
      <Route path="/auth/login" element={<CustomerLogin />} />
      <Route path="/customers/me" element={<ProfilePage />} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginRoute />} />
      <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><OrderManager /></AdminRoute>} />
      <Route path="/admin/orders/:orderCode" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
      <Route path="/admin/menus" element={<AdminRoute><MenuManager /></AdminRoute>} />
      <Route path="/admin/menus/add" element={<AdminRoute><MenuCreate /></AdminRoute>} />
      <Route path="/admin/menus/:id" element={<AdminRoute><MenuDetail /></AdminRoute>} />
      <Route path="/admin/customers" element={<AdminRoute><CustomerManager /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><StaffManager /></AdminRoute>} />
    </Routes>
  );
}

export default App