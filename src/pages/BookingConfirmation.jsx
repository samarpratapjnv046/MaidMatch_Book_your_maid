import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Clock, Calendar, MapPin, Phone, MessageSquare, ArrowLeft, Home, Star, User, CreditCard, Shield, RefreshCw, Key, XCircle, Mail, DollarSign } from 'lucide-react'
import { useAuth } from '../App'
import { processPayment } from '../utils/payment'

const API_URL = 'http://localhost:3001/api'

export default function BookingConfirmation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user, showToast } = useAuth()
  
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paying, setPaying] = useState(false)
  const [generatingOtp, setGeneratingOtp] = useState(false)
  const [otpGenerated, setOtpGenerated] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  // Worker OTP verification
  const [otpInput, setOtpInput] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState('')

  // Determine viewer role
  const viewerRole = user?.role === 'admin' ? 'admin' : user?.role === 'worker' ? 'worker' : 'user'

  // Handle Cancel Booking
  const handleCancelBooking = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    setCancelling(true)
    try {
      const response = await fetch(`${API_URL}/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        showToast('Booking cancelled successfully', 'success')
        if (viewerRole === 'admin') navigate('/admin/dashboard')
        else if (viewerRole === 'worker') navigate('/worker/dashboard')
        else navigate('/dashboard')
      } else {
        showToast(data.error || 'Failed to cancel booking', 'error')
      }
    } catch (error) {
      showToast('Failed to cancel booking', 'error')
    } finally {
      setCancelling(false)
    }
  }

  // Worker: Request cancel
  const handleRequestDelete = async () => {
    const reason = window.prompt("Please enter a reason for cancelling this booking:");
    if (reason === null) return;

    try {
      const response = await fetch(`${API_URL}/bookings/${id}/request-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Cancellation request sent successfully', 'success');
        fetchBooking();
      } else {
        showToast(data.error || 'Failed to request cancellation', 'error');
      }
    } catch (error) {
      showToast('Failed to request cancellation', 'error');
    }
  }

  // Admin: Approve/Reject cancel request
  const handleApproveCancelRequest = async (action) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}/approve-cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        if (action === 'approve') {
          navigate('/admin/dashboard');
        } else {
          fetchBooking();
        }
      } else {
        showToast(data.error || 'Failed to process request', 'error');
      }
    } catch (error) {
      showToast('Failed to process request', 'error');
    }
  }

  // Handle payment
  const handlePayment = async () => {
    setPaying(true)
    try {
      const result = await processPayment(
        id,
        booking.offer_price || booking.total_price,
        { name: user?.name, email: user?.email, phone: user?.phone },
        token
      )
      
      if (result.success) {
        showToast('Payment successful!', 'success')
        window.location.reload()
      } else {
        showToast(result.error || 'Payment failed. Please try again.', 'error')
      }
    } catch (error) {
      showToast('Payment failed. Please try again.', 'error')
    } finally {
      setPaying(false)
    }
  }

  // Handle OTP generation (after payment)
  const handleGenerateOtp = async () => {
    setGeneratingOtp(true)
    try {
      const response = await fetch(`${API_URL}/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ booking_id: id })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        showToast('OTP generated! Check your messages.', 'success')
        setOtpGenerated(true)
        fetchBooking()
      } else {
        showToast(data.error || 'Failed to generate OTP', 'error')
      }
    } catch (error) {
      showToast('Failed to generate OTP', 'error')
    } finally {
      setGeneratingOtp(false)
    }
  }

  // Worker: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP')
      return
    }

    setVerifyingOtp(true)
    setOtpError('')

    try {
      const response = await fetch(`${API_URL}/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ booking_id: id, otp: otpInput })
      })

      const data = await response.json()

      if (response.ok) {
        showToast(`Job completed! ₹${data.payout_amount} added to wallet`, 'success')
        setOtpInput('')
        fetchBooking()
      } else {
        setOtpError(data.error || 'Failed to verify OTP')
        showToast(data.error || 'Failed to verify OTP', 'error')
      }
    } catch (error) {
      setOtpError('Failed to verify OTP')
      showToast('Failed to verify OTP', 'error')
    } finally {
      setVerifyingOtp(false)
    }
  }

  // Fetch booking
  const fetchBooking = async () => {
    if (!token) {
      setError('Please login to view booking details')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/bookings/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBooking(data)
        if (data.otp) setOtpGenerated(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to fetch booking')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [id, token])

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'offer_pending': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'accepted': return 'bg-green-100 text-green-700 border-green-300'
      case 'rejected': return 'bg-red-100 text-red-700 border-red-300'
      case 'paid': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-300'
      case 'completed': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'offer_pending': return 'Waiting for Worker'
      case 'pending': return 'Pending'
      case 'accepted': return 'Accepted - Awaiting Payment'
      case 'paid': return 'Paid - In Progress'
      case 'rejected': return 'Rejected'
      case 'confirmed': return 'Confirmed'
      case 'completed': return 'Work Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const isPaymentEnabled = () => {
    return viewerRole === 'user' && booking?.status === 'accepted' && booking?.payment_status !== 'paid'
  }

  const canGenerateOtp = () => {
    return viewerRole === 'user' && booking?.payment_status === 'paid' && !booking?.otp_verified
  }

  const canVerifyOtp = () => {
    return viewerRole === 'worker' && (booking?.status === 'paid' || booking?.payment_status === 'paid') && !booking?.otp_verified && booking?.status !== 'completed'
  }

  // Back button link based on role
  const getDashboardLink = () => {
    if (viewerRole === 'admin') return '/admin/dashboard'
    if (viewerRole === 'worker') return '/worker/dashboard'
    return '/dashboard'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to={getDashboardLink()} className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link to={getDashboardLink()} className="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-heading text-2xl font-bold text-gray-800">Booking Details</h1>
            <div className="flex items-center gap-2">
              {booking?.cancel_requested && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                  ⚠ Cancel Requested
                </span>
              )}
              <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(booking?.status)}`}>
                {getStatusLabel(booking?.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{booking?.date}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{booking?.time}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{booking?.duration}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Star className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p className="font-medium">{booking?.service_type}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Price Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="opacity-90 mb-1">Total Amount</p>
              <p className="text-4xl font-bold">₹{booking?.total_price}</p>
              {viewerRole === 'worker' && booking?.worker_payout_amount && (
                <p className="text-sm opacity-80 mt-1">Your Earnings: ₹{booking.worker_payout_amount}</p>
              )}
            </div>
            <div className="text-right">
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-sm opacity-90">Payment</p>
                <p className="font-semibold">{booking?.payment_status === 'paid' || booking?.payment_status === 'completed' ? 'Paid ✓' : 'Pending'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin: Cancel Request Review */}
        {viewerRole === 'admin' && booking?.cancel_requested && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-red-200">
            <h2 className="font-heading text-xl font-semibold mb-3 text-red-700 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Worker Cancel Request
            </h2>
            <p className="text-gray-600 mb-2">
              <strong>Reason:</strong> {booking.cancel_reason || 'Not provided'}
            </p>
            <p className="text-gray-500 text-sm mb-4">
              The worker has requested to cancel this booking. You can approve or reject this request.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleApproveCancelRequest('approve')}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Approve (Delete Booking)
              </button>
              <button
                onClick={() => handleApproveCancelRequest('reject')}
                className="flex-1 px-4 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                Reject (Keep Booking)
              </button>
            </div>
          </div>
        )}

        {/* Payment Section - User Only */}
        {isPaymentEnabled() && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Complete Payment
            </h2>
            <p className="text-gray-600 mb-4">
              The worker has accepted your booking! Please complete payment to confirm.
            </p>
            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50"
            >
              {paying ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay Now - ₹{booking?.total_price}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Waiting for Worker - User Only */}
        {viewerRole === 'user' && booking?.status === 'offer_pending' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="font-heading text-xl font-semibold mb-2">Waiting for Worker</h2>
              <p className="text-gray-600">
                Your booking request has been sent. Please wait for the worker to accept or reject your request.
              </p>
            </div>
          </div>
        )}

        {/* OTP Section - User: Generate OTP */}
        {canGenerateOtp() && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-green-600" />
              Generate OTP for Job Completion
            </h2>
            <p className="text-gray-600 mb-4">
              After the service is completed, generate an OTP and share it with the worker. The worker will enter this OTP to confirm job completion.
            </p>
            <button
              onClick={handleGenerateOtp}
              disabled={generatingOtp}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
            >
              {generatingOtp ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating OTP...</span>
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  <span>Generate OTP</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* OTP Generated Info - User */}
        {viewerRole === 'user' && otpGenerated && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-heading text-xl font-semibold mb-2">OTP Generated!</h2>
              <p className="text-gray-600 mb-4">
                Your OTP has been sent to your Messages. Share this OTP with the worker after the service is completed.
              </p>
              <Link
                to="/dashboard"
                onClick={() => setTimeout(() => {}, 100)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>View OTP in Messages</span>
              </Link>
            </div>
          </div>
        )}

        {/* Worker OTP Verification Section */}
        {canVerifyOtp() && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-blue-200">
            <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Submit OTP & Verify Work
            </h2>
            <p className="text-gray-600 mb-4">
              Ask the user for their OTP to confirm the work is complete. Enter the 6-digit OTP below.
            </p>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 text-lg tracking-widest text-center font-mono"
                maxLength={6}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpInput.length !== 6}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
              >
                {verifyingOtp ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  'Verify & Complete'
                )}
              </button>
            </div>
            {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
          </div>
        )}

        {/* Job Completed */}
        {booking?.status === 'completed' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
              <h2 className="font-heading text-xl font-semibold mb-2">Job Completed!</h2>
              <p className="text-gray-600">
                {viewerRole === 'worker'
                  ? 'This job has been completed. Payment has been added to your wallet.'
                  : 'This job has been completed successfully. The worker has received their payment.'}
              </p>
            </div>
          </div>
        )}

        {/* Worker Details Card - Visible to User and Admin */}
        {(viewerRole === 'user' || viewerRole === 'admin') && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-heading text-xl font-semibold mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-green-600" />
              <span>Worker Details</span>
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={booking?.worker_photo || booking?.worker_id?.photo || 'https://ui-avatars.com/api/?name=Worker&background=22c55e&color=fff'}
                alt={booking?.worker_name || booking?.worker_id?.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{booking?.worker_name || booking?.worker_id?.name}</h3>
                <p className="text-gray-500 text-sm">{booking?.service_type}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center space-x-2 text-gray-700 text-sm">
                <Phone className="w-4 h-4 text-green-600" />
                <span>{booking?.worker_id?.phone || 'Phone not provided'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700 text-sm">
                <Mail className="w-4 h-4 text-green-600" />
                <span>{booking?.worker_id?.email || 'Email not provided'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700 text-sm">
                <MapPin className="w-4 h-4 text-green-600" />
                <span>{booking?.worker_id?.address || booking?.worker_id?.city || booking?.worker_id?.location || 'Address not provided'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700 text-sm">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span>₹{booking?.total_price} total</span>
              </div>
            </div>
          </div>
        )}

        {/* User Details Card - Visible to Worker and Admin */}
        {(viewerRole === 'worker' || viewerRole === 'admin') && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-heading text-xl font-semibold mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Customer Details</span>
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{booking?.user_name || booking?.user_id?.name || 'Customer'}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center space-x-2 text-gray-700 text-sm">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>{booking?.user_phone || booking?.user_id?.phone || 'Phone not provided'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700 text-sm">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{booking?.user_id?.email || 'Email not provided'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700 text-sm">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{booking?.user_address || booking?.user_id?.address || booking?.user_id?.city || booking?.user_id?.location || 'Address not provided'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700 text-sm">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>₹{booking?.total_price} total</span>
              </div>
            </div>
          </div>
        )}

        {/* Admin: Extra Info */}
        {viewerRole === 'admin' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-heading text-xl font-semibold mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span>Admin Info</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl text-sm">
              <div><span className="text-gray-500">Booking ID:</span> <span className="text-gray-800 font-mono">{booking?._id}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium">{booking?.status}</span></div>
              <div><span className="text-gray-500">Payment Status:</span> <span className="font-medium">{booking?.payment_status || 'pending'}</span></div>
              <div><span className="text-gray-500">OTP Verified:</span> <span className="font-medium">{booking?.otp_verified ? 'Yes ✓' : 'No'}</span></div>
              <div><span className="text-gray-500">Worker Payout:</span> <span className="font-medium">₹{booking?.worker_payout_amount || 0}</span></div>
              <div><span className="text-gray-500">Commission:</span> <span className="font-medium">₹{booking?.commission_amount || 0}</span></div>
            </div>
          </div>
        )}

        {/* Notes */}
        {booking?.notes && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-heading text-lg font-semibold mb-2">Notes</h2>
            <p className="text-gray-600 text-sm">{booking.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          {/* User/Admin Cancel */}
          {(viewerRole === 'user' || viewerRole === 'admin') && booking?.status !== 'completed' && booking?.status !== 'cancelled' && booking?.status !== 'rejected' && (
            <button
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-red-500 text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelling ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  <span>Cancel Booking</span>
                </>
              )}
            </button>
          )}

          {/* Worker Request Cancel */}
          {viewerRole === 'worker' && (booking?.status === 'accepted' || booking?.status === 'paid') && !booking?.cancel_requested && (
            <button
              onClick={handleRequestDelete}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-red-500 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              <span>Request Cancel</span>
            </button>
          )}

          {viewerRole === 'worker' && booking?.cancel_requested && (
            <div className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-orange-100 text-orange-700 rounded-xl">
              <Clock className="w-5 h-5" />
              <span>Cancel Request Pending</span>
            </div>
          )}

          <Link
            to={getDashboardLink()}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Need help? Contact us at support@maidmatch.com
        </p>
      </div>
    </div>
  )
}
