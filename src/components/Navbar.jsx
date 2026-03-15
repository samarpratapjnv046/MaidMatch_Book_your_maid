import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Home, Search, UserPlus, LogIn, User, LogOut } from 'lucide-react'
import { useAuth } from '../App'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold text-primary">MaidMatch</span>
          </Link>

          {/* Desktop Navigation - Show role-based links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-text-secondary hover:text-primary transition-colors font-medium">
              Home
            </Link>
            {/* Only show Find Help and Become a Helper for customers or non-logged-in users */}
            {!user && (
              <>
                <Link to="/search" className="text-text-secondary hover:text-primary transition-colors font-medium">
                  Find Help
                </Link>
                <Link to="/register" className="text-text-secondary hover:text-primary transition-colors font-medium">
                  Become a Helper
                </Link>
              </>
            )}
            {/* Show customer dashboard link for regular users */}
            {user && user.role === 'customer' && (
              <Link to="/search" className="text-text-secondary hover:text-primary transition-colors font-medium">
                Find Help
              </Link>
            )}
          </div>

          {/* Auth Buttons - Show role-based dashboard link */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Show correct dashboard based on user role */}
                <Link 
                  to={user.role === 'worker' ? '/worker/dashboard' : '/dashboard'} 
                  className="flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-accent hover:bg-red-50 rounded-btn transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 text-primary hover:bg-green-50 rounded-btn transition-colors font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-2 px-5 py-2.5 bg-primary text-white rounded-btn hover:bg-green-700 transition-all hover:shadow-lg font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Show role-based links */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-border animate-fadeIn">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5 text-primary" />
              <span className="font-medium">Home</span>
            </Link>
            
            {/* Show mobile menu items based on user role */}
            {!user && (
              <>
                <Link
                  to="/search"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Search className="w-5 h-5 text-primary" />
                  <span className="font-medium">Find Help</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span className="font-medium">Become a Helper</span>
                </Link>
              </>
            )}
            
            {user && user.role === 'customer' && (
              <Link
                to="/search"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Search className="w-5 h-5 text-primary" />
                <span className="font-medium">Find Help</span>
              </Link>
            )}
            
            {user ? (
              <>
                {/* Show correct dashboard link based on role */}
                <Link
                  to={user.role === 'worker' ? '/worker/dashboard' : '/dashboard'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <User className="w-5 h-5 text-primary" />
                  <span className="font-medium">{user.role === 'worker' ? 'Worker Dashboard' : 'Dashboard'}</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg hover:bg-red-50 transition-colors text-accent"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-3 border-t border-border">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 w-full border border-primary text-primary rounded-btn hover:bg-green-50 transition-colors font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 w-full bg-primary text-white rounded-btn hover:bg-green-700 transition-colors font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
