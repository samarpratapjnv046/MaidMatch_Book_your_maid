import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { User, Calendar, Clock, Star, MessageSquare, Settings, LogOut, Home, Search, Plus, X, CheckCircle, AlertCircle, Heart, Trash2, CreditCard, Key, RefreshCw } from 'lucide-react'
import { useAuth } from '../App'

const API_URL = 'http://localhost:3001/api'

export default function Dashboard() {
  const { user, logout, bookings: contextBookings, savedWorkers, unsaveWorker, addBooking, showToast, token } = useAuth()
  const [activeTab, setActiveTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [processingPayment, setProcessingPayment] = useState({})
  const navigate = useNavigate()

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      if (!token) {
        setBookings(contextBookings)
        return
      }
      try {
        const response = await fetch(`${API_URL}/bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setBookings(data)
        } else {
          setBookings(contextBookings)
        }
      } catch (error) {
        console.error('Error fetching bookings:', error)
        setBookings(contextBookings)
      }
    }
    fetchBookings()
  }, [token, contextBookings])

  // Fetch messages (including OTP)
  const fetchMessages = async () => {
    if (!token) return
    setLoadingMessages(true)
    try {
      const response = await fetch(`${API_URL}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages()
    }
  }, [activeTab])

  // Handle payment for a booking
  const handlePayment = async (booking) => {
    setProcessingPayment(prev => ({ ...prev, [booking._id]: true }))
    try {
      const response = await fetch(`${API_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: booking._id,
          amount: booking.total_price
        })
      })

      const data = await response.json()

      if (response.ok && data.razorpay_order_id) {
        // Open Razorpay checkout
        const options = {
          key: data.key_id || 'rzp_test_key',
          amount: data.amount,
          currency: 'INR',
          name: 'MaidMatch',
          description: `Payment for ${booking.service_type}`,
          order_id: data.razorpay_order_id,
          handler: async (paymentResult) => {
            // Verify payment
            const verifyResponse = await fetch(`${API_URL}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                booking_id: booking._id,
                razorpay_payment_id: paymentResult.razorpay_payment_id,
                razorpay_order_id: paymentResult.razorpay_order_id,
                razorpay_signature: paymentResult.razorpay_signature
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyResponse.ok) {
              showToast('Payment successful!', 'success')
              
              // Auto-generate OTP after successful payment
              try {
                const otpResponse = await fetch(`${API_URL}/otp/generate`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ booking_id: booking._id })
                })

                if (otpResponse.ok) {
                  showToast('OTP generated! Check your messages.', 'success')
                }
              } catch (otpError) {
                console.error('Auto OTP generation failed:', otpError)
              }

              // Refresh bookings
              const bookingsResponse = await fetch(`${API_URL}/bookings`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
              if (bookingsResponse.ok) {
                const bookingsData = await bookingsResponse.json()
                setBookings(bookingsData)
              }
            } else {
              showToast(verifyData.error || 'Payment verification failed', 'error')
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: user?.phone
          },
          theme: {
            color: '#22c55e'
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        showToast(data.error || 'Failed to initiate payment', 'error')
      }
    } catch (error) {
      console.error('Payment error:', error)
      showToast('Payment failed. Please try again.', 'error')
    } finally {
      setProcessingPayment(prev => ({ ...prev, [booking._id]: false }))
    }
  }

  // Redirect admins to admin dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" />
  }

  // Redirect workers to worker dashboard
  if (user?.role === 'worker') {
    return <Navigate to="/worker/dashboard" />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  const userBookings = bookings || []

  const stats = [
    { label: 'Total Bookings', value: userBookings.length, icon: Calendar },
    { label: 'Pending Requests', value: userBookings.filter(b => b.status === 'pending' || b.status === 'offer_pending').length, icon: Clock },
    { label: 'Accepted Jobs', value: userBookings.filter(b => b.status === 'accepted' || b.status === 'paid').length, icon: CheckCircle },
    { label: 'Saved Helpers', value: savedWorkers?.length || 0, icon: Heart }
  ]

  const tabs = [
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'saved', label: 'Saved Helpers', icon: Star },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'offer_pending': return 'bg-orange-100 text-orange-700'
      case 'pending_payment': return 'bg-orange-100 text-orange-700'
      case 'accepted': return 'bg-green-100 text-green-700'
      case 'paid': return 'bg-blue-100 text-blue-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'confirmed': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-purple-100 text-purple-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      case 'refunded': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'offer_pending': return 'Waiting for Worker'
      case 'pending_payment': return 'Awaiting Payment'
      case 'accepted': return 'Accepted - Pay Now'
      case 'paid': return 'Paid - Await Service'
      case 'rejected': return 'Rejected'
      case 'confirmed': return 'Confirmed'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      case 'refunded': return 'Refunded'
      default: return status
    }
  }

  // Check if payment button should be enabled
  const canPay = (booking) => {
    return booking.status === 'accepted' || booking.booking_status === 'accepted'
  }

  // Check if booking is paid
  const isPaid = (booking) => {
    return booking.payment_status === 'paid' || booking.status === 'paid' || booking.status === 'completed'
  }

  // Handle remove saved worker
  const handleRemoveSaved = (workerId, e) => {
    e.stopPropagation()
    unsaveWorker(workerId)
  }

  // Handle booking from saved worker
  const handleQuickBook = (worker) => {
    navigate(`/worker/${worker.id}`)
  }

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-card shadow-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-heading text-2xl font-bold text-gray-800">
                Welcome back, {user.name}!
              </h1>
              <p className="text-text-secondary">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/search"
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Find Help</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-2 px-4 py-2 border-2 border-primary text-primary rounded-btn hover:bg-green-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Become Helper</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-card shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
              </div>
              <p className="text-text-secondary text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-btn whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'messages' && messages.filter(m => !m.is_read).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {messages.filter(m => !m.is_read).length}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 rounded-btn text-red-600 hover:bg-red-50 whitespace-nowrap ml-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Bookings Section */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="font-heading text-xl font-semibold mb-6">My Bookings</h2>
            
            {userBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-medium mb-2">No Bookings Yet</h3>
                <p className="text-text-secondary mb-6">You haven't made any booking requests yet</p>
                <Link
                  to="/search"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Find Help</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userBookings.map((booking) => (
                  <div key={booking._id} className="border border-border rounded-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                      <img
                        src={booking.worker_photo || booking.workerPhoto || 'https://ui-avatars.com/api/?name=Worker&background=22c55e&color=fff'}
                        alt={booking.worker_name || booking.workerName}
                        className="w-20 h-20 rounded-card object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800">{booking.worker_name || booking.workerName || 'Worker'}</h3>
                            <p className="text-text-secondary text-sm">{booking.service_type}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{booking.date}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{booking.duration || 'N/A'}</span>
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-semibold text-primary">₹{booking.total_price || booking.totalPrice}</span>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {canPay(booking) && !isPaid(booking) && (
                              <button
                                onClick={() => handlePayment(booking)}
                                disabled={processingPayment[booking._id]}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                              >
                                {processingPayment[booking._id] ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CreditCard className="w-4 h-4" />
                                )}
                                <span>{processingPayment[booking._id] ? 'Processing...' : 'Pay Now'}</span>
                              </button>
                            )}
                            {isPaid(booking) && booking.status !== 'completed' && (
                              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                                <Key className="w-4 h-4" />
                                <span className="text-sm">Share OTP with worker</span>
                              </div>
                            )}
                            {booking.status === 'completed' && (
                              <div className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Completed</span>
                              </div>
                            )}
                            {(booking.status === 'pending' || booking.status === 'offer_pending') && (
                              <div className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Waiting for worker acceptance</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Helpers Section */}
        {activeTab === 'saved' && (
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="font-heading text-xl font-semibold mb-6">Saved Helpers</h2>
            
            {!savedWorkers || savedWorkers.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-medium mb-2">No Saved Helpers</h3>
                <p className="text-text-secondary mb-6">Save your favorite helpers for quick access</p>
                <Link
                  to="/search"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Browse Helpers</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savedWorkers.map((worker) => (
                  <div key={worker.id} className="border border-border rounded-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                      <img
                        src={worker.photo || 'https://ui-avatars.com/api/?name=Worker&background=22c55e&color=fff'}
                        alt={worker.name}
                        className="w-20 h-20 rounded-card object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                            <p className="text-primary text-sm font-medium">{worker.profession}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{worker.rating}</span>
                              <span className="text-text-secondary text-sm">({worker.reviews} reviews)</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleRemoveSaved(worker.id, e)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove from saved"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-secondary">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{worker.experience}</span>
                          </span>
                          <span className="font-semibold text-primary">₹{worker.hourlyRate}/hr</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Link
                            to={`/worker/${worker.id}`}
                            className="px-4 py-2 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            View Profile
                          </Link>
                          <button
                            onClick={() => handleQuickBook(worker)}
                            className="px-4 py-2 border-2 border-primary text-primary rounded-btn hover:bg-green-50 transition-colors text-sm font-medium"
                          >
                            Quick Book
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Section - Shows OTP */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="font-heading text-xl font-semibold mb-6">Messages & OTP</h2>
            
            {loadingMessages ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-text-secondary mt-2">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-medium mb-2">No Messages</h3>
                <p className="text-text-secondary">Your OTP codes will appear here after payment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message._id} 
                    className={`border rounded-card p-4 ${message.is_read ? 'border-border bg-gray-50' : 'border-green-300 bg-green-50'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-800">{message.title || 'OTP Message'}</h3>
                      </div>
                      {!message.is_read && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">New</span>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm mb-3">{message.message}</p>
                    {message.otp && (
                      <div className="bg-white border border-green-200 rounded-lg p-3 inline-block">
                        <span className="text-sm text-gray-500">Your OTP: </span>
                        <span className="text-2xl font-bold text-green-600 tracking-wider">{message.otp}</span>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      {message.created_at && new Date(message.created_at).toLocaleString()}
                      {message.otp_expiry && (
                        <span className="ml-2">• Expires: {new Date(message.otp_expiry).toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Section */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="font-heading text-xl font-semibold mb-6">Account Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  defaultValue={user.name}
                  className="w-full px-4 py-2 border border-border rounded-input focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="w-full px-4 py-2 border border-border rounded-input focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  defaultValue={user.phone || ''}
                  className="w-full px-4 py-2 border border-border rounded-input focus:border-primary outline-none"
                />
              </div>
              <button className="px-6 py-2 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
