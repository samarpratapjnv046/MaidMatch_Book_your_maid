import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Toast, { ToastContainer } from './components/Toast'
import Home from './pages/Home'
import Search from './pages/Search'
import WorkerDetails from './pages/WorkerDetails'
import BookingConfirmation from './pages/BookingConfirmation'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import WorkerDashboard from './pages/WorkerDashboard'

// Create auth context
export const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

// Create Toast context
export const ToastContext = createContext(null)

export const useToast = () => useContext(ToastContext)

const API_URL = 'http://localhost:3001/api'

// Default workers for initial render
const defaultWorkers = [
  {
    id: 1,
    name: 'Priya Sharma',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    profession: 'House Cleaning',
    rating: 4.9,
    reviews: 127,
    hourlyRate: 300,
    experience: '5 years',
    skills: ['Deep Cleaning', 'Regular Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning'],
    location: 'Mumbai, Maharashtra',
    available: true,
    bio: 'Experienced house cleaner with excellent attention to detail. Certified in modern cleaning techniques.',
    languages: ['Hindi', 'English', 'Marathi'],
    responseTime: '< 1 hour'
  },
  {
    id: 2,
    name: 'Sunita Devi',
    photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop&crop=face',
    profession: 'Baby Care',
    rating: 4.8,
    reviews: 89,
    hourlyRate: 400,
    experience: '7 years',
    skills: ['Newborn Care', 'Toddler Care', 'Meal Preparation', 'Homework Help'],
    location: 'Delhi, NCR',
    available: true,
    bio: 'Certified childcare specialist with experience in newborn and toddler care. Patient and loving.',
    languages: ['Hindi', 'English'],
    responseTime: '< 2 hours'
  },
  {
    id: 3,
    name: 'Radha Krishnan',
    photo: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop&crop=face',
    profession: 'Cooking',
    rating: 4.7,
    reviews: 156,
    hourlyRate: 350,
    experience: '10 years',
    skills: ['North Indian', 'South Indian', 'Vegetarian', 'Tiffin Service'],
    location: 'Bangalore, Karnataka',
    available: true,
    bio: 'Professional cook specializing in authentic Indian cuisine. Can prepare meals for families of any size.',
    languages: ['Tamil', 'Kannada', 'Hindi', 'English'],
    responseTime: '< 1 hour'
  },
  {
    id: 4,
    name: 'Kamla Singh',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
    profession: 'Elder Care',
    rating: 4.9,
    reviews: 73,
    hourlyRate: 500,
    experience: '8 years',
    skills: ['Elderly Companion', 'Medical Assistance', 'Physiotherapy Support', 'Medication Reminder'],
    location: 'Gurgaon, Haryana',
    available: true,
    bio: 'Compassionate elder care specialist with nursing background. Trained in elderly care and medical assistance.',
    languages: ['Hindi', 'English', 'Punjabi'],
    responseTime: '< 3 hours'
  }
]

