import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Star, MapPin, Clock, ArrowLeft, Shield, Award, Calendar, MessageCircle, Phone, CheckCircle, Heart, Briefcase, Languages, FileText, User, X, Sun, Sunset, Moon, AlertCircle } from 'lucide-react'
import { useAuth } from '../App'
import { processPayment, verifyPayment } from '../utils/payment'

const API_URL = 'http://localhost:3001/api'

const mockReviews = [
  { id: 1, user_name: 'Rahul Sharma', user_photo: 'https://ui-avatars.com/api/?name=Rahul+Sharma&background=22c55e&color=fff', rating: 5, review: 'Excellent service! Very professional.', created_at: '2024-01-15' },
  { id: 2, user_name: 'Anita Patel', user_photo: 'https://ui-avatars.com/api/?name=Anita+Patel&background=3b82f6&color=fff', rating: 4, review: 'Very good work, worth it.', created_at: '2024-01-10' },
  { id: 3, user_name: 'Vikram Singh', user_photo: 'https://ui-avatars.com/api/?name=Vikram+Singh&background=f59e0b&color=fff', rating: 5, review: 'Consistent quality.', created_at: '2024-01-05' }
]

// Time slot definitions
const timeSlots = [
  { id: 'morning', label: 'Morning', icon: Sun, time: '6:00 AM - 12:00 PM', color: 'bg-yellow-100 text-yellow-700', start: '06:00', end: '12:00' },
  { id: 'afternoon', label: 'Afternoon', icon: Sunset, time: '12:00 PM - 4:00 PM', color: 'bg-orange-100 text-orange-700', start: '12:00', end: '16:00' },
  { id: 'evening', label: 'Evening', icon: Moon, time: '4:00 PM - 8:00 PM', color: 'bg-purple-100 text-purple-700', start: '16:00', end: '20:00' },
  { id: 'night', label: 'Night', icon: Moon, time: '8:00 PM - 10:00 PM', color: 'bg-indigo-100 text-indigo-700', start: '20:00', end: '22:00' }
]

// Duration options
const durationOptions = [
  { v: 'hourly', l: 'Hourly', p: 'per hour', desc: 'Flexible hours' },
  { v: 'daily', l: 'Daily', p: 'per day', desc: '8 hours' },
  { v: 'weekly', l: 'Weekly', p: 'per week', desc: '5 days' },
  { v: 'monthly', l: 'Monthly', p: 'per month', desc: '22 days' }
]

