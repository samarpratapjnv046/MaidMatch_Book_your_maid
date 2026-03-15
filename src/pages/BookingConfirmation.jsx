import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Clock, Calendar, MapPin, Phone, MessageSquare, ArrowLeft, Home, Star, User, CreditCard, Shield, RefreshCw, Key } from 'lucide-react'
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
        // Refresh booking
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
        // Refresh booking to show OTP in messages
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

  // Fetch booking
  const fetchBooking = async () => {
    if (!token) {
      setError('Please login to view booking details')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/bookings/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBooking(data)
        
        // Check if OTP was already generated
        if (data.otp) {
          setOtpGenerated(true)
        }
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
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-300'
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'offer_pending': return 'Waiting for Worker'
      case 'pending': return 'Pending'
      case 'accepted': return 'Accepted - Awaiting Payment'
      case 'rejected': return 'Rejected'
      case 'confirmed': return 'Confirmed'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  // Check if payment is enabled (only after worker accepts)
  const isPaymentEnabled = () => {
    return booking?.status === 'accepted' && booking?.payment_status !== 'paid'
  }

  // Check if OTP can be generated (only after payment is completed)
  const canGenerateOtp = () => {
    return booking?.payment_status === 'paid' && !booking?.otp_verified
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
          <Link to="/dashboard" className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
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
        <Link to="/dashboard" className="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-heading text-2xl font-bold text-gray-800">Booking Details</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(booking?.status)}`}>
              {getStatusLabel(booking?.status)}
            </span>
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
              {booking?.offer_price && booking?.offer_price !== booking?.total_price && (
                <p className="text-sm opacity-80 mt-1">Original: ₹{booking?.total_price}</p>
              )}
            </div>
            <div className="text-right">
              {booking?.payment_status === 'paid' ? (
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="text-sm opacity-90">Payment Status</p>
                  <p className="font-semibold">Paid</p>
                </div>
              ) : (
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="text-sm opacity-90">Payment Status</p>
                  <p className="font-semibold">Pending</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Section */}
        {isPaymentEnabled() && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Complete Payment
            </h2>
            <p className="text-gray-600 mb-4">
              Payment is now enabled. Please complete your payment to confirm the booking.
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

        {/* Waiting for Worker */}
        {booking?.status === 'offer_pending' && (
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

        {/* OTP Section - After Payment */}
        {canGenerateOtp() && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-green-600" />
              Generate OTP for Job Completion
            </h2>
            <p className="text-gray-600 mb-4">
              After the service is completed, generate an OTP to share with the worker. The worker will enter this OTP to confirm job completion and receive payment.
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

        {/* OTP Generated Info */}
        {otpGenerated && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-heading text-xl font-semibold mb-2">OTP Generated!</h2>
              <p className="text-gray-600 mb-4">
                Your OTP has been generated and sent to your Messages. Share this OTP with the worker after the service is completed.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>View OTP in Messages</span>
              </Link>
            </div>
          </div>
        )}

        {/* Job Completed */}
        {booking?.status === 'completed' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="font-heading text-xl font-semibold mb-2">Job Completed!</h2>
              <p className="text-gray-600">
                This job has been completed successfully. The worker has received their payment.
              </p>
            </div>
          </div>
        )}

        {/* Worker Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-primary" />
            <span>Worker Details</span>
          </h2>
          
          <div className="flex items-center gap-4">
            <img
              src={booking?.worker_photo || booking?.worker_id?.photo || 'https://ui-avatars.com/api/?name=Worker&background=22c55e&color=fff'}
              alt={booking?.worker_name || booking?.worker_id?.name}
              className="w-20 h-20 rounded-card object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{booking?.worker_name || booking?.worker_id?.name}</h3>
              <div className="flex items-center space-x-2 text-text-secondary text-sm mt-1">
                <MapPin className="w-4 h-4" />
                <span>{booking?.worker_id?.city || 'Location not specified'}</span>
              </div>
              {booking?.worker_id?.phone && (
                <div className="flex items-center space-x-2 text-text-secondary text-sm mt-1">
                  <Phone className="w-4 h-4" />
                  <span>{booking.worker_id.phone}</span>
                </div>
              )}
            </div>
          </div>

          {booking?.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-1">Your Message</h4>
              <p className="text-text-secondary text-sm">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/dashboard"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            to="/search"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-primary text-primary rounded-btn hover:bg-green-50 transition-colors"
          >
            <Star className="w-5 h-5" />
            <span>Book Another Worker</span>
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-center text-text-secondary text-sm mt-6">
          Need help? Contact us at support@maidmatch.com or call +91 12345 67890
        </p>
      </div>
    </div>
  )
}
