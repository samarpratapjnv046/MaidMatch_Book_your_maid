import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, MapPin, CheckCircle, ArrowRight, ArrowLeft, Briefcase, UserCircle } from 'lucide-react'
import { useAuth } from '../App'
import FileUpload from '../components/FileUpload'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('') // 'worker' or 'customer'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    photo: '',
    gender: '',
    aadharNumber: '',
    aadharPhoto: '',
    hourlyRate: '',
    dailyRate: '',
    monthlyRate: '',
    services: [],
    experience: '',
    skills: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bio: '',
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    }
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const serviceOptions = [
    'House Cleaning',
    'Baby Care',
    'Cooking',
    'Elder Care',
    'Pet Care',
    'Driver'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  const handleAvailabilityToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: !prev.availability[day]
      }
    }))
  }

  const validateStep = (currentStep) => {
    const newErrors = {}
    
    if (currentStep === 1) {
      if (!role) newErrors.role = 'Please select a role'
    }

    if (currentStep === 2) {
      if (!formData.name) newErrors.name = 'Name is required'
      if (!formData.email) newErrors.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email'
      if (!formData.password) newErrors.password = 'Password is required'
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
      if (!formData.phone) newErrors.phone = 'Phone is required'
      else if (formData.phone.length < 10) newErrors.phone = 'Invalid phone number'
    }

    if (role === 'worker') {
      if (currentStep === 3) {
        if (formData.services.length === 0) newErrors.services = 'Select at least one service'
        if (!formData.experience) newErrors.experience = 'Experience is required'
      }

      if (currentStep === 4) {
        if (!formData.address) newErrors.address = 'Address is required'
        if (!formData.city) newErrors.city = 'City is required'
        if (!formData.state) newErrors.state = 'State is required'
        if (!formData.pincode) newErrors.pincode = 'Pincode is required'
      }
    }

    if (role === 'customer' && currentStep === 3) {
      if (!formData.address) newErrors.address = 'Address is required'
      if (!formData.city) newErrors.city = 'City is required'
      if (!formData.state) newErrors.state = 'State is required'
      if (!formData.pincode) newErrors.pincode = 'Pincode is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(step)) return

    setLoading(true)
    
    // Combine address fields
    const fullLocation = [formData.address, formData.city, formData.state, formData.pincode].filter(Boolean).join(', ')
    
    const dataToSend = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: role,
      photo: formData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=22c55e&color=fff`,
      gender: formData.gender,
      location: fullLocation,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode
    }

    if (role === 'worker') {
      dataToSend.services = formData.services
      dataToSend.experience = formData.experience
      dataToSend.skills = formData.skills
      dataToSend.bio = formData.bio
      dataToSend.availability = formData.availability
      dataToSend.aadhar_number = formData.aadharNumber
      dataToSend.aadhar_photo = formData.aadharPhoto
      dataToSend.hourly_rate = parseInt(formData.hourlyRate) || 0
      dataToSend.daily_rate = parseInt(formData.dailyRate) || 0
      dataToSend.monthly_rate = parseInt(formData.monthlyRate) || 0
    }

    const result = await register(dataToSend)
    
    setLoading(false)
    
    if (result.success) {
      alert('Registration successful!')
      // Redirect based on role
      if (role === 'worker') {
        navigate('/worker/dashboard')
      } else {
        navigate('/dashboard')
      }
    } else {
      setErrors({ submit: result.error || 'Registration failed' })
    }
  }

  const totalSteps = role === 'worker' ? 5 : 4

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Create Account
          </h1>
          <p className="text-text-secondary">
            Join MaidMatch as a {role || 'user'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  s < step
                    ? 'bg-primary text-white'
                    : s === step
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-gray-200 text-text-secondary'
                }`}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < totalSteps && (
                <div
                  className={`w-16 h-1 mx-2 rounded ${
                    s < step ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
            {errors.submit}
          </div>
        )}

        <div className="bg-white rounded-card shadow-card p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="font-heading text-xl font-semibold mb-6">Select Your Role</h2>
                
                {errors.role && <p className="text-accent text-sm mb-4">{errors.role}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('worker')
                      setErrors({ ...errors, role: '' })
                    }}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      role === 'worker'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    <Briefcase className={`w-10 h-10 mb-3 ${role === 'worker' ? 'text-primary' : 'text-text-secondary'}`} />
                    <h3 className="font-semibold text-lg mb-1">Worker</h3>
                    <p className="text-sm text-text-secondary">I want to offer my services as a domestic helper</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setRole('customer')
                      setErrors({ ...errors, role: '' })
                    }}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      role === 'customer'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    <UserCircle className={`w-10 h-10 mb-3 ${role === 'customer' ? 'text-primary' : 'text-text-secondary'}`} />
                    <h3 className="font-semibold text-lg mb-1">Customer</h3>
                    <p className="text-sm text-text-secondary">I want to hire domestic help services</p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="font-heading text-xl font-semibold mb-6">Personal Information</h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={`w-full pl-10 pr-4 py-3 border rounded-input focus:outline-none ${
                        errors.name ? 'border-accent' : 'border-border focus:border-primary'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="text-accent text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className={`w-full pl-10 pr-4 py-3 border rounded-input focus:outline-none ${
                        errors.email ? 'border-accent' : 'border-border focus:border-primary'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-accent text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Min 6 characters"
                      className={`w-full px-4 py-3 border rounded-input focus:outline-none ${
                        errors.password ? 'border-accent' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.password && <p className="text-accent text-sm mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      className={`w-full px-4 py-3 border rounded-input focus:outline-none ${
                        errors.confirmPassword ? 'border-accent' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.confirmPassword && <p className="text-accent text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className={`w-full pl-10 pr-4 py-3 border rounded-input focus:outline-none ${
                        errors.phone ? 'border-accent' : 'border-border focus:border-primary'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-accent text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border rounded-input focus:border-primary outline-none appearance-none bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Profile Photo</label>
                  <FileUpload
                    label=""
                    value={formData.photo}
                    onChange={(value) => setFormData({ ...formData, photo: value })}
                    accept="image/*"
                    maxSize={5}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Worker Services (only for workers) */}
            {role === 'worker' && step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="font-heading text-xl font-semibold mb-6">Services & Experience</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Hourly Rate (₹) *</label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      placeholder="Hourly"
                      min="50"
                      className="w-full px-4 py-3 border border-border rounded-input focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Daily Rate (₹)</label>
                    <input
                      type="number"
                      name="dailyRate"
                      value={formData.dailyRate}
                      onChange={handleInputChange}
                      placeholder="Daily"
                      min="200"
                      className="w-full px-4 py-3 border border-border rounded-input focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Monthly Rate (₹)</label>
                    <input
                      type="number"
                      name="monthlyRate"
                      value={formData.monthlyRate}
                      onChange={handleInputChange}
                      placeholder="Monthly"
                      min="5000"
                      className="w-full px-4 py-3 border border-border rounded-input focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Services Offered *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {serviceOptions.map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => handleServiceToggle(service)}
                        className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                          formData.services.includes(service)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-text-secondary hover:border-primary'
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                  {errors.services && <p className="text-accent text-sm mt-1">{errors.services}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Years of Experience *</label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-input focus:outline-none appearance-none bg-white ${
                      errors.experience ? 'border-accent' : 'border-border focus:border-primary'
                    }`}
                  >
                    <option value="">Select experience</option>
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5-10 years">5-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                  {errors.experience && <p className="text-accent text-sm mt-1">{errors.experience}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Skills (comma separated)</label>
                  <textarea
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="e.g., Deep cleaning, Cooking, Baby care..."
                    className="w-full px-4 py-3 border border-border rounded-input focus:border-primary outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">About You</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Tell families about yourself, your experience, and what makes you great at your job..."
                    className="w-full px-4 py-3 border border-border rounded-input focus:border-primary outline-none resize-none"
                  />
                </div>

                {/* Aadhar Card Details */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-medium text-lg mb-4">Identity Verification (Aadhar)</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Aadhar Card Number</label>
                    <input
                      type="text"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleInputChange}
                      placeholder="Enter 12-digit Aadhar number"
                      maxLength={12}
                      className="w-full px-4 py-3 border border-border rounded-input focus:border-primary outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter 12-digit Aadhar number</p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Aadhar Card Photo</label>
                    <FileUpload
                      label=""
                      value={formData.aadharPhoto}
                      onChange={(value) => setFormData({ ...formData, aadharPhoto: value })}
                      accept="image/*,.pdf"
                      maxSize={5}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Location (different for worker vs customer) */}
            {((role === 'worker' && step === 4) || (role === 'customer' && step === 3)) && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="font-heading text-xl font-semibold mb-6">Location Details</h2>

                <div>
                  <label className="block text-sm font-medium mb-2">House No., Street, Area *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    className={`w-full px-4 py-3 border rounded-input focus:outline-none ${
                      errors.address ? 'border-accent' : 'border-border focus:border-primary'
                    }`}
                  />
                  {errors.address && <p className="text-accent text-sm mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      className={`w-full px-4 py-3 border rounded-input focus:outline-none ${
                        errors.city ? 'border-accent' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.city && <p className="text-accent text-sm mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      className={`w-full px-4 py-3 border rounded-input focus:outline-none ${
                        errors.state ? 'border-accent' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.state && <p className="text-accent text-sm mt-1">{errors.state}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter pincode"
                    className={`w-full px-4 py-3 border rounded-input focus:outline-none ${
                      errors.pincode ? 'border-accent' : 'border-border focus:border-primary'
                    }`}
                  />
                  {errors.pincode && <p className="text-accent text-sm mt-1">{errors.pincode}</p>}
                </div>

                {role === 'worker' && (
                  <div>
                    <label className="block text-sm font-medium mb-3">Availability</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.keys(formData.availability).map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleAvailabilityToggle(day)}
                          className={`p-3 border rounded-lg text-sm font-medium capitalize transition-colors ${
                            formData.availability[day]
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-text-secondary hover:border-primary'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review (only for workers) */}
            {role === 'worker' && step === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="font-heading text-xl font-semibold mb-6">Review & Submit</h2>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <h3 className="font-medium text-text-primary">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">Name:</span>
                      <p className="font-medium">{formData.name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Email:</span>
                      <p className="font-medium">{formData.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Phone:</span>
                      <p className="font-medium">{formData.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Experience:</span>
                      <p className="font-medium">{formData.experience || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-text-secondary text-sm">Services:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.services.length > 0 ? (
                        formData.services.map((s, i) => (
                          <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-text-secondary text-sm">Location:</span>
                    <p className="font-medium">
                      {formData.address || '-'}, {formData.city}, {formData.state} - {formData.pincode}
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-text-secondary">
                    By registering, you agree to our Terms of Service and Privacy Policy. 
                    Your profile will be verified before going live.
                  </p>
                </div>
              </div>
            )}

            {/* Customer Step 4: Review */}
            {role === 'customer' && step === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="font-heading text-xl font-semibold mb-6">Review & Submit</h2>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <h3 className="font-medium text-text-primary">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">Name:</span>
                      <p className="font-medium">{formData.name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Email:</span>
                      <p className="font-medium">{formData.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Phone:</span>
                      <p className="font-medium">{formData.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Location:</span>
                      <p className="font-medium">
                        {formData.address || '-'}, {formData.city}, {formData.state} - {formData.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-text-secondary">
                    By registering, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center space-x-2 px-6 py-3 border border-border rounded-btn hover:bg-gray-50 transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div></div>
              )}

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors font-medium"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-btn hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit Registration</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
