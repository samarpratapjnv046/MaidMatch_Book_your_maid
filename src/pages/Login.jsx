import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../App'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [rateLimitError, setRateLimitError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
    setRateLimitError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    
    const result = await login(formData.email, formData.password)
    
    setLoading(false)
    
    if (result.success) {
      // Get user from localStorage (set by login function)
      const userData = JSON.parse(localStorage.getItem('maidmatch_user') || '{}')
      // Redirect based on role
      if (userData.role === 'admin') {
        navigate('/admin/dashboard')
      } else if (userData.role === 'worker') {
        navigate('/worker/dashboard')
      } else {
        navigate('/dashboard')
      }
    } else {
      setErrors({ password: result.error })
    }
  }

  // Demo login shortcuts
  const handleDemoLogin = async (type) => {
    setLoading(true)
    
    // Use the login function from context
    const email = type === 'customer' ? 'customer@demo.com' : 'worker@demo.com'
    const password = 'demo123'
    
    const result = await login(email, password)
    
    if (result.success) {
      // Redirect based on role
      if (type === 'worker') {
        navigate('/worker/dashboard')
      } else {
        navigate('/dashboard')
      }
    } else {
      // If API fails, use local demo mode
      const demoUser = {
        id: Date.now(),
        name: type === 'customer' ? 'Demo Customer' : 'Demo Worker',
        email: email,
        role: type
      }
      // Store in localStorage
      localStorage.setItem('maidmatch_user', JSON.stringify(demoUser))
      // Redirect based on role
      if (type === 'worker') {
        navigate('/worker/dashboard')
      } else {
        navigate('/dashboard')
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Welcome Back
          </h1>
          <p className="text-text-secondary">
            Sign in to access your account
          </p>
        </div>

        <div className="bg-white rounded-card shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {rateLimitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {rateLimitError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-3 border rounded-input focus:outline-none ${
                    errors.email ? 'border-accent' : 'border-border focus:border-primary'
                  }`}
                />
              </div>
              {errors.email && <p className="text-accent text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 border rounded-input focus:outline-none ${
                    errors.password ? 'border-accent' : 'border-border focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-accent text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-text-secondary">Or try demo</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDemoLogin('customer')}
                disabled={loading}
                className="py-2.5 border border-border rounded-btn text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Demo as Customer
              </button>
              <button
                onClick={() => handleDemoLogin('worker')}
                disabled={loading}
                className="py-2.5 border border-border rounded-btn text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Demo as Worker
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
