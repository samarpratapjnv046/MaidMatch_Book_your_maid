import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search as SearchIcon, SlidersHorizontal, X, Star, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import WorkerCard from '../components/WorkerCard'
import { useAuth } from '../App'

const API_URL = 'http://localhost:3001/api'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { workers, user, addBooking, showToast, token } = useAuth()
  
  // Quick booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [bookingData, setBookingData] = useState({
    date: '',
    time: 'morning',
    duration: 'hourly',
    hours: 2
  })

  // API workers for backend filtering
  const [apiWorkers, setApiWorkers] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availabilityLoading, setAvailabilityLoading] = useState({})
  
  const [filters, setFilters] = useState({
    service: searchParams.get('service') || '',
    location: searchParams.get('location') || '',
    bookingType: searchParams.get('bookingType') || '', // hourly, daily, monthly
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    minPrice: 0,
    maxPrice: 1000,
    minRating: 0,
    available: false
  })

  // Fetch workers from API with filters
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true)
      
      try {
        // Build query params
        const params = new URLSearchParams()
        if (filters.service) params.append('service', filters.service)
        if (filters.location) params.append('location', filters.location)
        if (filters.bookingType) params.append('bookingType', filters.bookingType)
        if (filters.minPrice > 0) params.append('minPrice', filters.minPrice)
        if (filters.maxPrice < 1000) params.append('maxPrice', filters.maxPrice)
        if (filters.minRating > 0) params.append('minRating', filters.minRating)
        if (filters.available) params.append('available', 'true')

        const response = await fetch(`${API_URL}/workers/search?${params.toString()}`)
        
        if (response.ok) {
          const data = await response.json()
          
          // Transform API workers to match frontend format
          const transformed = data.map(w => ({
            id: w._id,
            name: w.name,
            photo: w.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}&background=22c55e&color=fff`,
            profession: w.services?.[0] || 'General Service',
            rating: w.rating || 4.5,
            reviews: w.reviews || 20,
            hourlyRate: w.hourly_rate || 300,
            dailyRate: w.daily_rate || 2400,
            weeklyRate: (w.daily_rate || 2400) * 5,
            monthlyRate: w.monthly_rate || 48000,
            experience: w.experience || '2 years',
            skills: w.skills ? w.skills.split(',').map(s => s.trim()) : [],
            location: w.location || w.city || 'Not specified',
            available: !w.is_banned,
            is_verified: w.is_verified,
            bio: w.bio || 'Experienced professional.'
          }))
          
          setApiWorkers(transformed)
        } else {
          // Fallback to local workers if API fails
          setApiWorkers(workers)
        }
      } catch (error) {
        console.error('Failed to fetch workers:', error)
        setApiWorkers(workers)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkers()
  }, [filters.service, filters.location, filters.bookingType, filters.minPrice, filters.maxPrice, filters.minRating, filters.available])

  // Check availability for specific worker on selected date/time
  const checkAvailability = async (workerId, date, time, duration, hours) => {
    if (!date || !time) return null
    
    setAvailabilityLoading(prev => ({ ...prev, [workerId]: true }))
    
    try {
      const params = new URLSearchParams({ date, time, duration })
      if (hours) params.append('hours', hours)
      
      const response = await fetch(`${API_URL}/workers/${workerId}/availability?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        return data.is_available
      }
      return null
    } catch (error) {
      console.error('Availability check failed:', error)
      return null
    } finally {
      setAvailabilityLoading(prev => ({ ...prev, [workerId]: false }))
    }
  }

  // Auto-check availability when date/time changes
  useEffect(() => {
    if (filters.date && filters.time && apiWorkers.length > 0) {
      apiWorkers.forEach(worker => {
        checkAvailability(worker.id, filters.date, filters.time, filters.bookingType || 'hourly', bookingData.hours)
      })
    }
  }, [filters.date, filters.time, apiWorkers.length])

  // Combine local and API workers, prioritize API data
  const allWorkers = apiWorkers.length > 0 ? apiWorkers : workers

  const filteredWorkers = allWorkers

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      // Update search params
      const params = new URLSearchParams()
      if (newFilters.service) params.set('service', newFilters.service)
      if (newFilters.location) params.set('location', newFilters.location)
      if (newFilters.bookingType) params.set('bookingType', newFilters.bookingType)
      if (newFilters.date) params.set('date', newFilters.date)
      if (newFilters.time) params.set('time', newFilters.time)
      setSearchParams(params)
      return newFilters
    })
  }

  const clearFilters = () => {
    setFilters({
      service: '',
      location: '',
      bookingType: '',
      date: '',
      time: '',
      minPrice: 0,
      maxPrice: 1000,
      minRating: 0,
      available: false
    })
    setSearchParams({})
  }

  const activeFiltersCount = [
    filters.service,
    filters.location,
    filters.bookingType,
    filters.date,
    filters.time,
    filters.minRating > 0,
    filters.available
  ].filter(Boolean).length

  const handleWorkerClick = (workerId) => {
    navigate(`/worker/${workerId}`)
  }

  // Quick book handler
  const handleQuickBook = (worker) => {
    if (!user) {
      navigate('/login')
      return
    }
    setSelectedWorker(worker)
    setShowBookingModal(true)
  }

  // Calculate price for booking
  const calculatePrice = () => {
    if (!selectedWorker) return 0
    const rates = {
      hourly: selectedWorker.hourlyRate || 300,
      daily: (selectedWorker.hourlyRate || 300) * 8,
      weekly: (selectedWorker.hourlyRate || 300) * 8 * 5,
      monthly: (selectedWorker.hourlyRate || 300) * 8 * 22
    }
    return rates[bookingData.duration] * (bookingData.duration === 'hourly' ? bookingData.hours : 1)
  }

  // Submit quick booking
  const handleQuickBookingSubmit = async (e) => {
    e.preventDefault()
    if (!selectedWorker || !user) return

    const result = await addBooking({
      worker_id: selectedWorker.id,
      worker_name: selectedWorker.name,
      worker_photo: selectedWorker.photo,
      date: bookingData.date,
      time: bookingData.duration,
      duration: bookingData.duration === 'hourly' ? `${bookingData.hours} hours` : bookingData.duration,
      total_price: calculatePrice(),
      service_type: selectedWorker.profession
    })

    if (result.success) {
      showToast('Booking request sent successfully!', 'success')
      setShowBookingModal(false)
      setSelectedWorker(null)
      setBookingData({ date: '', duration: 'hourly', hours: 2 })
      navigate('/dashboard')
    } else {
      showToast(result.error || 'Booking failed', 'error')
    }
  }

  return (
    <div className="pt-20 min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search by location..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-input focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <select
                value={filters.service}
                onChange={(e) => handleFilterChange('service', e.target.value)}
                className="px-4 py-3 border border-border rounded-input focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none bg-white min-w-[180px]"
              >
                <option value="">All Services</option>
                <option value="House Cleaning">House Cleaning</option>
                <option value="Baby Care">Baby Care</option>
                <option value="Cooking">Cooking</option>
                <option value="Elder Care">Elder Care</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center space-x-2 px-5 py-3 border border-border rounded-input hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Booking Type */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Booking Type
                  </label>
                  <select
                    value={filters.bookingType}
                    onChange={(e) => handleFilterChange('bookingType', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-input focus:border-primary outline-none appearance-none bg-white"
                  >
                    <option value="">Any</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-border rounded-input focus:border-primary outline-none"
                  />
                </div>

                {/* Time Slot */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Time Slot
                  </label>
                  <select
                    value={filters.time}
                    onChange={(e) => handleFilterChange('time', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-input focus:border-primary outline-none appearance-none bg-white"
                  >
                    <option value="">Any Time</option>
                    <option value="morning">Morning (6AM-12PM)</option>
                    <option value="afternoon">Afternoon (12PM-4PM)</option>
                    <option value="evening">Evening (4PM-8PM)</option>
                    <option value="night">Night (8PM-10PM)</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Price Range (₹/hr)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-input focus:border-primary outline-none text-sm"
                      placeholder="Min"
                    />
                    <span className="text-text-secondary">-</span>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-input focus:border-primary outline-none text-sm"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-input focus:border-primary outline-none appearance-none bg-white"
                  >
                    <option value="0">Any Rating</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Availability
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.available}
                      onChange={(e) => handleFilterChange('available', e.target.checked)}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="text-sm text-text-secondary">Available Now</span>
                  </label>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-1 text-accent hover:text-red-700 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-text-secondary">
            {loading ? 'Searching...' : `${filteredWorkers.length} helpers found`}
          </p>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-card shadow-card overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && filteredWorkers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker, index) => (
              <div 
                key={worker.id} 
                className="animate-fadeIn cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleWorkerClick(worker.id)}
              >
                <WorkerCard worker={worker} onQuickBook={handleQuickBook} />
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredWorkers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchIcon className="w-12 h-12 text-text-secondary" />
            </div>
            <h3 className="font-heading text-xl font-semibold text-text-primary mb-2">
              No Helpers Found
            </h3>
            <p className="text-text-secondary mb-2">
              Try adjusting your filters or search in a different location
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 border border-border text-text-secondary rounded-btn hover:bg-gray-50 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Quick Booking Modal */}
      {showBookingModal && selectedWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading text-xl font-semibold">Quick Book {selectedWorker.name}</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-text-secondary hover:text-text-primary text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Worker Summary */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <img 
                src={selectedWorker.photo} 
                alt={selectedWorker.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold">{selectedWorker.name}</h3>
                <p className="text-sm text-text-secondary">{selectedWorker.profession}</p>
                <p className="text-primary font-semibold">₹{selectedWorker.hourlyRate}/hr</p>
              </div>
            </div>
            
            <form onSubmit={handleQuickBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-border rounded-input focus:border-primary outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <select
                  value={bookingData.duration}
                  onChange={(e) => setBookingData({...bookingData, duration: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded-input focus:border-primary outline-none appearance-none bg-white"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily (8 hours)</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              {bookingData.duration === 'hourly' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={bookingData.hours}
                    onChange={(e) => setBookingData({...bookingData, hours: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-border rounded-input focus:border-primary outline-none"
                  />
                </div>
              )}
              
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">₹{calculatePrice()}</span>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors font-semibold"
              >
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
