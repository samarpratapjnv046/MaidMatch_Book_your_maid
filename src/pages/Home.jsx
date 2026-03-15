import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Shield, Clock, Star, Users, CheckCircle, MapPin, Phone, Mail, Sparkles, Baby, Utensils, HeartPulse, Car, PawPrint, Home as HomeIcon } from 'lucide-react'
import WorkerCard from '../components/WorkerCard'
import { useAuth } from '../App'

export default function Home() {
  const navigate = useNavigate()
  const { workers, user } = useAuth()
  const [searchData, setSearchData] = useState({
    service: '',
    location: '',
    date: '',
    duration: 'hourly'
  })
  const [filterData, setFilterData] = useState({
    service: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    location: ''
  })
  const [filteredWorkers, setFilteredWorkers] = useState([])
  
  const services = [
    {
      id: 'house_cleaning',
      title: 'House Cleaning',
      description: 'Deep cleaning, regular maintenance, and move-in/move-out cleaning services.',
      icon: Sparkles,
      image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80',
      color: 'bg-green-500'
    },
    {
      id: 'baby_care',
      title: 'Baby Care',
      description: 'Certified nannies and babysitters for newborn and toddler care.',
      icon: Baby,
      image: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=800&q=80',
      color: 'bg-pink-500'
    },
    {
      id: 'cooking',
      title: 'Cooking',
      description: 'Professional cooks for daily meals, tiffin service, or special occasions.',
      icon: Utensils,
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
      color: 'bg-orange-500'
    },
    {
      id: 'elder_care',
      title: 'Elder Care',
      description: 'Compassionate caregivers for elderly with medical assistance.',
      icon: HeartPulse,
      image: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=800&q=80',
      color: 'bg-blue-500'
    },
    {
      id: 'driver',
      title: 'Driver',
      description: 'Professional drivers for personal and family use.',
      icon: Car,
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
      color: 'bg-purple-500'
    },
    {
      id: 'pet_care',
      title: 'Pet Care',
      description: 'Loving pet sitters and dog walkers for your furry friends.',
      icon: PawPrint,
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80',
      color: 'bg-yellow-500'
    }
  ]

  const testimonials = [
    {
      name: 'Priya Sharma',
      location: 'Mumbai',
      rating: 5,
      text: 'Found an amazing cook through MaidMatch. The verification process gave us peace of mind.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80'
    },
    {
      name: 'Rajesh Kumar',
      location: 'Delhi',
      rating: 5,
      text: 'Excellent service! The babysitter we hired is wonderful with our kids. Highly recommend!',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80'
    },
    {
      name: 'Anita Desai',
      location: 'Bangalore',
      rating: 5,
      text: 'The elder care support has been a blessing for our family. Professional and compassionate.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80'
    }
  ]

  useEffect(() => {
    let filtered = workers.filter(w => w.available)
    
    if (filterData.service) {
      filtered = filtered.filter(w => 
        w.profession?.toLowerCase().includes(filterData.service.toLowerCase()) ||
        w.services?.some(s => s.toLowerCase().includes(filterData.service.toLowerCase()))
      )
    }
    if (filterData.minPrice) {
      filtered = filtered.filter(w => w.hourlyRate >= parseInt(filterData.minPrice))
    }
    if (filterData.maxPrice) {
      filtered = filtered.filter(w => w.hourlyRate <= parseInt(filterData.maxPrice))
    }
    if (filterData.rating) {
      filtered = filtered.filter(w => w.rating >= parseFloat(filterData.rating))
    }
    if (filterData.location) {
      filtered = filtered.filter(w => 
        w.location?.toLowerCase().includes(filterData.location.toLowerCase())
      )
    }
    
    setFilteredWorkers(filtered.slice(0, 8))
  }, [workers, filterData])

  const featuredWorkers = filteredWorkers.length > 0 ? filteredWorkers : workers.filter(w => w.available).slice(0, 8)

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchData.service) params.append('service', searchData.service)
    if (searchData.location) params.append('location', searchData.location)
    if (searchData.duration) params.append('duration', searchData.duration)
    navigate(`/search?${params.toString()}`)
  }

  const handleServiceClick = (service) => {
    navigate(`/search?service=${service.title}`)
  }

  const handleWorkerClick = (workerId) => {
    navigate(`/worker/${workerId}`)
  }

  const clearFilters = () => {
    setFilterData({
      service: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      location: ''
    })
  }

  // Check if user is a worker
  const isWorker = user?.role === 'worker'

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80" 
            alt="Domestic workers" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30"></div>
        </div>

        <div className="absolute right-10 top-1/3 hidden lg:block space-y-4">
          <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80" alt="Maid" className="w-32 h-40 object-cover rounded-2xl shadow-2xl transform rotate-3" />
          <img src="https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300&q=80" alt="Babysitter" className="w-32 h-40 object-cover rounded-2xl shadow-2xl -rotate-2 ml-8" />
          <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=300&q=80" alt="Cook" className="w-32 h-40 object-cover rounded-2xl shadow-2xl rotate-2" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-4 py-1.5 bg-green-500/20 backdrop-blur-sm text-green-400 font-medium text-sm rounded-full">
                Trusted by 50,000+ Families
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Book Trusted Helpers
              <span className="text-green-500 block mt-2">For Your Home</span>
            </h1>
            <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl">
              Verified maids, babysitters, cooks, and caregivers. Book hourly, daily, weekly, or monthly. 
              Your perfect helper is just a click away.
            </p>

            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative md:col-span-2">
                  <select
                    value={searchData.service}
                    onChange={(e) => setSearchData({...searchData, service: e.target.value})}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none appearance-none bg-white text-gray-700"
                  >
                    <option value="">Select Service</option>
                    {services.map(s => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Location"
                    value={searchData.location}
                    onChange={(e) => setSearchData({...searchData, location: e.target.value})}
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none"
                  />
                </div>
                <div className="relative">
                  <select
                    value={searchData.duration}
                    onChange={(e) => setSearchData({...searchData, duration: e.target.value})}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none appearance-none bg-white text-gray-700"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center space-x-2 text-white/90">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Verified Professionals</span>
              </div>
              <div className="flex items-center space-x-2 text-white/90">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium">4.9+ Average Rating</span>
              </div>
              <div className="flex items-center space-x-2 text-white/90">
                <Clock className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Instant Booking</span>
              </div>
              <div className="flex items-center space-x-2 text-white/90">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Background Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curved divider */}
      <div className="relative -mt-24 pt-12">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
        </svg>
      </div>

      {/* Featured Workers Preview - Only show when NOT logged in */}
      {!user && (
        <section className="py-16 bg-white -mt-12 relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Meet Our Top Helpers</h2>
              <p className="text-gray-600">Verified professionals ready to help</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  name: 'Priya Sharma',
                  profession: 'House Cleaning',
                  rating: 4.9,
                  reviews: 127,
                  hourlyRate: 99,
                  experience: '5 years',
                  location: 'Mumbai, Maharashtra',
                  image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
                  skills: ['Deep Cleaning', 'Regular Cleaning', 'Kitchen Cleaning']
                },
                {
                  name: 'Sunita Devi',
                  profession: 'Baby Care',
                  rating: 4.8,
                  reviews: 89,
                  hourlyRate: 150,
                  experience: '7 years',
                  location: 'Delhi, NCR',
                  image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop&crop=face',
                  skills: ['Newborn Care', 'Toddler Care', 'Meal Preparation']
                },
                {
                  name: 'Radha Krishnan',
                  profession: 'Cooking',
                  rating: 4.7,
                  reviews: 156,
                  hourlyRate: 120,
                  experience: '10 years',
                  location: 'Bangalore, Karnataka',
                  image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop&crop=face',
                  skills: ['North Indian', 'South Indian', 'Vegetarian']
                },
                {
                  name: 'Kamla Singh',
                  profession: 'Elder Care',
                  rating: 4.9,
                  reviews: 73,
                  hourlyRate: 200,
                  experience: '8 years',
                  location: 'Gurgaon, Haryana',
                  image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
                  skills: ['Elderly Companion', 'Medical Assistance', 'Physiotherapy']
                }
              ].map((worker, index) => (
                <div key={index} className="group bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100">
                  {/* Header with image */}
                  <div className="relative h-32 bg-gradient-to-r from-green-500 to-green-600">
                    <img src={worker.image} alt={worker.name} className="w-24 h-24 rounded-full object-cover border-4 border-white absolute -bottom-12 left-1/2 -translate-x-1/2 shadow-md" />
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      {worker.rating}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="pt-16 pb-4 px-4">
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-gray-900 text-lg">{worker.name}</h3>
                      <p className="text-green-600 font-medium text-sm">{worker.profession}</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex justify-center gap-4 mb-4 text-xs text-gray-600">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{worker.experience}</p>
                        <p>Experience</p>
                      </div>
                      <div className="w-px bg-gray-200"></div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{worker.reviews}</p>
                        <p>Reviews</p>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-4">
                      <MapPin className="w-3 h-3" />
                      <span>{worker.location}</span>
                    </div>
                    
                    {/* Skills */}
                    <div className="flex flex-wrap justify-center gap-1 mb-4">
                      {worker.skills.map((skill, i) => (
                        <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                    
                    {/* Rate */}
                    <div className="text-center pt-3 border-t border-gray-100">
                      <span className="text-2xl font-bold text-green-600">₹{worker.hourlyRate}</span>
                      <span className="text-gray-500 text-sm">/hour</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-2 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Comprehensive domestic help solutions for every need</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div 
                key={index} 
                onClick={() => handleServiceClick(service)}
                className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className={`w-12 h-12 ${service.color} rounded-xl flex items-center justify-center mb-3`}>
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white text-xl font-bold mb-1">{service.title}</h3>
                  <p className="text-white/80 text-sm">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Workers - Only show when logged in as customer */}
      {user && !isWorker && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Browse Our Helpers</h2>
              <p className="text-gray-600">Filter and find the perfect helper for your needs</p>
            </div>

            <div className="bg-white rounded-2xl p-4 mb-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Filter by service..."
                    value={filterData.service}
                    onChange={(e) => setFilterData({...filterData, service: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filterData.minPrice}
                    onChange={(e) => setFilterData({...filterData, minPrice: e.target.value})}
                    className="w-20 px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-600 outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filterData.maxPrice}
                    onChange={(e) => setFilterData({...filterData, maxPrice: e.target.value})}
                    className="w-20 px-3 py-2.5 border border-gray-200 rounded-xl focus:border-green-600 outline-none"
                  />
                </div>
                <select
                  value={filterData.rating}
                  onChange={(e) => setFilterData({...filterData, rating: e.target.value})}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-600 outline-none appearance-none bg-white"
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+</option>
                  <option value="4">4+</option>
                </select>
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Location"
                    value={filterData.location}
                    onChange={(e) => setFilterData({...filterData, location: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-green-600 outline-none"
                  />
                </div>
                <button onClick={clearFilters} className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium">
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredWorkers.map((worker, index) => (
                <div 
                  key={worker.id || index}
                  className="cursor-pointer"
                  onClick={() => handleWorkerClick(worker.id)}
                >
                  <WorkerCard worker={worker} />
                </div>
              ))}
            </div>

            {featuredWorkers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No helpers found</p>
              </div>
            )}

            <div className="text-center mt-10">
              <button
                onClick={() => navigate('/search')}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                <span>View All Helpers</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose MaidMatch?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">We're committed to providing the best domestic help services</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Verified Professionals', desc: 'All helpers undergo rigorous background checks' },
              { icon: Clock, title: 'Flexible Booking', desc: 'Hourly, daily, weekly, or monthly options' },
              { icon: Star, title: 'Quality Rated', desc: '4.9+ average rating from verified reviews' },
              { icon: Users, title: '24/7 Support', desc: 'Round-the-clock customer assistance' }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
            <p className="text-gray-600">Trusted by thousands of happy families</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Book Trusted Helpers Today</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8 text-lg">
            Join thousands of families who trust MaidMatch for their domestic help needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/search')} className="px-8 py-4 bg-white text-green-600 rounded-xl hover:bg-gray-100 transition-colors font-bold text-lg shadow-lg">Find a Helper</button>
            <button onClick={() => navigate('/register')} className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 transition-colors font-bold text-lg">Become a Helper</button>
          </div>
        </div>
      </section>

    </div>
  )
}