export default function WorkerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, addBooking, token, workers, saveWorker, unsaveWorker, isWorkerSaved, showToast } = useAuth()
  
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [apiWorker, setApiWorker] = useState(null)

  // Get worker from local data first (available immediately)
  const localWorker = workers.find(w => String(w.id) === String(id))
  const worker = apiWorker || localWorker

  useEffect(() => {
    const fetchWorkerFromApi = async () => {
      try {
        const response = await fetch(`${API_URL}/workers/${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        if (!response.ok) { return }
        const data = await response.json()
        const transformed = {
          id: data._id, name: data.name, photo: data.photo,
          profession: data.services?.[0] || 'General Service',
          rating: data.rating || 4.5, reviews: data.reviews || 20,
          hourlyRate: data.hourly_rate || 300, dailyRate: data.daily_rate || 2400,
          weeklyRate: (data.daily_rate || 2400) * 5, monthlyRate: data.monthly_rate || 48000,
          experience: data.experience || '2 years',
          skills: data.skills ? data.skills.split(',').map(s => s.trim()) : [],
          location: data.location || data.city || 'Not specified',
          available: !data.is_banned,
          is_verified: data.is_verified,
          bio: data.bio || 'Experienced professional.',
          gender: data.gender || 'female',
          languages: data.languages || ['Hindi', 'English'],
          aadhar_verified: !!data.aadhar_photo,
          responseTime: '< 2 hours',
          phone: data.phone
        }
        setApiWorker(transformed)
      } catch (err) { }
      finally { setLoading(false) }
    }
    fetchWorkerFromApi()
  }, [id, token])

  const isSaved = worker ? isWorkerSaved(worker.id) : false
  
  // Booking state
  const [bookingData, setBookingData] = useState({ 
    date: '', 
    endDate: '',
    time: 'morning', 
    startTime: '10:00',
    endTime: '',
    duration: 'hourly', 
    hours: 2, 
    offerPrice: '',
    notes: '',
    weekStartDate: '',
    monthStartDate: ''
  })
  
  const [availability, setAvailability] = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [unavailableSlots, setUnavailableSlots] = useState([])

  // Check availability when date or time changes
  useEffect(() => {
    if (bookingData.date && worker?.id && showBookingModal) {
      checkAvailability()
    }
  }, [bookingData.date, bookingData.time, bookingData.duration, bookingData.hours, bookingData.startTime, worker?.id, showBookingModal])

  // Check availability
  const checkAvailability = async () => {
    if (!worker?.id || !bookingData.date) return
    
    setCheckingAvailability(true)
    try {
      const params = new URLSearchParams({
        date: bookingData.date,
        duration: bookingData.duration,
        time: bookingData.time
      })
      
      if (bookingData.duration === 'hourly') {
        params.append('hours', bookingData.hours)
        params.append('startTime', bookingData.startTime)
      }
      
      if (bookingData.duration === 'weekly') {
        params.append('weekStartDate', bookingData.date)
      }
      
      if (bookingData.duration === 'monthly') {
        params.append('monthStartDate', bookingData.date)
      }
      
      const response = await fetch(`${API_URL}/workers/${worker.id}/availability?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAvailability(data)
      }
      
      // Get unavailable slots for the date
      const slotsResponse = await fetch(`${API_URL}/workers/${worker.id}/unavailable-slots?date=${bookingData.date}`)
      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json()
        setUnavailableSlots(slotsData.unavailable_slots || [])
      }
    } catch (err) {
      console.error('Availability check failed:', err)
    } finally {
      setCheckingAvailability(false)
    }
  }

  // Handle date change
  const handleDateChange = (newDate) => {
    setBookingData(prev => ({ ...prev, date: newDate }))
  }

  // Handle end date change (for weekly/monthly)
  const handleEndDateChange = (newEndDate) => {
    setBookingData(prev => ({ ...prev, endDate: newEndDate }))
  }

  // Handle time slot change
  const handleTimeChange = (time) => {
    const slot = timeSlots.find(s => s.id === time)
    setBookingData(prev => ({ 
      ...prev, 
      time,
      endTime: slot?.end || ''
    }))
  }

  // Handle start time change (for hourly)
  const handleStartTimeChange = (time) => {
    // Calculate end time based on hours
    const [hours, minutes] = time.split(':').map(Number)
    const endHours = hours + bookingData.hours
    const endTime = `${Math.min(endHours, 22)}:${minutes.toString().padStart(2, '0')}`
    
    setBookingData(prev => ({ 
      ...prev, 
      startTime: time,
      endTime: endTime
    }))
  }

  // Handle duration change
  const handleDurationChange = (duration) => {
    setBookingData(prev => ({ 
      ...prev, 
      duration, 
      hours: duration === 'hourly' ? 2 : 1 
    }))
  }

  // Handle hours change for hourly bookings
  const handleHoursChange = (hours) => {
    const [startHours, startMinutes] = bookingData.startTime.split(':').map(Number)
    const endHours = startHours + hours
    const endTime = `${Math.min(endHours, 22)}:${startMinutes.toString().padStart(2, '0')}`
    
    setBookingData(prev => ({ 
      ...prev, 
      hours,
      endTime
    }))
  }

  // Handle offer price change
  const handleOfferPriceChange = (value) => {
    setBookingData(prev => ({ ...prev, offerPrice: value }))
  }

  // Handle notes change
  const handleNotesChange = (value) => {
    setBookingData(prev => ({ ...prev, notes: value }))
  }

  // Calculate price
  const calculatePrice = () => {
    const rates = { 
      hourly: worker.hourlyRate || 300, 
      daily: worker.dailyRate || 2400, 
      weekly: worker.weeklyRate || 12000, 
      monthly: worker.monthlyRate || 48000 
    }
    
    if (bookingData.duration === 'hourly') {
      return rates.hourly * bookingData.hours
    }
    return rates[bookingData.duration]
  }

  // Check if a time slot is unavailable
  const isTimeSlotUnavailable = (slotId) => {
    const slot = timeSlots.find(s => s.id === slotId)
    if (!slot) return false
    
    return unavailableSlots.some(unavailable => {
      if (unavailable.time === slotId) return true
      // Check time overlap for hourly bookings
      if (unavailable.start_time && bookingData.duration === 'hourly') {
        const unavailableEnd = parseInt(unavailable.start_time.split(':')[0]) + parseInt(unavailable.duration || 4)
        const requestedStart = parseInt(slot.start.split(':')[0])
        const requestedEnd = parseInt(slot.end.split(':')[0])
        
        return (requestedStart < unavailableEnd && requestedEnd > parseInt(unavailable.start_time.split(':')[0]))
      }
      return false
    })
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (user.role === 'worker' || user.role === 'admin') { showToast('Only customers can book', 'error'); return }
    
    // Validate availability
    if (availability && !availability.is_available) {
      showToast('Worker is not available for the selected time slot. Please choose a different time.', 'error')
      return
    }
    
    setBookingSubmitting(true)
    
    const offerPrice = bookingData.offerPrice ? parseInt(bookingData.offerPrice) : calculatePrice()
    
    const result = await addBooking({
      worker_id: worker.id, 
      worker_name: worker.name, 
      worker_photo: worker.photo,
      worker_phone: worker.phone,
      date: bookingData.date, 
      end_date: bookingData.endDate || bookingData.date,
      time: bookingData.duration === 'hourly' ? 'hourly' : bookingData.time,
      start_time: bookingData.startTime,
      end_time: bookingData.endTime,
      duration: bookingData.duration === 'hourly' ? `${bookingData.hours} hours` : bookingData.duration,
      total_price: calculatePrice(),
      offer_price: offerPrice,
      notes: bookingData.notes,
      service_type: worker.profession
    })
    
    setBookingSubmitting(false)
    
    if (result.success) { 
      setShowBookingModal(false)
      
      // Trigger payment after successful booking
      try {
        showToast('Processing payment...', 'info')
        const paymentResult = await processPayment(
          result.bookingId,
          offerPrice,
          { name: user?.name, email: user?.email, phone: user?.phone },
          token
        )
        
        if (paymentResult.success) {
          showToast('Payment successful! Booking is now pending worker acceptance.', 'success')
          navigate(`/booking/${result.bookingId}`)
        } else {
          showToast(paymentResult.error || 'Payment failed. Please try again.', 'error')
          navigate(`/booking/${result.bookingId}`)
        }
      } catch (error) {
        console.error('Payment error:', error)
        showToast('Payment processing failed. You can pay from booking details.', 'error')
        navigate(`/booking/${result.bookingId}`)
      }
    }
    else { showToast(result.error || 'Failed', 'error') }
  }

  const handleSaveToggle = () => { isSaved ? unsaveWorker(worker.id) : saveWorker(worker) }
  const renderStars = (rating) => [...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-secondary fill-current' : 'text-gray-300'}`} />)

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )

  if (!worker) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="text-center">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Worker Not Found</h2>
        <Link to="/search" className="px-6 py-3 bg-primary text-white rounded-lg">Browse Workers</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background px-5 pb-5">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - 70% - Worker Details */}
        <div className="lg:w-[70%]">
          {/* Sticky Back Button - only in left part */}
          <button onClick={() => navigate(-1)} className="sticky top-0 z-10 flex items-center space-x-2 bg-white shadow-md text-text-secondary hover:text-primary px-4 py-2 rounded-lg mb-4 w-fit">
            <ArrowLeft className="w-5 h-5" /><span>Back</span>
          </button>
          
          {/* Scrollable Content */}
          <div className="space-y-6 overflow-y-auto pr-2" style={{maxHeight: 'calc(100vh - 120px)'}}>
          {/* Profile Header */}
          <div className="bg-white rounded-card shadow-card p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative">
                <img src={worker.photo} alt={worker.name} className="w-40 h-40 rounded-card object-cover shadow-md" />
                {worker.available && (
                  <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-1"></span>Available
                  </div>
                )}
                {worker.is_verified && <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full"><CheckCircle className="w-4 h-4" /></div>}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">{worker.name}</h1>
                <p className="text-primary font-semibold text-lg mb-2">{worker.profession}</p>
                <div className="flex items-center space-x-2 mb-2">{renderStars(worker.rating)}<span className="font-semibold">{worker.rating.toFixed(1)}</span><span className="text-text-secondary">({worker.reviews})</span></div>
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center space-x-1 text-sm text-text-secondary bg-gray-50 px-3 py-1 rounded-lg"><MapPin className="w-4 h-4" />{worker.location}</span>
                  <span className="flex items-center space-x-1 text-sm text-text-secondary bg-gray-50 px-3 py-1 rounded-lg"><Clock className="w-4 h-4" />{worker.responseTime}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">{(worker.skills || []).map((skill, i) => <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">{skill.trim()}</span>)}</div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2"><Briefcase className="w-5 h-5 text-primary" /><span>Pricing</span></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-xl border border-green-200"><p className="text-sm text-green-700 font-medium">Hourly</p><p className="text-2xl font-bold text-green-800">₹{worker.hourlyRate || 300}</p><p className="text-xs text-green-600">per hour</p></div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200"><p className="text-sm text-blue-700 font-medium">Daily</p><p className="text-2xl font-bold text-blue-800">₹{worker.dailyRate || 2400}</p><p className="text-xs text-blue-600">8 hours</p></div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200"><p className="text-sm text-purple-700 font-medium">Weekly</p><p className="text-2xl font-bold text-purple-800">₹{worker.weeklyRate || 12000}</p><p className="text-xs text-purple-600">5 days</p></div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200"><p className="text-sm text-orange-700 font-medium">Monthly</p><p className="text-2xl font-bold text-orange-800">₹{worker.monthlyRate || 48000}</p><p className="text-xs text-orange-600">22 days</p></div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-text-secondary">{worker.bio}</p>
          </div>

          {/* Personal Details */}
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"><User className="w-5 h-5 text-primary" /><div><p className="text-sm text-text-secondary">Gender</p><p className="font-medium capitalize">{worker.gender || 'Not specified'}</p></div></div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"><Award className="w-5 h-5 text-primary" /><div><p className="text-sm text-text-secondary">Experience</p><p className="font-medium">{worker.experience}</p></div></div>
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2"><Languages className="w-5 h-5 text-primary" /><span>Languages</span></h2>
            <div className="flex flex-wrap gap-2">{(worker.languages || []).map((lang, i) => <span key={i} className="bg-gray-100 text-text-secondary px-4 py-2 rounded-full text-sm">{lang}</span>)}</div>
          </div>

          {/* Documents */}
          {worker.aadhar_verified && (
            <div className="bg-white rounded-card shadow-card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2"><FileText className="w-5 h-5 text-primary" /><span>Verification</span></h2>
              <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                <div><p className="font-semibold text-green-800">Aadhaar Verified</p><p className="text-sm text-green-600">Identity verified</p></div>
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-card shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Reviews</h2>
              <div className="flex items-center space-x-2">{renderStars(worker.rating)}<span className="font-bold">{worker.rating.toFixed(1)}</span><span className="text-text-secondary">({worker.reviews})</span></div>
            </div>
            <div className="space-y-4">
              {mockReviews.map((review) => (
                <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start space-x-4">
                    <img src={review.user_photo} alt={review.user_name} className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex justify-between"><h4 className="font-semibold">{review.user_name}</h4><span className="text-sm text-text-secondary">{review.created_at}</span></div>
                      <div className="flex mb-1">{renderStars(review.rating)}</div>
                      <p className="text-text-secondary text-sm">{review.review}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Right Side - 30% - Booking Panel */}
        <div className="lg:w-[30%] overflow-y-auto" style={{maxHeight: 'calc(100vh - 80px)'}}>
          <div className="bg-white rounded-card shadow-card p-6 sticky top-0">
            <div className="text-center mb-4">
              <p className="text-text-secondary text-sm">Starting from</p>
              <p className="text-4xl font-bold text-primary">₹{worker.hourlyRate || 300}</p>
              <p className="text-text-secondary text-sm">per hour</p>
            </div>

            {/* Quick Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-primary">{worker.name}</span> is available for booking
              </p>
            </div>

            {/* Book Now Button - Always visible */}
            <button
              onClick={() => { if (!user) navigate('/login'); else if (user.role === 'worker' || user.role === 'admin') showToast('Only customers can book', 'error'); else setShowBookingModal(true) }}
              className="w-full py-4 rounded-lg font-semibold text-lg bg-primary text-white hover:bg-green-700 shadow-lg hover:shadow-xl transition-all"
            >
              Book Now
            </button>

            {user && (
              <button onClick={handleSaveToggle} className={`w-full mt-3 py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 ${isSaved ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-gray-50 text-text-secondary border border-gray-200'}`}>
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? 'Saved to Favorites' : 'Save for Later'}</span>
              </button>
            )}

            <div className="mt-5 pt-5 border-t border-border space-y-3">
              {worker.is_verified && (
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-text-secondary">Verified Profile</span>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-text-secondary">Background Checked</span>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-green-600" />
                <span className="text-sm text-text-secondary">Quality Assured</span>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-border space-y-3">
              <button className="w-full flex items-center justify-center space-x-2 py-2.5 border border-primary text-primary rounded-lg hover:bg-green-50 font-medium">
                <MessageCircle className="w-5 h-5" />
                <span>Send Message</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Book {worker.name}</h2>
              <button onClick={() => setShowBookingModal(false)} className="text-2xl w-8 h-8">&times;</button>
            </div>
            
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <img src={worker.photo} alt={worker.name} className="w-12 h-12 rounded-full" />
              <div>
                <h3 className="font-semibold">{worker.name}</h3>
                <p className="text-sm text-text-secondary">{worker.profession}</p>
              </div>
            </div>

            {/* Availability Status */}
            {checkingAvailability && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-blue-700">Checking availability...</span>
              </div>
            )}
            
            {availability && !availability.is_available && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">Worker is not available for selected time. Please choose different time.</span>
              </div>
            )}
            
            {availability && availability.is_available && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">Worker is available!</span>
              </div>
            )}
            
            <form onSubmit={handleBooking} className="space-y-4">
              {/* Duration Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Booking Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {durationOptions.map((o) => (
                    <button 
                      key={o.v} 
                      type="button" 
                      onClick={() => handleDurationChange(o.v)}
                      className={`py-3 rounded-lg border-2 text-center transition-all ${
                        bookingData.duration === o.v ? 'border-primary bg-green-50' : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <p className="text-sm font-medium">{o.l}</p>
                      <p className="text-xs text-text-secondary">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {bookingData.duration === 'weekly' || bookingData.duration === 'monthly' ? 'Start Date' : 'Date'}
                </label>
                <input 
                  type="date" 
                  value={bookingData.date} 
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} 
                  required 
                  className="w-full px-3 py-2 border rounded-lg" 
                />
              </div>

              {/* End Date for Weekly/Monthly */}
              {(bookingData.duration === 'weekly' || bookingData.duration === 'monthly') && (
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={bookingData.endDate} 
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={bookingData.date} 
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    {bookingData.duration === 'weekly' ? '7 days' : '30 days'} from start date will be booked
                  </p>
                </div>
              )}

              {/* Time Slot Selection (for daily/weekly/monthly) */}
              {bookingData.duration !== 'hourly' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Time Slot</label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => {
                      const Icon = slot.icon
                      const isSelected = bookingData.time === slot.id
                      const isUnavailable = isTimeSlotUnavailable(slot.id)
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => !isUnavailable && handleTimeChange(slot.id)}
                          disabled={isUnavailable}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            isSelected ? 'border-primary bg-green-50' : isUnavailable ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50' : 'border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className={`w-4 h-4 ${slot.color}`} />
                            <div>
                              <p className="text-xs font-medium">{slot.label}</p>
                              <p className="text-xs text-text-secondary">{slot.time}</p>
                              {isUnavailable && <p className="text-xs text-red-500">Unavailable</p>}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Time Selection for Hourly */}
              {bookingData.duration === 'hourly' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input 
                      type="time" 
                      value={bookingData.startTime} 
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      min="06:00"
                      max="21:00"
                      required 
                      className="w-full px-3 py-2 border rounded-lg" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Hours</label>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleHoursChange(Math.max(1, bookingData.hours - 1))}
                        className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                      >-</button>
                      <span className="flex-1 text-center text-lg font-semibold">{bookingData.hours} hour{bookingData.hours > 1 ? 's' : ''}</span>
                      <button
                        type="button"
                        onClick={() => handleHoursChange(Math.min(12, bookingData.hours + 1))}
                        className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                      >+</button>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      End time: {bookingData.endTime || 'N/A'}
                    </p>
                  </div>
                </>
              )}

              {/* Offer Price */}
              <div>
                <label className="block text-sm font-medium mb-1">Your Offer Price (₹)</label>
                <input 
                  type="number" 
                  placeholder={`Enter amount (min ₹${calculatePrice()})`}
                  value={bookingData.offerPrice}
                  onChange={(e) => handleOfferPriceChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-text-secondary mt-1">Worker rate: ₹{calculatePrice()}</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Message to Worker</label>
                <textarea 
                  placeholder="Describe your requirements, special instructions, etc."
                  value={bookingData.notes}
                  onChange={(e) => handleNotesChange(e.target.value)} 
                  rows="3" 
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Price Summary */}
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span>Your Offer</span>
                  <span className="text-xl font-bold text-primary">₹{bookingData.offerPrice || calculatePrice()}</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {bookingData.date} 
                  {bookingData.duration === 'hourly' && ` • ${bookingData.startTime} - ${bookingData.endTime} • ${bookingData.hours} hour(s)`}
                  {bookingData.duration !== 'hourly' && ` • ${timeSlots.find(s => s.id === bookingData.time)?.label || ''} • ${bookingData.duration}`}
                  {bookingData.endDate && ` to ${bookingData.endDate}`}
                </p>
              </div>

              <button 
                type="submit" 
                disabled={bookingSubmitting || (availability && !availability.is_available)}
                className="w-full py-3 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingSubmitting ? 'Sending...' : 'Send Booking Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
