import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { 
  User, MapPin, Calendar, DollarSign, Star, Clock, CheckCircle, XCircle, 
  Edit, Camera, Phone, Mail, Briefcase, Shield, ChevronLeft, ChevronRight,
  TrendingUp, Award, MessageSquare, Settings, LogOut, Bell, Menu
} from 'lucide-react'
import { useAuth } from '../App'
import FileUpload from '../components/FileUpload'

export default function WorkerDashboard() {
  const navigate = useNavigate()
  const { user, logout, token, showToast } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    photo: '',
    hourlyRate: '',
    dailyRate: '',
    monthlyRate: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bio: '',
    services: [],
    availability: {
      monday: false, tuesday: false, wednesday: false, 
      thursday: false, friday: false, saturday: false, sunday: false
    }
  })
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0 })
  const [verifyingOtp, setVerifyingOtp] = useState(null)
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState('')

  const API_URL = 'http://localhost:3001/api'

  // Fetch worker profile from API
  const fetchWorkerProfile = async () => {
    const storedToken = localStorage.getItem('maidmatch_token')
    const storedUser = localStorage.getItem('maidmatch_user')
    
    if (!storedToken || !storedUser) return
    
    try {
      const parsedUser = JSON.parse(storedUser)
      
      // Try to fetch from API first
      const response = await fetch(`${API_URL}/workers/${parsedUser.id}`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Update localStorage with fresh data from API
        const updatedUser = {
          ...parsedUser,
          name: data.name,
          phone: data.phone,
          photo: data.photo,
          hourly_rate: data.hourly_rate,
          daily_rate: data.daily_rate,
          monthly_rate: data.monthly_rate,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          bio: data.bio,
          services: data.services,
          availability: data.availability
        }
        localStorage.setItem('maidmatch_user', JSON.stringify(updatedUser))
        
        setProfileData({
          name: data.name || '',
          phone: data.phone || '',
          photo: data.photo || '',
          hourlyRate: data.hourly_rate || '',
          dailyRate: data.daily_rate || '',
          monthlyRate: data.monthly_rate || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          bio: data.bio || '',
          services: data.services || [],
          availability: data.availability || {
            monday: false, tuesday: false, wednesday: false, 
            thursday: false, friday: false, saturday: false, sunday: false
          }
        })
      }
    } catch (error) {
      console.error('Error fetching worker profile:', error)
    }
  }

  // Fetch worker bookings
  const fetchWorkerBookings = async () => {
    const storedToken = localStorage.getItem('maidmatch_token')
    
    if (!storedToken) return
    
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkerProfile()
    fetchWorkerBookings()
    fetchWallet()
  }, [])

  const fetchWallet = async () => {
    const storedToken = localStorage.getItem('maidmatch_token')
    if (!storedToken) return
    
    try {
      const response = await fetch(`${API_URL}/wallet`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
      if (response.ok) {
        const data = await response.json()
        setWallet(data)
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    }
  }

  const handleBookingResponse = async (bookingId, action) => {
    const storedToken = localStorage.getItem('maidmatch_token')
    if (!storedToken) return

    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
        body: JSON.stringify({ action })
      })

      const data = await response.json()

      if (response.ok) {
        showToast(data.message, 'success')
        fetchWorkerBookings()
      } else {
        showToast(data.error || 'Failed to respond', 'error')
      }
    } catch (error) {
      console.error('Booking response error:', error)
      showToast('Failed to respond to booking', 'error')
    }
  }

  const handleVerifyOtp = async (bookingId) => {
    if (!otpInput || otpInput.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP')
      return
    }

    setVerifyingOtp(bookingId)
    setOtpError('')

    const storedToken = localStorage.getItem('maidmatch_token')
    if (!storedToken) {
      setVerifyingOtp(null)
      return
    }

    try {
      const response = await fetch(`${API_URL}/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
        body: JSON.stringify({ booking_id: bookingId, otp: otpInput })
      })

      const data = await response.json()

      if (response.ok) {
        showToast(`Job completed! ₹${data.payout_amount} added to wallet`, 'success')
        setOtpInput('')
        fetchWorkerBookings()
        fetchWallet()
      } else {
        setOtpError(data.error || 'Failed to verify OTP')
        showToast(data.error || 'Failed to verify OTP', 'error')
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      setOtpError('Failed to verify OTP')
      showToast('Failed to verify OTP', 'error')
    } finally {
      setVerifyingOtp(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'offer_pending': return 'bg-orange-100 text-orange-700'
      case 'accepted': return 'bg-green-100 text-green-700'
      case 'paid': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-purple-100 text-purple-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'cancelled': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'offer_pending': return 'New Request'
      case 'accepted': return 'Accepted'
      case 'paid': return 'Paid'
      case 'completed': return 'Completed'
      case 'rejected': return 'Rejected'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  // Dashboard View
  const DashboardView = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Total Jobs</p>
          <p className="text-3xl font-bold text-gray-800">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Pending</p>
          <p className="text-3xl font-bold text-gray-800">
            {bookings.filter(b => b.status === 'pending' || b.status === 'offer_pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Completed</p>
          <p className="text-3xl font-bold text-gray-800">
            {bookings.filter(b => b.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Wallet Balance</p>
          <p className="text-3xl font-bold text-green-600">₹{wallet.balance || 0}</p>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Jobs</h2>
        <div className="space-y-4">
          {bookings.slice(0, 5).map((booking) => (
            <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{booking.user_name}</p>
                  <p className="text-sm text-gray-500">{booking.service_type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">₹{booking.worker_payout_amount}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                  {getStatusLabel(booking.status)}
                </span>
              </div>
            </div>
          ))}
          {bookings.length === 0 && (
            <p className="text-center text-gray-500 py-8">No bookings yet</p>
          )}
        </div>
      </div>
    </div>
  )

  // Bookings View
  const BookingsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Requests</h3>
        <div className="space-y-4">
          {bookings.filter(b => b.status === 'pending' || b.status === 'offer_pending').map((booking) => (
            <div key={booking._id} className="border border-orange-200 bg-orange-50 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{booking.user_name}</h4>
                  <p className="text-sm text-gray-500">{booking.service_type}</p>
                </div>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  New Request
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{booking.date}</p>
                </div>
                <div>
                  <p className="text-gray-500">Your Earnings</p>
                  <p className="font-semibold text-green-600">₹{booking.worker_payout_amount}</p>
                </div>
              </div>
              {booking.notes && (
                <p className="text-sm text-gray-600 mb-4 bg-white p-2 rounded-lg">
                  Note: {booking.notes}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => handleBookingResponse(booking._id, 'accept')} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Accept
                </button>
                <button onClick={() => handleBookingResponse(booking._id, 'reject')} className="flex-1 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  Reject
                </button>
              </div>
            </div>
          ))}
          {bookings.filter(b => b.status === 'pending' || b.status === 'offer_pending').length === 0 && (
            <p className="text-center text-gray-500 py-8">No new requests</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">All Bookings</h3>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">{booking.user_name}</p>
                <p className="text-sm text-gray-500">{booking.date} • {booking.service_type}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">₹{booking.worker_payout_amount}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                  {getStatusLabel(booking.status)}
                </span>
              </div>
            </div>
          ))}
          {bookings.length === 0 && (
            <p className="text-center text-gray-500 py-8">No bookings yet</p>
          )}
        </div>
      </div>
    </div>
  )

  // Profile View
  const ProfileView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <button
            onClick={() => setEditingProfile(!editingProfile)}
            className="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-500 rounded-lg hover:bg-green-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            {editingProfile ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="flex items-start gap-8 mb-8">
          <div className="relative">
            <img
              src={profileData.photo || `https://ui-avatars.com/api/?name=${profileData.name}&background=22c55e&color=fff`}
              alt={profileData.name}
              className="w-32 h-32 rounded-2xl object-cover"
            />
            {editingProfile && (
              <button className="absolute bottom-0 right-0 p-2 bg-green-500 text-white rounded-full">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-800">{profileData.name}</h3>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{profileData.phone || 'Add phone'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{profileData.city || 'Add city'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-sm">Hourly Rate</p>
            <p className="text-2xl font-bold text-green-600">₹{profileData.hourlyRate || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-sm">Daily Rate</p>
            <p className="text-2xl font-bold text-green-600">₹{profileData.dailyRate || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-sm">Monthly Rate</p>
            <p className="text-2xl font-bold text-green-600">₹{profileData.monthlyRate || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )

  // History View
  const HistoryView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Job History</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="space-y-4">
          {bookings.filter(b => b.status === 'completed').map((booking) => (
            <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">{booking.user_name}</p>
                <p className="text-sm text-gray-500">{booking.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">₹{booking.worker_payout_amount}</p>
                <span className="text-xs text-green-600">Completed</span>
              </div>
            </div>
          ))}
          {bookings.filter(b => b.status === 'completed').length === 0 && (
            <p className="text-center text-gray-500 py-8">No completed jobs yet</p>
          )}
        </div>
      </div>
    </div>
  )

  // Reviews View
  const ReviewsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Reviews</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No reviews yet</p>
        </div>
      </div>
    </div>
  )

  // Settings View
  const SettingsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              defaultValue={profileData.name}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              defaultValue={profileData.phone}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              defaultValue={profileData.city}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
            />
          </div>
          <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )

  // Sidebar Component
  const Sidebar = () => (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-green-600 flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          MaidMatch
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-green-50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )

  if (!user || user.role !== 'worker') {
    return <Navigate to="/login" />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-72 fixed h-full bg-white border-r border-gray-200">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-green-600">MaidMatch</h1>
        <button 
          onClick={() => setActiveTab('menu')}
          className="p-2 bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 p-4 lg:p-8 mt-16 lg:mt-0">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'bookings' && <BookingsView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'reviews' && <ReviewsView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'menu' && (
          <div className="fixed inset-0 bg-white z-40 p-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-green-600">Menu</h1>
              <button onClick={() => setActiveTab('dashboard')} className="p-2">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <Sidebar />
          </div>
        )}
      </div>
    </div>
  )
}
