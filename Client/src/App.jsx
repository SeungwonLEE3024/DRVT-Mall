import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import Header from './components/Header'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import AdminPage from './pages/AdminPage'
import ProductListPage from './pages/ProductListPage'
import ProductCreatePage from './pages/ProductCreatePage'
import ProductDetailPage from './pages/ProductDetailPage'
import OrderManagementPage from './pages/OrderManagementPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import MyPage from './pages/MyPage'
import './App.css'

function AppContent() {
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <div className="app">
      {!isAdminPage && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/auth"
          element={
            <>
              <Home />
              <AuthPage />
            </>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <ProductListPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <AdminRoute>
              <ProductCreatePage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/:productId/edit"
          element={
            <AdminRoute>
              <ProductCreatePage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <OrderManagementPage />
            </AdminRoute>
          }
        />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
