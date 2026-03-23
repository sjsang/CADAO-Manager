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
import CustomerDetail from './pages/admin/CustomerDetail'
import StaffManager from './pages/admin/StaffManager'
import StaffDetail from './pages/admin/StaffDetail'
import StaffProfile from './pages/admin/StaffProfile'
import WardManager from './pages/admin/WardManager'
import VoucherManager from './pages/admin/VoucherManager'
import ReviewManager from './pages/admin/ReviewManager'
import ShipperDeliveries from './pages/shipper/ShipperDeliveries'

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

const hasPortalAccess = () => {
  const payload = getTokenPayload();
  return payload?.role === 'admin' || payload?.role === 'staff' || payload?.role === 'shipper';
};

const isAdminAuthenticated = () => {
  const payload = getTokenPayload();
  return payload?.role === 'admin';
};

const canManageOrders = () => {
  const payload = getTokenPayload();
  return payload?.role === 'admin' || payload?.role === 'staff';
};

const isShipper = () => {
  const payload = getTokenPayload();
  return payload?.role === 'shipper';
};

const isStaff = () => {
  const payload = getTokenPayload();
  return payload?.role === 'staff';
};

const AdminRoute = ({ children }) => {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const OrderManagerRoute = ({ children }) => {
  if (!canManageOrders()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const ShipperRoute = ({ children }) => {
  if (!isShipper()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const StaffRoute = ({ children }) => {
  if (!hasPortalAccess()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const AdminLoginRoute = () => {
  const payload = getTokenPayload();

  if (hasPortalAccess()) {
    if (payload?.role === 'staff') {
      return <Navigate to="/admin/orders" replace />;
    }
    if (payload?.role === 'shipper') {
      return <Navigate to="/shipper/deliveries" replace />;
    }

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
      <Route path="/admin/orders" element={<OrderManagerRoute><OrderManager /></OrderManagerRoute>} />
      <Route path="/admin/orders/:orderCode" element={<OrderManagerRoute><AdminOrderDetail /></OrderManagerRoute>} />
      <Route path="/admin/menus" element={<AdminRoute><MenuManager /></AdminRoute>} />
      <Route path="/admin/menus/add" element={<AdminRoute><MenuCreate /></AdminRoute>} />
      <Route path="/admin/menus/:id" element={<AdminRoute><MenuDetail /></AdminRoute>} />
      <Route path="/admin/customers" element={<AdminRoute><CustomerManager /></AdminRoute>} />
      <Route path="/admin/customers/:id" element={<AdminRoute><CustomerDetail /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><StaffManager /></AdminRoute>} />
      <Route path="/admin/users/:id" element={<AdminRoute><StaffDetail /></AdminRoute>} />
      <Route path="/admin/profile" element={<StaffRoute><StaffProfile /></StaffRoute>} />
      <Route path="/profile" element={<StaffRoute><StaffProfile /></StaffRoute>} />
      <Route path="/admin/wards" element={<AdminRoute><WardManager /></AdminRoute>} />
      <Route path="/admin/vouchers" element={<AdminRoute><VoucherManager /></AdminRoute>} />
      <Route path="/admin/reviews" element={<AdminRoute><ReviewManager /></AdminRoute>} />
      <Route path="/shipper/deliveries" element={<ShipperRoute><ShipperDeliveries /></ShipperRoute>} />
    </Routes>
  );
}

export default App