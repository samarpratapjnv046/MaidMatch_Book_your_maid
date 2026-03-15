import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
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
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitError(data.error)
        } else {
          setErrors({ password: data.error })
        }
        setLoading(false)
        return
      }

      // Store admin data
      localStorage.setItem('maidmatch_token', data.token)
      localStorage.setItem('maidmatch_user', JSON.stringify(data.user))
      
      setLoading(false)
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Admin login error:', error)
      setErrors({ password: 'Server error. Please try again.' })
      setLoading(false)
    }
  }

  return (
    <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Admin Portal
          </h1>
          <p className="text-text-secondary">
            Sign in to access the admin dashboard
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
              <label className="block text-sm font-medium mb-2">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter admin email"
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
                  placeholder="Enter password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-text-secondary">
            <Link to="/login" className="text-primary font-medium hover:underline">
              Back to User Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