function AppContent() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isWorkerRoute = location.pathname.startsWith('/worker')
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('maidmatch_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => {
    return localStorage.getItem('maidmatch_token') || null
  })
  const [bookings, setBookings] = useState([])
  const [workers, setWorkers] = useState(defaultWorkers)
  const [loading, setLoading] = useState(true)
  
  // Saved workers state
  const [savedWorkers, setSavedWorkers] = useState(() => {
    const saved = localStorage.getItem('maidmatch_saved_workers')
    return saved ? JSON.parse(saved) : []
  })
  
  // Toast notifications state
  const [toasts, setToasts] = useState([])

  // Add toast notification
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }

  // Remove toast notification
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Fetch workers from API
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await fetch(`${API_URL}/workers`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.length > 0) {
            // Transform MongoDB workers to match frontend format
            const transformedWorkers = data.map(w => ({
              id: w._id,
              name: w.name,
              photo: w.photo,
              profession: w.services?.[0] || 'General',
              rating: 4.5,
              reviews: Math.floor(Math.random() * 100) + 10,
              hourlyRate: w.hourly_rate || 300,
              experience: w.experience || '2 years',
              skills: w.skills ? w.skills.split(',').map(s => s.trim()) : [],
              location: w.location || 'Not specified',
              available: !w.is_banned,
              bio: w.bio || 'Experienced professional',
              languages: ['Hindi', 'English'],
              responseTime: '< 2 hours'
            }))
            setWorkers(transformedWorkers)
          }
        }
      } catch (error) {
        console.log('Using default workers, API not available')
      } finally {
        setLoading(false)
      }
    }
    fetchWorkers()
  }, [token])

  // Fetch bookings when user logs in
  useEffect(() => {
    const fetchBookings = async () => {
      if (!token) {
        setBookings([])
        return
      }
      try {
        const response = await fetch(`${API_URL}/bookings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          // Transform MongoDB bookings
          const transformedBookings = data.map(b => ({
            id: b._id,
            worker_name: b.worker_name,
            worker_photo: b.worker_photo,
            service_type: b.service_type,
            date: b.date,
            time: b.time,
            duration: b.duration,
            total_price: b.total_price,
            offer_price: b.offer_price,
            notes: b.notes,
            status: b.status
          }))
          setBookings(transformedBookings)
        }
      } catch (error) {
        console.log('Could not fetch bookings')
      }
    }
    fetchBookings()
  }, [token])

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('maidmatch_user', JSON.stringify(data.user))
        localStorage.setItem('maidmatch_token', data.token)
return { success: true, bookingId: data.id }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Connection failed' }
    }
  }

  const register = async (userData) => {
    try {
      // Use separate endpoints based on role
      const endpoint = userData.role === 'worker' 
        ? `${API_URL}/auth/register/worker`
        : `${API_URL}/auth/register/customer`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Use the correct user data (could be user or worker)
        const user = data.user || data.worker
        
        // For workers, fetch full profile data after registration
        if (userData.role === 'worker' && user.id) {
          try {
            const profileResponse = await fetch(`${API_URL}/workers/${user.id}`, {
              headers: { 'Authorization': `Bearer ${data.token}` }
            })
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              // Merge registration data with full profile data
              const fullUserData = {
                ...user,
                ...profileData,
                hourly_rate: profileData.hourly_rate,
                daily_rate: profileData.daily_rate,
                monthly_rate: profileData.monthly_rate,
                services: profileData.services,
                experience: profileData.experience,
                skills: profileData.skills,
                bio: profileData.bio,
                availability: profileData.availability,
                address: profileData.address,
                city: profileData.city,
                state: profileData.state,
                pincode: profileData.pincode,
                location: profileData.location
              }
              setUser(fullUserData)
              localStorage.setItem('maidmatch_user', JSON.stringify(fullUserData))
              setToken(data.token)
              localStorage.setItem('maidmatch_token', data.token)
              return { success: true }
            }
          } catch (profileError) {
            console.log('Could not fetch full profile, using registration data')
          }
        }
        
        // For customers or if worker profile fetch fails
        setUser(user)
        setToken(data.token)
        localStorage.setItem('maidmatch_user', JSON.stringify(user))
        localStorage.setItem('maidmatch_token', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Connection failed' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setBookings([])
    setSavedWorkers([])
    localStorage.removeItem('maidmatch_user')
    localStorage.removeItem('maidmatch_token')
    localStorage.removeItem('maidmatch_saved_workers')
  }

  // Save/Unsave worker functions
  const saveWorker = (worker) => {
    const isAlreadySaved = savedWorkers.some(w => w.id === worker.id)
    if (!isAlreadySaved) {
      const newSavedWorkers = [...savedWorkers, worker]
      setSavedWorkers(newSavedWorkers)
      localStorage.setItem('maidmatch_saved_workers', JSON.stringify(newSavedWorkers))
      showToast(`${worker.name} added to saved helpers!`, 'success')
    }
  }

  const unsaveWorker = (workerId) => {
    const newSavedWorkers = savedWorkers.filter(w => w.id !== workerId)
    setSavedWorkers(newSavedWorkers)
    localStorage.setItem('maidmatch_saved_workers', JSON.stringify(newSavedWorkers))
    showToast('Helper removed from saved list', 'info')
  }

  const isWorkerSaved = (workerId) => {
    return savedWorkers.some(w => w.id === workerId)
  }

  const addBooking = async (bookingData) => {
    if (!token) {
      return { success: false, error: 'Please login first' }
    }
    
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Refresh bookings
        const bookingsResponse = await fetch(`${API_URL}/bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          const transformedBookings = bookingsData.map(b => ({
            id: b._id,
            worker_name: b.worker_name,
            worker_photo: b.worker_photo,
            service_type: b.service_type,
            date: b.date,
            time: b.time,
            duration: b.duration,
            total_price: b.total_price,
            offer_price: b.offer_price,
            notes: b.notes,
            status: b.status
          }))
          setBookings(transformedBookings)
        }
return { success: true, bookingId: data.id }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Connection failed' }
    }
  }

return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      <AuthContext.Provider value={{ 
        user, 
        login, 
        register, 
        logout, 
        workers, 
        bookings, 
        addBooking, 
        token,
        savedWorkers,
        saveWorker,
        unsaveWorker,
        isWorkerSaved,
        showToast
      }}>
        <div className="min-h-screen flex flex-col">
          {/* Toast Notifications */}
          {toasts.length > 0 && (
            <div className="fixed top-20 right-4 z-50 space-y-2">
              {toasts.map((toast) => (
                <Toast
                  key={toast.id}
                  message={toast.message}
                  type={toast.type}
                  duration={toast.duration}
                  onClose={() => removeToast(toast.id)}
                />
              ))}
            </div>
          )}
          
          {!isAdminRoute && !isWorkerRoute && <Navbar />}
          <main className="flex-1">
            <Routes>
<Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/worker/:id" element={<WorkerDetails />} />
              <Route path="/booking/:id" element={<BookingConfirmation />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/worker/dashboard" element={<WorkerDashboard />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
          </main>
          {!isAdminRoute && !isWorkerRoute && <Footer />}
        </div>
      </AuthContext.Provider>
    </ToastContext.Provider>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
