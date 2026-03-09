import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/customer/HomePage'
import MenuPage from './pages/customer/MenuPage'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
    </Routes>
  );
}

export default App