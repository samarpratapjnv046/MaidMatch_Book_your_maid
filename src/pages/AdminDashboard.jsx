import { useState, useEffect, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { 
  Users, UserCheck, Calendar, DollarSign, Shield, 
  LogOut, BarChart3, FileText, CheckCircle, XCircle,
  AlertCircle, Trash2, Search, TrendingUp, MessageSquare,
  CreditCard, RefreshCw, PieChart, Activity, Menu, X,
  Phone, Mail, MapPin, Clock, Star, Briefcase, Eye, Wifi, WifiOff
} from 'lucide-react'
import useRealTime from '../hooks/useRealTime'

const API_URL = 'http://localhost:3001/api'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [workers, setWorkers] = useState([])
  const [customers, setCustomers] = useState([])
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [paymentStats, setPaymentStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Detail modals
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [workerBookings, setWorkerBookings] = useState([])
  const [customerBookings, setCustomerBookings] = useState([])
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  
  // Booking status modal
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [bookingStatusModal, setBookingStatusModal] = useState(false)
  
  // Complaint modal
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [complaintModal, setComplaintModal] = useState(false)

  // Ban modal
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [banUserType, setBanUserType] = useState(null)
  const [banUserId, setBanUserId] = useState(null)
  const [banDays, setBanDays] = useState('')
  const [banReason, setBanReason] = useState('')

  // Real-time connection state
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  // Handle real-time data updates
  const handleRealTimeUpdate = useCallback((update) => {
    console.log('Real-time update received:', update)
    fetchData()
  }, [])

  // Use real-time hook
  const { isConnected } = useRealTime(handleRealTimeUpdate)

  useEffect(() => {
    setIsRealtimeConnected(isConnected)
  }, [isConnected])

  useEffect(() => {
    const userData = localStorage.getItem('maidmatch_user')
    if (!userData) {
      window.location.href = '/admin/login'
      return
    }
    
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      window.location.href = '/403'
      return
    }
    
    setUser(parsedUser)
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('maidmatch_token')
    
    try {
      const [statsRes, customersRes, workersRes, bookingsRes, paymentsRes, paymentsStatsRes, complaintsRes, logsRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/customers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/workers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/bookings`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/payments`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/payments/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/complaints`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/audit-logs`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/analytics`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      setStats(await statsRes.json())
      const customersData = await customersRes.json()
      const workersData = await workersRes.json()
      setCustomers(customersData)
      setWorkers(workersData)
      setUsers([...customersData, ...workersData])
      setBookings(await bookingsRes.json())
      setPayments(await paymentsRes.json())
      setPaymentStats(await paymentsStatsRes.json())
      setComplaints(await complaintsRes.json())
      setAuditLogs(await logsRes.json())
      setAnalytics(await analyticsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('maidmatch_token')
    localStorage.removeItem('maidmatch_user')
    window.location.href = '/'
  }

  const handleVerify = async (workerId) => {
    const token = localStorage.getItem('maidmatch_token')
    await fetch(`${API_URL}/workers/${workerId}/verify`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchData()
  }

  const openBanModal = (userId, userType, isCurrentlyBanned) => {
    if (isCurrentlyBanned) {
      handleBan(userId, userType, true)
    } else {
      setBanUserId(userId)
      setBanUserType(userType)
      setBanDays('')
      setBanReason('')
      setBanModalOpen(true)
    }
  }

  const handleBan = async (userId, userType, isUnban = false) => {
    const token = localStorage.getItem('maidmatch_token')
    
    if (userType === 'worker') {
      await fetch(`${API_URL}/workers/${userId}/ban`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          days: isUnban ? 0 : parseInt(banDays) || 0,
          reason: banReason
        })
      })
    } else {
      await fetch(`${API_URL}/customers/${userId}/ban`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          days: isUnban ? 0 : parseInt(banDays) || 0,
          reason: banReason
        })
      })
    }
    setBanModalOpen(false)
    setBanDays('')
    setBanReason('')
    fetchData()
  }

  const handleDelete = async (userId, userType) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    
    const token = localStorage.getItem('maidmatch_token')
    if (userType === 'worker') {
      await fetch(`${API_URL}/workers/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } else {
      await fetch(`${API_URL}/customers/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    }
    fetchData()
  }

  const viewWorkerDetails = async (worker) => {
    console.log('Opening worker details for:', worker.name, 'ID:', worker._id, 'Has Aadhar:', !!worker.aadhar_number, 'Has Photo:', !!worker.aadhar_photo);
    
    try {
      const token = localStorage.getItem('maidmatch_token')
      console.log('Fetching from:', `http://localhost:3001/api/admin/workers/${worker._id}`);
      
      const response = await fetch(`http://localhost:3001/api/admin/workers/${worker._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const fullWorker = await response.json()
      console.log('Full worker data:', fullWorker);
      
      // Ensure photo URLs are full
      if (fullWorker.aadhar_photo && !fullWorker.aadhar_photo.startsWith('http')) {
        fullWorker.aadhar_photo = `http://localhost:3001/${fullWorker.aadhar_photo}`;
      }
      
      setSelectedWorker(fullWorker)
      const workerBookingsList = bookings.filter(b => b.worker_id === worker._id || (b.worker_id?._id === worker._id))
      setWorkerBookings(workerBookingsList)
      setDetailModalOpen(true)
    } catch (error) {
      console.error('Error fetching worker details:', error)
      console.log('Using fallback worker data:', worker);
      
      // Fallback to basic worker data with full photo URL
      const fallbackWorker = { ...worker };
      if (fallbackWorker.aadhar_photo && !fallbackWorker.aadhar_photo.startsWith('http')) {
        fallbackWorker.aadhar_photo = `http://localhost:3001/${fallbackWorker.aadhar_photo}`;
      }
      setSelectedWorker(fallbackWorker)
      const workerBookingsList = bookings.filter(b => b.worker_id === worker._id || (b.worker_id?._id === worker._id))
      setWorkerBookings(workerBookingsList)
      setDetailModalOpen(true)
    }
  }

  const viewCustomerDetails = async (customer) => {
    setSelectedCustomer(customer)
    const customerBookingsList = bookings.filter(b => b.user_id === customer._id || b.user_id?._id === customer._id)
    setCustomerBookings(customerBookingsList)
    setDetailModalOpen(true)
  }

  const handleUpdateBookingStatus = async (bookingId, status) => {
    const token = localStorage.getItem('maidmatch_token')
    await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ status })
    })
    setBookingStatusModal(false)
    setSelectedBooking(null)
    fetchData()
  }

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return
    
    const token = localStorage.getItem('maidmatch_token')
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchData()
      } else {
        alert('Failed to delete booking')
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
    }
  }

  const handleApproveCancelRequest = async (bookingId, action) => {
    const token = localStorage.getItem('maidmatch_token')
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/approve-cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      })
      const data = await response.json()
      if (response.ok) {
        alert(data.message)
        fetchData()
      } else {
        alert(data.error || 'Failed to process')
      }
    } catch (error) {
      console.error('Error processing cancel request:', error)
    }
  }

  const handleUpdateComplaint = async (complaintId, status, resolutionNotes) => {
    const token = localStorage.getItem('maidmatch_token')
    await fetch(`${API_URL}/admin/complaints/${complaintId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ status, resolution_notes: resolutionNotes })
    })
    setComplaintModal(false)
    setSelectedComplaint(null)
    fetchData()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'confirmed': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'refunded': return 'bg-purple-100 text-purple-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Show ALL workers and customers - no filtering by banned status
  const filteredWorkers = workers.filter(w => 
    w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredBookings = bookings.filter(b => 
    b.worker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'workers', label: 'Workers', icon: UserCheck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'complaints', label: 'Complaints', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-400">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span className="text-white font-bold">Admin</span>
        </div>
        <button onClick={handleLogout} className="p-2 text-red-400">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-700 p-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-emerald-400" />
                <span className="text-white font-bold">Admin</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm ${
                    activeTab === item.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-slate-900 border-r border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            <span className="text-white font-bold text-lg">AdminHub</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm ${
                activeTab === item.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs">Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-slate-800/50 border-b border-slate-700 px-6 py-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{menuItems.find(m => m.id === activeTab)?.label}</h1>
            <p className="text-slate-400 text-sm">Welcome, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-emerald-400 text-sm">Online</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-3 md:p-4 lg:p-6">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <div className="bg-slate-800/50 rounded-xl p-4 lg:p-6 border border-slate-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs lg:text-sm">Total Users</p>
                  <p className="text-2xl lg:text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 lg:p-6 border border-slate-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs lg:text-sm">Workers</p>
                  <p className="text-2xl lg:text-3xl font-bold text-white">{stats?.verifiedWorkers || 0}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 lg:p-6 border border-slate-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-yellow-400" />
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs lg:text-sm">Bookings</p>
                  <p className="text-2xl lg:text-3xl font-bold text-white">{stats?.totalBookings || 0}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 lg:p-6 border border-slate-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs lg:text-sm">Revenue</p>
                  <p className="text-2xl lg:text-3xl font-bold text-white">₹{stats?.revenue?.toLocaleString() || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-slate-800/50 rounded-xl p-4 lg:p-6 border border-slate-700">
                  <h3 className="text-white font-semibold mb-4 text-sm lg:text-base">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setActiveTab('workers')} className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left">
                      <UserCheck className="w-6 h-6 text-emerald-400 mb-2" />
                      <p className="text-white text-sm font-medium">Pending</p>
                      <p className="text-slate-400 text-xs">{workers.filter(w => !w.is_verified).length} workers</p>
                    </button>
                    <button onClick={() => setActiveTab('complaints')} className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left">
                      <AlertCircle className="w-6 h-6 text-yellow-400 mb-2" />
                      <p className="text-white text-sm font-medium">Complaints</p>
                      <p className="text-slate-400 text-xs">{complaints.filter(c => c.status === 'open').length} open</p>
                    </button>
                    <button onClick={() => setActiveTab('bookings')} className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left">
                      <Calendar className="w-6 h-6 text-blue-400 mb-2" />
                      <p className="text-white text-sm font-medium">Bookings</p>
                      <p className="text-slate-400 text-xs">{bookings.filter(b => b.status === 'pending').length} pending</p>
                    </button>
                    <button onClick={() => setActiveTab('analytics')} className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left">
                      <Activity className="w-6 h-6 text-purple-400 mb-2" />
                      <p className="text-white text-sm font-medium">Analytics</p>
                      <p className="text-slate-400 text-xs">View insights</p>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 lg:p-6 border border-slate-700">
                  <h3 className="text-white font-semibold mb-4 text-sm lg:text-base">Recent Activity</h3>
                  <div className="space-y-3 max-h-48 lg:max-h-64 overflow-y-auto">
                    {auditLogs.slice(0, 5).map(log => (
                      <div key={log._id} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-xs lg:text-sm truncate">{log.details || log.action.replace(/_/g, ' ')}</p>
                          <p className="text-slate-500 text-xs">{new Date(log.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workers */}
          {activeTab === 'workers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search workers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <span className="text-slate-400 text-sm self-center">{filteredWorkers.length} workers</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium">Worker</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium hidden md:table-cell">Services</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map(worker => (
                      <tr 
                        key={worker._id} 
                        className="border-t border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
                        onClick={() => viewWorkerDetails(worker)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={worker.photo || `https://ui-avatars.com/api/?name=${worker.name}&background=22c55e&color=fff`} alt="" className="w-8 h-8 rounded-full" />
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate max-w-[120px]">{worker.name}</p>
                              <p className="text-slate-400 text-xs truncate max-w-[120px]">{worker.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {worker.services?.slice(0, 2).map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {worker.is_banned ? (
                            <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle className="w-3 h-3" /> Banned</span>
                          ) : worker.is_verified ? (
                            <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3" /> Verified</span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-400 text-xs"><AlertCircle className="w-3 h-3" /> Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">Click row to view</span>
                            <div className="ml-auto flex gap-1">
                              {!worker.is_verified && !worker.is_banned && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleVerify(worker._id); }} 
                                  className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded" 
                                  title="Verify"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); openBanModal(worker._id, 'worker', worker.is_banned); }} 
                                className={`p-1.5 rounded ${worker.is_banned ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-yellow-400 hover:bg-yellow-500/20'}`} 
                                title={worker.is_banned ? 'Unban' : 'Ban'}
                              >
                                {worker.is_banned ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(worker._id, 'worker'); }} 
                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" 
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customers */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <span className="text-slate-400 text-sm self-center">{filteredCustomers.length} customers</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium">Customer</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium hidden sm:table-cell">Phone</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(customer => (
                      <tr key={customer._id} className="border-t border-slate-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={customer.photo || `https://ui-avatars.com/api/?name=${customer.name}&background=3b82f6&color=fff`} alt="" className="w-8 h-8 rounded-full" />
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate max-w-[120px]">{customer.name}</p>
                              <p className="text-slate-400 text-xs truncate max-w-[120px]">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-sm hidden sm:table-cell">{customer.phone || '-'}</td>
                        <td className="py-3 px-4">
                          {customer.is_banned ? (
                            <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle className="w-3 h-3" /> Banned</span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3" /> Active</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <button onClick={() => viewCustomerDetails(customer)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => openBanModal(customer._id, 'customer', customer.is_banned)} className={`p-1.5 rounded ${customer.is_banned ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-yellow-400 hover:bg-yellow-500/20'}`} title={customer.is_banned ? 'Unban' : 'Ban'}>
                              {customer.is_banned ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDelete(customer._id, 'customer')} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bookings */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <span className="text-slate-400 text-sm self-center">{filteredBookings.length} bookings</span>
              </div>

              <div className="space-y-3">
                {filteredBookings.map(booking => (
                  <div key={booking._id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => window.location.href = `/booking/${booking._id}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>{booking.status === 'completed' ? 'Work Completed' : booking.status === 'offer_pending' ? 'Waiting for Worker' : booking.status}</span>
                          <span className="text-slate-400 text-xs">{booking.service_type}</span>
                          {booking.cancel_requested && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">⚠ Cancel Requested</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <img src={booking.worker_photo || `https://ui-avatars.com/api/?name=${booking.worker_name}&background=22c55e&color=fff`} alt="" className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="text-white text-sm font-medium">{booking.worker_name}</p>
                            <p className="text-slate-400 text-xs">{booking.user_id?.name}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs text-slate-400">
                          <span>{booking.date}</span>
                          <span>{booking.time}</span>
                          <span>{booking.duration}</span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xl font-bold text-white">₹{booking.total_price?.toLocaleString()}</p>
                        <div className="flex gap-2 flex-wrap">
                          {booking.cancel_requested && (
                            <>
                              <button onClick={() => handleApproveCancelRequest(booking._id, 'approve')} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs">Approve Cancel</button>
                              <button onClick={() => handleApproveCancelRequest(booking._id, 'reject')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs">Reject Cancel</button>
                            </>
                          )}
                          <button onClick={() => { setSelectedBooking(booking); setBookingStatusModal(true); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs">
                            Update
                          </button>
                          <button onClick={() => handleDeleteBooking(booking._id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs flex items-center gap-1">
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {activeTab === 'payments' && (
            <div className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <DollarSign className="w-6 h-6 text-emerald-400 mb-2" />
                  <p className="text-slate-400 text-xs">Total</p>
                  <p className="text-xl font-bold text-white">₹{paymentStats?.totalCollected?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <CreditCard className="w-6 h-6 text-purple-400 mb-2" />
                  <p className="text-slate-400 text-xs">Commission</p>
                  <p className="text-xl font-bold text-white">₹{paymentStats?.totalCommission?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <UserCheck className="w-6 h-6 text-blue-400 mb-2" />
                  <p className="text-slate-400 text-xs">Workers</p>
                  <p className="text-xl font-bold text-white">₹{paymentStats?.totalWorkerEarnings?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <AlertCircle className="w-6 h-6 text-yellow-400 mb-2" />
                  <p className="text-slate-400 text-xs">Pending</p>
                  <p className="text-xl font-bold text-white">{paymentStats?.pendingPayments || 0}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium">Transaction</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium hidden sm:table-cell">Customer</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium hidden md:table-cell">Worker</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-xs font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment._id} className="border-t border-slate-700">
                        <td className="py-3 px-4 text-white text-xs font-mono">{payment.transaction_id}</td>
                        <td className="py-3 px-4 text-slate-300 text-xs hidden sm:table-cell">{payment.user_id?.name}</td>
                        <td className="py-3 px-4 text-slate-300 text-xs hidden md:table-cell">{payment.worker_id?.name}</td>
                        <td className="py-3 px-4 text-white font-medium text-sm">₹{payment.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Complaints */}
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">Open</p>
                  <p className="text-xl font-bold text-white">{complaints.filter(c => c.status === 'open').length}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                  <Activity className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">Review</p>
                  <p className="text-xl font-bold text-white">{complaints.filter(c => c.status === 'in_review').length}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">Resolved</p>
                  <p className="text-xl font-bold text-white">{complaints.filter(c => c.status === 'resolved').length}</p>
                </div>
              </div>

              <div className="space-y-3">
                {complaints.map(complaint => (
                  <div key={complaint._id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">{complaint.priority}</span>
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">{complaint.status}</span>
                        </div>
                        <h3 className="text-white font-medium text-sm mb-1">{complaint.subject}</h3>
                        <p className="text-slate-400 text-xs mb-2">{complaint.description}</p>
                        <div className="text-xs text-slate-500">
                          <span>{complaint.complainant_id?.name}</span>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedComplaint(complaint); setComplaintModal(true); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs self-start">
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 lg:space-y-6">
              <div className="bg-slate-800/50 rounded-xl p-4 lg:p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4 text-sm lg:text-base">Popular Services</h3>
                <div className="space-y-3">
                  {analytics?.serviceStats?.map((service, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-emerald-500/20 rounded text-emerald-400 text-xs flex items-center justify-center">{i + 1}</span>
                        <span className="text-white text-sm">{service._id || 'Unknown'}</span>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-slate-400">{service.count}</span>
                        <span className="text-emerald-400">₹{service.revenue?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 lg:p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-4 text-sm lg:text-base">Top Workers</h3>
                <div className="space-y-2">
                  {analytics?.topWorkers?.slice(0, 5).map((worker, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : 'bg-slate-700 text-slate-400'}`}>{i + 1}</span>
                        <span className="text-white text-sm">{worker.worker_name}</span>
                      </div>
                      <span className="text-emerald-400 text-sm">₹{worker.revenue?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-2">
              {auditLogs.map(log => (
                <div key={log._id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <div>
                      <p className="text-white text-sm capitalize">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-slate-400 text-xs">{log.details}</p>
                    </div>
                    <div className="text-slate-500 text-xs">
                      <p>{log.admin_id?.name}</p>
                      <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal for Worker/Customer */}
      {detailModalOpen && (selectedWorker || selectedCustomer) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 md:p-8 overflow-y-auto max-h-screen">
          <div className="bg-slate-800 rounded-2xl p-4 md:p-6 max-w-md md:max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-start mb-4 md:mb-6 pb-4 border-b border-slate-700">
              <h3 className="text-white font-semibold text-base md:text-lg">
                {selectedWorker ? 'Worker Details' : 'Customer Details'}
              </h3>
              <button 
                onClick={() => { setDetailModalOpen(false); setSelectedWorker(null); setSelectedCustomer(null); }} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
              <img 
                src={selectedWorker?.photo || selectedCustomer?.photo || `https://ui-avatars.com/api/?name=${selectedWorker?.name || selectedCustomer?.name}&background=22c55e&color=fff`} 
                alt="" 
                className="w-20 h-20 md:w-24 md:h-24 rounded-xl flex-shrink-0 mx-auto md:mx-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-lg md:text-xl truncate">{selectedWorker?.name || selectedCustomer?.name}</h4>
                <p className="text-slate-400 text-sm md:text-base truncate max-w-full">{selectedWorker?.email || selectedCustomer?.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {selectedWorker?.is_verified ? (
                    <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-xs font-medium">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-md text-xs font-medium">
                      <AlertCircle className="w-3 h-3" /> Unverified
                    </span>
                  )}
                  {(selectedWorker?.is_banned || selectedCustomer?.is_banned) && (
                    <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded-md text-xs font-medium">
                      <XCircle className="w-3 h-3" /> Banned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Registration Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
              <div className="bg-slate-700/30 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 text-xs font-medium">Email</span>
                </div>
                <p className="text-white text-sm break-all">{selectedWorker?.email || selectedCustomer?.email}</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 text-xs font-medium">Phone</span>
                </div>
                <p className="text-white text-sm">{selectedWorker?.phone || selectedCustomer?.phone || 'Not provided'}</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 text-xs font-medium">Location</span>
                </div>
                <p className="text-white text-sm truncate">{selectedWorker?.location || selectedCustomer?.location || 'Not provided'}</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 text-xs font-medium">Joined</span>
                </div>
                <p className="text-white text-sm">{selectedWorker?.created_at ? new Date(selectedWorker.created_at).toLocaleDateString() : selectedCustomer?.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : 'Unknown'}</p>
              </div>
            </div>

            {/* Worker Specific Details */}
            {selectedWorker && (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                    <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400 text-xs md:text-sm font-medium">Services Offered</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorker.services?.map((service, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium whitespace-nowrap">
                        {service}
                      </span>
                    )) || <span className="text-slate-400 text-sm italic">No services listed</span>}
                  </div>
                </div>
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                    <Star className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400 text-xs md:text-sm font-medium">Experience</span>
                  </div>
                  <p className="text-white text-sm">{selectedWorker.experience || 'Not provided'}</p>
                </div>
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                    <UserCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400 text-xs md:text-sm font-medium">Skills</span>
                  </div>
                  <p className="text-white text-sm line-clamp-3">{selectedWorker.skills || 'Not provided'}</p>
                </div>
                {selectedWorker.bio && (
                  <div className="mb-4 md:mb-6">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-400 text-xs md:text-sm font-medium">Bio</span>
                    </div>
                    <p className="text-white text-sm line-clamp-4">{selectedWorker.bio}</p>
                  </div>
                )}
                {/* Documents Section */}
                {selectedWorker.aadhar_number && (
                  <div className="mb-4 md:mb-6">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                      <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-400 text-xs md:text-sm font-medium">Documents</span>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 md:p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3">
                        <div>
                          <label className="text-slate-400 text-xs font-medium block mb-1">Aadhar Number</label>
                          <p className="text-white font-mono text-sm bg-black/30 px-3 py-1.5 rounded-md border border-slate-600">
                            {selectedWorker.aadhar_number.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2 ****')}
                          </p>
                        </div>
                        {selectedWorker.aadhar_photo && (
                          <div>
                            <label className="text-slate-400 text-xs font-medium block mb-1">Aadhar Photo</label>
                            <div className="relative group cursor-pointer">
                              <img 
                                src={selectedWorker.aadhar_photo} 
                                alt="Aadhar" 
                                className="w-full h-20 md:h-24 object-cover rounded-lg border-2 border-slate-600 hover:border-emerald-500/50 transition-all bg-slate-800"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const img = document.createElement('img')
                                  img.src = selectedWorker.aadhar_photo
                                  img.className = 'max-w-[95vw] max-h-[95vh] rounded-xl shadow-2xl'
                                  const modal = document.createElement('div')
                                  modal.className = 'fixed inset-0 bg-black/95 flex items-center justify-center z-[99999] p-4'
                                  modal.appendChild(img)
                                  modal.onclick = (ev) => {
                                    if (ev.target === modal) {
                                      document.body.removeChild(modal)
                                    }
                                  }
                                  img.onclick = (ev) => ev.stopPropagation()
                                  document.body.appendChild(modal)
                                }}
                              />
                              <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <Eye className="w-5 h-5 md:w-6 md:h-6 text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-md font-medium">Verified Document</span>
                        {selectedWorker.is_verified ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-md font-bold border border-emerald-400/30">Profile Verified</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-md font-medium">Pending Verification</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Booking History */}
            <div className="mb-6 pb-4 border-t border-slate-700 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-400 text-xs md:text-sm font-medium">Booking History</span>
              </div>
              <div className="space-y-2 max-h-32 md:max-h-48 overflow-y-auto">
                {(selectedWorker ? workerBookings : customerBookings)?.length > 0 ? (
                  (selectedWorker ? workerBookings : customerBookings)?.slice(0, 5).map(booking => (
                    <div key={booking._id} className="bg-slate-700/30 rounded-lg p-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <div>
                          <p className="text-white font-medium truncate">{booking.service_type}</p>
                          <p className="text-slate-400">{booking.date} at {booking.time}</p>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-emerald-400 font-medium">₹{booking.total_price}</p>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(booking.status)}`}>
                            {booking.status === 'completed' ? 'Completed' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm text-center py-4 italic">No bookings found</p>
                )}
              </div>
              {(selectedWorker ? workerBookings : customerBookings)?.length > 5 && (
                <p className="text-slate-400 text-xs text-center mt-1">+{(selectedWorker ? workerBookings : customerBookings)?.length - 5} more</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-700">
              {selectedWorker && !selectedWorker.is_verified && !selectedWorker.is_banned && (
                <button onClick={() => { handleVerify(selectedWorker._id); setDetailModalOpen(false); }} className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-lg transition-all">
                  Verify Worker
                </button>
              )}
              {selectedWorker && (
                <button onClick={() => { openBanModal(selectedWorker._id, 'worker', selectedWorker.is_banned); setDetailModalOpen(false); }} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium shadow-lg transition-all ${selectedWorker.is_banned ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white border border-yellow-500/50'}`}>
                  {selectedWorker.is_banned ? 'Unban Worker' : 'Ban Worker'}
                </button>
              )}
              {selectedCustomer && (
                <button onClick={() => { openBanModal(selectedCustomer._id, 'customer', selectedCustomer.is_banned); setDetailModalOpen(false); }} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium shadow-lg transition-all ${selectedCustomer.is_banned ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white border border-yellow-500/50'}`}>
                  {selectedCustomer.is_banned ? 'Unban Customer' : 'Ban Customer'}
                </button>
              )}
              <button onClick={() => { setDetailModalOpen(false); setSelectedWorker(null); setSelectedCustomer(null); }} className="flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium shadow-lg transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Status Modal */}
      {bookingStatusModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm border border-slate-700">
            <h3 className="text-white font-semibold mb-4">Update Status</h3>
            <div className="space-y-2">
              {['pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => handleUpdateBookingStatus(selectedBooking._id, status)}
                  className={`w-full p-3 rounded-lg text-sm capitalize ${
                    selectedBooking.status === status ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <button onClick={() => { setBookingStatusModal(false); setSelectedBooking(null); }} className="mt-4 w-full py-2.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {complaintModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-white font-semibold mb-4">Review Complaint</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-slate-400 text-xs">Status</label>
                <select id="complaintStatus" className="w-full mt-1 p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                  <option value="open">Open</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs">Notes</label>
                <textarea id="resolutionNotes" rows="3" className="w-full mt-1 p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400" placeholder="Resolution notes..."></textarea>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setComplaintModal(false); setSelectedComplaint(null); }} className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600">
                Cancel
              </button>
              <button onClick={() => {
                const status = document.getElementById('complaintStatus').value;
                const notes = document.getElementById('resolutionNotes').value;
                handleUpdateComplaint(selectedComplaint._id, status, notes);
              }} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-white font-semibold mb-4">Ban {banUserType}</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-slate-400 text-xs">Number of days to ban *</label>
                <input
                  type="number"
                  min="1"
                  value={banDays}
                  onChange={(e) => setBanDays(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400"
                  placeholder="Enter number of days"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs">Reason (optional)</label>
                <textarea
                  rows="3"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400"
                  placeholder="Reason for banning..."
                ></textarea>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setBanModalOpen(false); setBanDays(''); setBanReason(''); }} className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600">
                Cancel
              </button>
              <button 
                onClick={() => handleBan(banUserId, banUserType, false)} 
                disabled={!banDays || parseInt(banDays) <= 0}
                className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
