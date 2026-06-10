import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchCart } from '../services/api'
import CartLink from './header/CartLink'
import DesktopNav from './header/DesktopNav'
import MobileHeader from './header/MobileHeader'
import MobileMenu from './header/MobileMenu'
import UserMenu from './header/UserMenu'

function getCartTotalQuantity(cart) {
  return cart?.totalQuantity ?? cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
}

function Header() {
  const { isAuthenticated, token, user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    let isMounted = true

    const loadCartCount = async () => {
      if (!isAuthenticated || !token) {
        if (isMounted) setCartCount(0)
        return
      }

      try {
        const data = await fetchCart(token)
        if (isMounted) setCartCount(getCartTotalQuantity(data.cart))
      } catch {
        if (isMounted) setCartCount(0)
      }
    }

    loadCartCount()

    window.addEventListener('cart:updated', loadCartCount)

    return () => {
      isMounted = false
      window.removeEventListener('cart:updated', loadCartCount)
    }
  }, [isAuthenticated, token])

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
    setIsMobileMenuOpen(false)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="header">
      <MobileHeader onMenuOpen={() => setIsMobileMenuOpen(true)} />

      <div className="header-inner">
        {isAdmin && (
          <Link to="/admin" className="admin-nav-link">
            어드민 페이지
          </Link>
        )}
        <div className="header-actions">
          <DesktopNav />
          <CartLink count={cartCount} />
          <UserMenu
            isAuthenticated={isAuthenticated}
            user={user}
            isOpen={isMenuOpen}
            onToggle={() => setIsMenuOpen((open) => !open)}
            onLogout={handleLogout}
          />
        </div>
      </div>
      <div className="header-logo-row">
        <Link to="/" className="logo-link">
          <h1 className="logo">DRVT Mall</h1>
        </Link>
      </div>

      {isMobileMenuOpen && (
        <MobileMenu
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          cartCount={cartCount}
          user={user}
          onClose={closeMobileMenu}
          onLogout={handleLogout}
        />
      )}
    </header>
  )
}

export default Header
