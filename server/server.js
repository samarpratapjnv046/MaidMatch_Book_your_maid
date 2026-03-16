import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Razorpay from 'razorpay';

dotenv.config();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Commission rate (15%)
const COMMISSION_RATE = 0.15;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'maidmatch-secret-key-change-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maidmatch';

const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only .png, .jpg, .jpeg, and .pdf files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, required: true, enum: ['admin', 'customer'] },
  photo: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  location: { type: String },
  pincode: { type: String },
  is_banned: { type: Boolean, default: false },
  ban_duration: { type: Number, default: null },
  ban_expires_at: { type: Date, default: null },
  ban_reason: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  photo: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  hourly_rate: { type: Number },
  daily_rate: { type: Number },
  monthly_rate: { type: Number },
  aadhar_number: { type: String },
  aadhar_photo: { type: String },
  services: { type: [String], default: [] },
  experience: { type: String },
  skills: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  location: { type: String },
  pincode: { type: String },
  bio: { type: String },
  availability: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_verified: { type: Boolean, default: false },
  is_banned: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  date: { type: String, required: true },
  end_date: { type: String },
  time: { type: String, required: true },
  start_time: { type: String },
  end_time: { type: String },
  duration: { type: String, required: true },
  total_price: { type: Number, required: true },
  offer_price: { type: Number },
  notes: { type: String },
  // Status flow: pending -> offer_pending -> accepted -> paid -> completed
  // 'pending' = initial, 'offer_pending' = waiting for worker to accept/reject
  status: { type: String, default: 'offer_pending', enum: ['pending', 'offer_pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled'] },
  payment_status: { type: String, default: 'pending', enum: ['pending', 'paid', 'completed', 'refunded', 'failed'] },
  booking_status: { type: String, default: 'pending_worker_acceptance', enum: ['pending_payment', 'pending_worker_acceptance', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled'] },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  commission_amount: { type: Number, default: 0 },
  worker_payout_amount: { type: Number, default: 0 },
  commission_rate: { type: Number, default: COMMISSION_RATE },
  payment_verified: { type: Boolean, default: false },
  worker_name: { type: String },
  worker_photo: { type: String },
  worker_phone: { type: String },
  service_type: { type: String },
  // OTP fields for job completion
  otp: { type: String },
  otp_expiry: { type: Date },
  otp_verified: { type: Boolean, default: false },
  otp_verified_at: { type: Date },
  otp_attempts: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const auditLogSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  target_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  target_worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const loginAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true },
  attempts: { type: Number, default: 1 },
  locked_until: { type: Date },
  last_attempt: { type: Date, default: Date.now }
});

const complaintSchema = new mongoose.Schema({
  complainant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  respondent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  type: { type: String, enum: ['customer_complaint', 'worker_complaint', 'safety_report'], required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_review', 'resolved'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
  created_at: { type: Date, default: Date.now },
  resolved_at: { type: Date },
  resolution_notes: { type: String }
});

const paymentSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  amount: { type: Number, required: true },
  platform_commission: { type: Number, required: true },
  worker_earnings: { type: Number, required: true },
  payment_status: { type: String, enum: ['pending', 'completed', 'refunded', 'failed'], default: 'pending' },
  payment_method: { type: String, default: 'simulated' },
  transaction_id: { type: String },
  created_at: { type: Date, default: Date.now }
});

const workerRatingSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String },
  created_at: { type: Date, default: Date.now }
});

// Messages schema for OTP delivery
const messageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  type: { type: String, enum: ['otp', 'notification', 'booking_update', 'system'], default: 'notification' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  otp: { type: String },
  otp_expiry: { type: Date },
  created_at: { type: Date, default: Date.now }
});

// Worker wallet schema for earnings
const walletSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true, unique: true },
  balance: { type: Number, default: 0 },
  total_earned: { type: Number, default: 0 },
  total_withdrawn: { type: Number, default: 0 },
  pending_balance: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Worker = mongoose.model('Worker', workerSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);
const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);
const Complaint = mongoose.model('Complaint', complaintSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const WorkerRating = mongoose.model('WorkerRating', workerRatingSchema);
const Message = mongoose.model('Message', messageSchema);
const Wallet = mongoose.model('Wallet', walletSchema);

const initializeAdmin = async () => {
  const adminExists = await User.findOne({ role: 'admin' });
  
  if (!adminExists) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@maidmatch.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'System Admin';
    
    if (adminEmail && adminPassword) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        is_verified: true
      });
      console.log('✅ Admin account created successfully');
    }
  }
};

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireWorker = (req, res, next) => {
  if (req.user.type !== 'worker') {
    return res.status(403).json({ error: 'Worker access required' });
  }
  next();
};

const requireCustomer = (req, res, next) => {
  if (req.user.type !== 'customer' && req.user.type !== 'user') {
    return res.status(403).json({ error: 'Customer access required' });
  }
  next();
};

const checkLoginAttempts = async (email) => {
  const attempt = await LoginAttempt.findOne({ 
    email, 
    $or: [
      { locked_until: null },
      { locked_until: { $lt: new Date() } }
    ]
  });
  return attempt;
};

const recordFailedAttempt = async (email) => {
  const attempt = await LoginAttempt.findOne({ email });
  
  if (attempt) {
    const newAttempts = attempt.attempts + 1;
    if (newAttempts >= 5) {
      await LoginAttempt.updateOne(
        { email }, 
        { 
          attempts: newAttempts, 
          locked_until: new Date(Date.now() + 15 * 60 * 1000),
          last_attempt: new Date()
        }
      );
    } else {
      await LoginAttempt.updateOne(
        { email },
        { attempts: newAttempts, last_attempt: new Date() }
      );
    }
  } else {
    await LoginAttempt.create({ email, attempts: 1 });
  }
};

const resetLoginAttempts = async (email) => {
  await LoginAttempt.deleteOne({ email });
};

const createAuditLog = async (adminId, action, targetUserId, targetWorkerId, details) => {
  await AuditLog.create({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    target_worker_id: targetWorkerId,
    details
  });
};

app.post('/api/auth/register/customer', async (req, res) => {
  try {
    const { name, email, password, phone, photo, gender, address, city, state, pincode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res.status(400).json({ error: 'Email already registered as worker' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'customer',
      photo: photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=22c55e&color=fff`,
      gender,
      address,
      city,
      state,
      pincode,
      location: [address, city, state, pincode].filter(Boolean).join(', '),
      is_banned: false
    });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, type: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        photo: user.photo,
        is_banned: user.is_banned
      }, 
      token 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/register/worker', async (req, res) => {
  try {
    const { name, email, password, phone, photo, gender, hourly_rate, daily_rate, monthly_rate, aadhar_number, aadhar_photo, services, experience, skills, address, city, state, pincode, bio, availability } = req.body;

    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res.status(400).json({ error: 'Email already registered as worker' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const worker = await Worker.create({
      name,
      email,
      password: hashedPassword,
      phone,
      photo: photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=22c55e&color=fff`,
      gender,
      hourly_rate,
      daily_rate,
      monthly_rate,
      aadhar_number,
      aadhar_photo,
      services: services || [],
      experience,
      skills,
      address,
      city,
      state,
      pincode,
      location: [address, city, state, pincode].filter(Boolean).join(', '),
      bio,
      availability: availability || {},
      is_verified: false,
      is_banned: false
    });

    const token = jwt.sign({ id: worker._id, email: worker.email, role: 'worker', type: 'worker' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        role: 'worker',
        phone: worker.phone,
        photo: worker.photo,
        is_verified: worker.is_verified,
        is_banned: worker.is_banned
      }, 
      token 
    });
  } catch (error) {
    console.error('Register worker error:', error);
    res.status(500).json({ error: 'Worker registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const attempt = await checkLoginAttempts(email);
    if (attempt && attempt.locked_until && new Date(attempt.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(attempt.locked_until) - new Date()) / 60000);
      return res.status(429).json({ error: `Account locked. Try again in ${remainingMinutes} minutes` });
    }

    let user = await User.findOne({ email });
    let userType = 'user';
    
    if (!user) {
      user = await Worker.findOne({ email });
      userType = 'worker';
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account is banned. Contact support.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      await recordFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await resetLoginAttempts(email);

    const token = jwt.sign({ 
      id: user._id, 
      email: user.email, 
      role: user.role || 'worker',
      type: userType
    }, JWT_SECRET, { expiresIn: '7d' });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'worker',
      phone: user.phone,
      photo: user.photo,
      is_verified: user.is_verified,
      is_banned: user.is_banned
    };

    res.json({ user: userData, token, type: userType });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/admin/login', adminLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      await recordFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    await resetLoginAttempts(email);

    const token = jwt.sign({ 
      id: user._id, 
      email: user.email, 
      role: user.role,
      type: 'user'
    }, JWT_SECRET, { expiresIn: '7d' });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified
    };

    res.json({ user: userData, token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  let user;
  
  if (req.user.type === 'worker') {
    user = await Worker.findById(req.user.id).select('id name email role phone photo is_verified is_banned created_at');
  } else {
    user = await User.findById(req.user.id).select('id name email role phone photo is_verified is_banned created_at');
  }
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ ...user.toObject(), type: req.user.type });
});

app.get('/api/customers', authenticateToken, requireAdmin, async (req, res) => {
  const users = await User.find({ role: 'customer' }).select('id name email role phone is_banned created_at');
  res.json(users);
});

app.get('/api/workers', async (req, res) => {
  const workers = await Worker.find().select('id name email phone photo gender hourly_rate daily_rate monthly_rate services experience skills address city state location pincode bio availability is_verified is_banned created_at');
  res.json(workers);
});

app.get('/api/workers/search', async (req, res) => {
  try {
    const { service, location, minPrice, maxPrice, bookingType, minRating, available } = req.query;

    const query = { is_banned: false };

    if (service) {
      query.services = { $regex: service, $options: 'i' };
    }

    if (location) {
      query.$or = [
        { city: { $regex: location, $options: 'i' } },
        { state: { $regex: location, $options: 'i' } },
        { location: { $regex: location, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      const priceField = bookingType === 'hourly' ? 'hourly_rate' : 
                         bookingType === 'daily' ? 'daily_rate' : 
                         bookingType === 'monthly' ? 'monthly_rate' : 'hourly_rate';
      
      query[priceField] = {};
      if (minPrice) query[priceField].$gte = parseInt(minPrice);
      if (maxPrice) query[priceField].$lte = parseInt(maxPrice);
    }

    if (available === 'true') {
      query.is_verified = true;
    }

    const workers = await Worker.find(query)
      .select('id name email phone photo gender hourly_rate daily_rate monthly_rate services experience skills address city state location pincode bio availability is_verified is_banned created_at')
      .sort({ created_at: -1 });

    const workersWithRating = workers.map(worker => {
      const workerObj = worker.toObject();
      return {
        ...workerObj,
        rating: 4.5 + Math.random() * 0.5,
        reviews: Math.floor(Math.random() * 100) + 10
      };
    });

    let filteredWorkers = workersWithRating;
    if (minRating) {
      filteredWorkers = workersWithRating.filter(w => w.rating >= parseFloat(minRating));
    }

    res.json(filteredWorkers);
  } catch (error) {
    console.error('Worker search error:', error);
    res.status(500).json({ error: 'Failed to search workers' });
  }
});

app.get('/api/workers/:id', async (req, res) => {
  const worker = await Worker.findOne({ _id: req.params.id, is_banned: false }).select('id name photo phone gender hourly_rate daily_rate monthly_rate aadhar_number services experience skills address city state location bio availability is_verified is_banned created_at');

  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  res.json(worker);
});

app.get('/api/workers/:id/availability', async (req, res) => {
  try {
    const { date, time, duration, hours, startTime, endTime, weekStartDate, monthStartDate } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const worker = await Worker.findOne({ _id: req.params.id, is_banned: false });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found or not available' });
    }

    const timeSlots = {
      'morning': { start: '06:00', end: '12:00' },
      'afternoon': { start: '12:00', end: '16:00' },
      'evening': { start: '16:00', end: '20:00' },
      'night': { start: '20:00', end: '22:00' }
    };

    let datesToCheck = [date];
    
    if (duration === 'weekly' && weekStartDate) {
      const start = new Date(weekStartDate);
      for (let i = 1; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        datesToCheck.push(d.toISOString().split('T')[0]);
      }
    } else if (duration === 'monthly' && monthStartDate) {
      const start = new Date(monthStartDate);
      for (let i = 1; i < 30; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        datesToCheck.push(d.toISOString().split('T')[0]);
      }
    }

    const bookings = await Booking.find({
      worker_id: req.params.id,
      date: { $in: datesToCheck },
      status: { $in: ['pending', 'confirmed', 'accepted'] }
    });

    const availabilityByDate = {};
    
    for (const d of datesToCheck) {
      const dateBookings = bookings.filter(b => b.date === d);
      
      if (duration === 'hourly') {
        let slotStart, slotEnd;
        
        if (startTime && endTime) {
          slotStart = startTime;
          slotEnd = endTime;
        } else if (time && timeSlots[time]) {
          slotStart = timeSlots[time].start;
          slotEnd = timeSlots[time].end;
        } else if (hours) {
          const defaultStart = '10:00';
          const [h, m] = defaultStart.split(':').map(Number);
          slotEnd = `${Math.min(h + parseInt(hours), 22)}:${m.toString().padStart(2, '0')}`;
          slotStart = defaultStart;
        } else {
          slotStart = '10:00';
          slotEnd = '18:00';
        }
        
        const hasConflict = dateBookings.some(booking => {
          if (booking.time === 'hourly' || booking.start_time) {
            const bookedStart = booking.start_time || '10:00';
            const bookedHours = parseInt(booking.duration) || 4;
            const [bh, bm] = bookedStart.split(':').map(Number);
            const bookedEnd = `${Math.min(bh + bookedHours, 22)}:${bm.toString().padStart(2, '0')}`;
            
            return slotStart < bookedEnd && slotEnd > bookedStart;
          }
          return booking.time === time;
        });
        
        availabilityByDate[d] = !hasConflict;
        
      } else if (duration === 'daily') {
        const hasBooking = dateBookings.length > 0;
        availabilityByDate[d] = !hasBooking;
        
      } else {
        const hasBooking = dateBookings.length > 0;
        availabilityByDate[d] = !hasBooking;
      }
    }

    const mainDateBookings = bookings.filter(b => b.date === date);
    let isAvailable = true;
    let conflictingBooking = null;
    
    if (duration === 'hourly') {
      const conflict = mainDateBookings.find(b => {
        if (b.time === 'hourly' || b.start_time) {
          const bookedStart = b.start_time || '10:00';
          const bookedHours = parseInt(b.duration) || 4;
          const [bh, bm] = bookedStart.split(':').map(Number);
          const bookedEnd = `${Math.min(bh + bookedHours, 22)}:${bm.toString().padStart(2, '0')}`;
          
          const reqStart = startTime || timeSlots[time]?.start || '10:00';
          const reqEndHours = parseInt(hours) || 4;
          const [rh, rm] = reqStart.split(':').map(Number);
          const reqEnd = `${Math.min(rh + reqEndHours, 22)}:${rm.toString().padStart(2, '0')}`;
          
          return reqStart < bookedEnd && reqEnd > bookedStart;
        }
        return b.time === time;
      });
      isAvailable = !conflict;
      conflictingBooking = conflict;
    } else {
      isAvailable = mainDateBookings.length === 0;
    }

    res.json({
      worker_id: req.params.id,
      date,
      dates_checked: datesToCheck,
      time,
      duration,
      hours: hours ? parseInt(hours) : null,
      start_time: startTime,
      end_time: endTime,
      is_available: isAvailable,
      availability_by_date: availabilityByDate,
      conflicting_booking: conflictingBooking ? {
        date: conflictingBooking.date,
        time: conflictingBooking.time,
        duration: conflictingBooking.duration
      } : null,
      message: isAvailable ? 'Worker is available' : 'Worker is not available for the selected time slot'
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

app.get('/api/workers/:id/unavailable-slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const worker = await Worker.findOne({ _id: req.params.id, is_banned: false });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found or not available' });
    }

    const bookings = await Booking.find({
      worker_id: req.params.id,
      date: date,
      status: { $in: ['pending', 'confirmed', 'accepted'] }
    });

    const unavailableSlots = bookings.map(booking => ({
      time: booking.time,
      start_time: booking.start_time,
      end_time: booking.end_time,
      duration: booking.duration,
      status: booking.status
    }));

    res.json({
      worker_id: req.params.id,
      date,
      unavailable_slots: unavailableSlots,
      total_bookings: bookings.length
    });
  } catch (error) {
    console.error('Get unavailable slots error:', error);
    res.status(500).json({ error: 'Failed to get unavailable slots' });
  }
});

app.get('/api/workers/:id/bookings', async (req, res) => {
  try {
    const { date } = req.query;
    
    const query = { worker_id: req.params.id };
    if (date) {
      query.date = date;
    }
    query.status = { $in: ['pending', 'confirmed'] };

    const bookings = await Booking.find(query)
      .populate('user_id', 'name email phone')
      .sort({ created_at: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get worker bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.put('/api/workers/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  worker.is_verified = true;
  worker.updated_at = new Date();
  await worker.save();
  
  await createAuditLog(req.user.id, 'verify_worker', null, req.params.id, 'Worker verified');
  
  res.json({ message: 'Worker verified successfully' });
});

app.put('/api/workers/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phone, photo, hourly_rate, daily_rate, monthly_rate, address, city, state, pincode, bio, services, availability } = req.body;
    
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (req.user.id !== worker._id.toString() && req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    if (name !== undefined) worker.name = name;
    if (phone !== undefined) worker.phone = phone;
    if (photo !== undefined) worker.photo = photo;
    if (hourly_rate !== undefined) worker.hourly_rate = hourly_rate;
    if (daily_rate !== undefined) worker.daily_rate = daily_rate;
    if (monthly_rate !== undefined) worker.monthly_rate = monthly_rate;
    if (address !== undefined) worker.address = address;
    if (city !== undefined) worker.city = city;
    if (state !== undefined) worker.state = state;
    if (pincode !== undefined) worker.pincode = pincode;
    if (bio !== undefined) worker.bio = bio;
    if (services !== undefined) worker.services = services;
    if (availability !== undefined) worker.availability = availability;

    worker.location = [worker.address, worker.city, worker.state, worker.pincode].filter(Boolean).join(', ');
    
    worker.updated_at = new Date();
    await worker.save();

    res.json({ 
      message: 'Profile updated successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        photo: worker.photo,
        hourly_rate: worker.hourly_rate,
        daily_rate: worker.daily_rate,
        monthly_rate: worker.monthly_rate,
        address: worker.address,
        city: worker.city,
        state: worker.state,
        pincode: worker.pincode,
        bio: worker.bio,
        services: worker.services,
        availability: worker.availability
      }
    });
  } catch (error) {
    console.error('Update worker error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.put('/api/workers/:id/ban', authenticateToken, requireAdmin, async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const { days, reason } = req.body;
  
  // If unban request, just unban
  if (worker.is_banned) {
    worker.is_banned = false;
    worker.ban_duration = null;
    worker.ban_expires_at = null;
    worker.ban_reason = null;
    worker.updated_at = new Date();
    await worker.save();
    
    await createAuditLog(req.user.id, 'unban_worker', null, req.params.id, 'Worker unbanned');
    
    return res.json({ message: 'Worker unbanned successfully' });
  }
  
  // Ban with duration
  const banDays = parseInt(days) || 0;
  worker.is_banned = true;
  worker.ban_duration = banDays;
  worker.ban_reason = reason || 'No reason provided';
  
  if (banDays > 0) {
    worker.ban_expires_at = new Date(Date.now() + banDays * 24 * 60 * 60 * 1000);
  } else {
    worker.ban_expires_at = null; // Permanent ban (use delete for permanent removal)
  }
  
  worker.updated_at = new Date();
  await worker.save();
  
  await createAuditLog(req.user.id, 'ban_worker', null, req.params.id, `Worker banned for ${banDays} days. Reason: ${reason || 'None'}`);
  
  res.json({ message: `Worker banned for ${banDays} days successfully` });
});

app.put('/api/customers/:id/ban', authenticateToken, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.status(403).json({ error: 'Cannot ban admin users' });
  }

  const { days, reason } = req.body;
  
  // If unban request, just unban
  if (user.is_banned) {
    user.is_banned = false;
    user.ban_duration = null;
    user.ban_expires_at = null;
    user.ban_reason = null;
    user.updated_at = new Date();
    await user.save();
    
    await createAuditLog(req.user.id, 'unban_user', req.params.id, null, 'User unbanned');
    
    return res.json({ message: 'User unbanned successfully' });
  }
  
  // Ban with duration
  const banDays = parseInt(days) || 0;
  user.is_banned = true;
  user.ban_duration = banDays;
  user.ban_reason = reason || 'No reason provided';
  
  if (banDays > 0) {
    user.ban_expires_at = new Date(Date.now() + banDays * 24 * 60 * 60 * 1000);
  } else {
    user.ban_expires_at = null;
  }
  
  user.updated_at = new Date();
  await user.save();
  
  await createAuditLog(req.user.id, 'ban_user', req.params.id, null, `User banned for ${banDays} days. Reason: ${reason || 'None'}`);
  
  res.json({ message: `User banned for ${banDays} days successfully` });
});

app.delete('/api/customers/:id', authenticateToken, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.status(403).json({ error: 'Cannot delete admin users' });
  }

  await User.findByIdAndDelete(req.params.id);
  
  await createAuditLog(req.user.id, 'delete_user', req.params.id, null, 'User deleted');
  
  res.json({ message: 'User deleted successfully' });
});

app.delete('/api/workers/:id', authenticateToken, requireAdmin, async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  await Worker.findByIdAndDelete(req.params.id);
  
  await createAuditLog(req.user.id, 'delete_worker', null, req.params.id, 'Worker deleted');
  
  res.json({ message: 'Worker deleted successfully' });
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    // Only allow 'user' type (customers from User collection) to create bookings
    if (req.user.type !== 'user') {
      return res.status(403).json({ error: 'Only customers can create bookings' });
    }

    const { worker_id, date, end_date, time, start_time, end_time, duration, total_price, offer_price, notes, worker_name, worker_photo, worker_phone, service_type } = req.body;
    
    const worker = await Worker.findOne({ _id: worker_id, is_banned: false });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found or not available' });
    }

    const booking = await Booking.create({
      user_id: req.user.id,
      worker_id,
      date,
      end_date,
      time,
      start_time,
      end_time,
      duration,
      total_price,
      offer_price: offer_price || total_price,
      notes: notes || '',
      worker_name: worker_name || worker.name,
      worker_photo: worker_photo || worker.photo,
      worker_phone: worker_phone || worker.phone,
      service_type
    });

    res.status(201).json({ id: booking._id, message: 'Booking created successfully' });
    
    // Emit real-time event to admin
    const io = app.get('io');
    if (io) {
      io.to('admin_room').emit('booking_created', { 
        booking: { 
          _id: booking._id, 
          service_type: booking.service_type, 
          status: booking.status,
          date: booking.date,
          time: booking.time,
          total_price: booking.total_price
        } 
      });
    }
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Booking failed' });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  let bookings;
  
  // Handle both 'user' and 'customer' types for customers
  if (req.user.type === 'customer' || req.user.type === 'user') {
    bookings = await Booking.find({ user_id: req.user.id })
      .populate('user_id', 'name email phone address city location')
      .populate('worker_id', 'name email phone address city location photo')
      .sort({ created_at: -1 });
  } else if (req.user.type === 'worker') {
    bookings = await Booking.find({ worker_id: req.user.id })
      .populate('user_id', 'name email phone address city location')
      .populate('worker_id', 'name email phone address city location photo')
      .sort({ created_at: -1 });
  } else {
    bookings = await Booking.find()
      .populate('user_id', 'name email phone address city location')
      .populate('worker_id', 'name email phone address city location photo')
      .sort({ created_at: -1 });
  }
  
  res.json(bookings);
});

// Get single booking by ID
app.get('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user_id', 'name email phone')
      .populate('worker_id', 'name email phone photo');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check authorization
    if (req.user.type !== 'admin' && 
        booking.user_id._id.toString() !== req.user.id && 
        booking.worker_id._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    
    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// User/Admin Delete Booking
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only Admin or the User who created the booking can delete it
    if (req.user.type !== 'admin' && booking.user_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this booking' });
    }

    const cancelledBy = req.user.type === 'admin' ? 'Admin' : 'User';

    // Message to Worker
    await Message.create({
      user_id: booking.user_id,
      worker_id: booking.worker_id,
      booking_id: booking._id,
      type: 'booking_update',
      title: 'Booking Cancelled',
      message: `The booking for ${booking.service_type} scheduled on ${booking.date} at ${booking.time} has been cancelled by ${cancelledBy}.`
    });

    // Message to User (if admin cancelled)
    if (req.user.type === 'admin') {
      await Message.create({
        user_id: booking.user_id,
        booking_id: booking._id,
        type: 'booking_update',
        title: 'Booking Cancelled by Admin',
        message: `Your booking for ${booking.service_type} scheduled on ${booking.date} at ${booking.time} has been cancelled by Admin.`
      });
    }

    // Message to Admin (if user cancelled) - find all admins
    if (req.user.type !== 'admin') {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Message.create({
          user_id: admin._id,
          booking_id: booking._id,
          type: 'booking_update',
          title: 'Booking Cancelled by User',
          message: `Booking #${booking._id} for ${booking.service_type} on ${booking.date} was cancelled by the user (${booking.user_name || 'Unknown'}).`
        });
      }
    }

    const io = app.get('io');
    if (io) {
      io.emit(`booking_cancelled_${booking.worker_id}`, { booking_id: booking._id, message: 'A booking has been cancelled.' });
      io.emit(`booking_cancelled_${booking.user_id}`, { booking_id: booking._id, message: 'A booking has been cancelled.' });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Worker Request Delete Booking
app.post('/api/bookings/:id/request-delete', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only the assigned worker can request deletion
    if (req.user.type !== 'worker' || booking.worker_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to request deletion for this booking' });
    }

    // Mark booking with cancel_requested flag
    booking.cancel_requested = true;
    booking.cancel_reason = reason || 'Not provided';
    await booking.save();

    // Message to User
    await Message.create({
      user_id: booking.user_id,
      worker_id: booking.worker_id,
      booking_id: booking._id,
      type: 'booking_update',
      title: 'Worker Requested Cancellation',
      message: `The worker has requested to cancel your booking for ${booking.service_type} on ${booking.date}. Reason: ${reason || 'Not provided'}. You can cancel the booking from your dashboard.`
    });

    // Message to All Admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Message.create({
        user_id: admin._id,
        worker_id: booking.worker_id,
        booking_id: booking._id,
        type: 'booking_update',
        title: 'Worker Cancel Request - Needs Review',
        message: `Worker ${booking.worker_name} has requested to cancel booking #${booking._id} for ${booking.service_type} on ${booking.date}. Reason: ${reason || 'Not provided'}. Please review and approve/reject from the Bookings tab.`
      });
    }

    const io = app.get('io');
    if (io) {
      io.emit(`booking_delete_request_${booking.user_id}`, { booking_id: booking._id, message: 'Worker requested to cancel the booking.' });
    }

    res.json({ success: true, message: 'Cancellation request sent to user and admin successfully' });
  } catch (error) {
    console.error('Request delete booking error:', error);
    res.status(500).json({ error: 'Failed to request delete' });
  }
});

// Admin approve/reject worker's cancel request
app.put('/api/bookings/:id/approve-cancel', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Only admin can approve/reject cancel requests' });
    }

    const { action } = req.body; // 'approve' or 'reject'
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (action === 'approve') {
      // Notify worker
      await Message.create({
        user_id: booking.user_id,
        worker_id: booking.worker_id,
        booking_id: booking._id,
        type: 'booking_update',
        title: 'Cancellation Approved',
        message: `Your cancellation request for booking on ${booking.date} has been approved by admin. The booking has been cancelled.`
      });
      // Notify user
      await Message.create({
        user_id: booking.user_id,
        booking_id: booking._id,
        type: 'booking_update',
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.service_type} on ${booking.date} has been cancelled as per the worker's request (approved by admin).`
      });

      await Booking.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Cancel request approved. Booking deleted.' });
    } else {
      booking.cancel_requested = false;
      booking.cancel_reason = '';
      await booking.save();

      // Notify worker
      await Message.create({
        user_id: booking.user_id,
        worker_id: booking.worker_id,
        booking_id: booking._id,
        type: 'booking_update',
        title: 'Cancellation Rejected',
        message: `Your cancellation request for booking on ${booking.date} has been rejected by admin. Please proceed with the booking.`
      });

      res.json({ success: true, message: 'Cancel request rejected.' });
    }
  } catch (error) {
    console.error('Approve cancel error:', error);
    res.status(500).json({ error: 'Failed to process cancel request' });
  }
});

// Worker Accept/Reject Booking
app.put('/api/bookings/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "accept" or "reject"' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only the assigned worker can accept/reject
    if (booking.worker_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to respond to this booking' });
    }

    // Can only respond to pending bookings
    if (booking.status !== 'offer_pending') {
      return res.status(400).json({ error: 'Booking is not in pending status' });
    }

    if (action === 'accept') {
      booking.status = 'accepted';
      booking.booking_status = 'accepted';
      
      // Emit event to user
      const io = app.get('io');
      if (io) {
        io.emit(`booking_updated_${booking.user_id}`, {
          booking_id: booking._id,
          status: 'accepted',
          message: 'Worker has accepted your booking! Please complete payment.'
        });
      }
      
      await booking.save();
      return res.json({ 
        success: true, 
        message: 'Booking accepted successfully',
        booking 
      });
    } else {
      booking.status = 'rejected';
      booking.booking_status = 'rejected';
      
      // Emit event to user
      const io = app.get('io');
      if (io) {
        io.emit(`booking_updated_${booking.user_id}`, {
          booking_id: booking._id,
          status: 'rejected',
          message: 'Worker has rejected your booking request.'
        });
      }
      
      await booking.save();
      return res.json({ 
        success: true, 
        message: 'Booking rejected',
        booking 
      });
    }
  } catch (error) {
    console.error('Booking respond error:', error);
    res.status(500).json({ error: 'Failed to respond to booking' });
  }
});

// Generate OTP for job completion
app.post('/api/otp/generate', authenticateToken, async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only the user who made the booking can generate OTP
    if (booking.user_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Can only generate OTP after payment is completed
    if (booking.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment must be completed before generating OTP' });
    }

    // Check if OTP already generated and not expired
    if (booking.otp && booking.otp_expiry && new Date(booking.otp_expiry) > new Date() && booking.otp_verified) {
      return res.status(400).json({ error: 'OTP already verified for this booking' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // OTP expires 15 minutes after the scheduled booking date and time
    const bookingDateTime = new Date(`${booking.date}T${booking.start_time || '00:00'}`);
    const otpExpiry = new Date(bookingDateTime.getTime() + 15 * 60 * 1000);

    booking.otp = otp;
    booking.otp_expiry = otpExpiry;
    booking.otp_attempts = 0;
    await booking.save();

    // Create message with OTP (visible ONLY to user - no worker_id so workers can't see it)
    const message = await Message.create({
      user_id: booking.user_id,
      booking_id: booking._id,
      type: 'otp',
      title: 'OTP for Job Completion',
      message: `Your OTP for completing the booking is: ${otp}. Share this OTP with the worker ONLY after the service is completed. Do NOT share it beforehand.`,
      otp: otp,
      otp_expiry: otpExpiry
    });

    // Emit event to worker
    const io = app.get('io');
    if (io) {
      io.emit(`otp_generated_${booking.worker_id}`, {
        booking_id: booking._id,
        message: 'New OTP generated for job completion'
      });
    }

    res.json({ 
      success: true, 
      message: 'OTP generated successfully',
      otp_expiry: otpExpiry,
      message_id: message._id
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

// Verify OTP (Worker enters OTP)
app.post('/api/otp/verify', authenticateToken, async (req, res) => {
  try {
    const { booking_id, otp } = req.body;

    if (!booking_id || !otp) {
      return res.status(400).json({ error: 'Booking ID and OTP are required' });
    }

    // Only workers can verify OTP
    if (req.user.type !== 'worker') {
      return res.status(403).json({ error: 'Only workers can verify OTP' });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only the assigned worker can verify
    if (booking.worker_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to verify this booking' });
    }

    // Check if already verified
    if (booking.otp_verified) {
      return res.status(400).json({ error: 'OTP already verified for this booking' });
    }

    // Check if OTP matches
    if (booking.otp !== otp) {
      // Increment failed attempts
      booking.otp_attempts = (booking.otp_attempts || 0) + 1;
      await booking.save();
      
      const attemptsLeft = 3 - booking.otp_attempts;
      if (attemptsLeft <= 0) {
        return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
      }
      
      return res.status(400).json({ 
        error: 'Invalid OTP', 
        attempts_left: attemptsLeft 
      });
    }

    // Check if OTP expired
    if (booking.otp_expiry && new Date(booking.otp_expiry) < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    // OTP is valid - mark as verified
    booking.otp_verified = true;
    booking.otp_verified_at = new Date();
    booking.status = 'completed';
    booking.payment_status = 'completed';
    await booking.save();

    // Update or create worker wallet
    let wallet = await Wallet.findOne({ worker_id: booking.worker_id });
    if (!wallet) {
      wallet = await Wallet.create({
        worker_id: booking.worker_id,
        balance: 0,
        total_earned: 0,
        pending_balance: 0
      });
    }

    // Add worker payout to wallet
    const payoutAmount = booking.worker_payout_amount || (booking.total_price - booking.commission_amount);
    wallet.balance += payoutAmount;
    wallet.total_earned += payoutAmount;
    wallet.updated_at = new Date();
    await wallet.save();

    // Create or update payment record with all required fields
    await Payment.findOneAndUpdate(
      { booking_id: booking._id },
      { 
        user_id: booking.user_id,
        worker_id: booking.worker_id,
        amount: booking.total_price,
        platform_commission: booking.commission_amount || (booking.total_price * COMMISSION_RATE),
        worker_earnings: payoutAmount,
        payment_status: 'completed',
        transaction_id: booking.razorpay_payment_id || 'manual_otp_verify'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Notify user
    const io = app.get('io');
    if (io) {
      io.emit(`booking_completed_${booking.user_id}`, {
        booking_id: booking._id,
        message: 'Job completed! Worker has verified the OTP.'
      });
    }

    res.json({ 
      success: true, 
      message: 'OTP verified successfully. Job completed!',
      payout_amount: payoutAmount,
      wallet_balance: wallet.balance
    });
  } catch (error) {
    console.error('CRITICAL: Verify OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to verify OTP', 
      details: error.message 
    });
  }
});

// Get Wallet Balance
app.get('/api/wallet', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'worker') {
      return res.status(403).json({ error: 'Only workers can access wallet' });
    }

    let wallet = await Wallet.findOne({ worker_id: req.user.id });
    
    if (!wallet) {
      wallet = await Wallet.create({
        worker_id: req.user.id,
        balance: 0,
        total_earned: 0,
        pending_balance: 0
      });
    }

    res.json({
      worker_id: wallet.worker_id,
      balance: wallet.balance,
      total_earned: wallet.total_earned,
      total_withdrawn: wallet.total_withdrawn,
      pending_balance: wallet.pending_balance,
      updated_at: wallet.updated_at
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

// Get Messages (including OTP)
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { type, booking_id } = req.query;
    
    // Match messages for user OR worker
    let query = {};
    if (req.user.type === 'worker') {
      // Workers see messages where they are the worker, but NOT OTP messages
      query.$or = [{ user_id: req.user.id }, { worker_id: req.user.id }];
      query.type = { $ne: 'otp' };
    } else {
      query.user_id = req.user.id;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (booking_id) {
      query.booking_id = booking_id;
    }

    const messages = await Message.find(query)
      .populate('worker_id', 'name photo')
      .populate('booking_id', 'service_type date status')
      .sort({ created_at: -1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark message as read
app.put('/api/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.is_read = true;
    await message.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Delete message
app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
  const { status } = req.body;
  
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (req.user.type !== 'admin' && booking.user_id.toString() !== req.user.id && booking.worker_id.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  booking.status = status;
  await booking.save();
  
  if (req.user.type === 'admin') {
    await createAuditLog(req.user.id, 'update_booking_status', booking.user_id, booking.worker_id, `Booking ${req.params.id} status changed to ${status}`);
  }
  
  res.json({ message: 'Booking updated successfully' });
});

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  const totalCustomers = await User.countDocuments({ role: 'customer' });
  const totalWorkers = await Worker.countDocuments();
  const verifiedWorkers = await Worker.countDocuments({ is_verified: true });
  const totalBookings = await Booking.countDocuments();
  const pendingBookings = await Booking.countDocuments({ status: 'pending' });
  
  const revenueResult = await Booking.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$total_price' } } }
  ]);
  
  res.json({
    totalCustomers,
    totalWorkers,
    verifiedWorkers,
    totalBookings,
    pendingBookings,
    revenue: revenueResult[0]?.total || 0
  });
});

app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  const logs = await AuditLog.find()
    .populate('admin_id', 'name')
    .sort({ timestamp: -1 })
    .limit(100);
  
  res.json(logs);
});

app.get('/api/admin/bookings', authenticateToken, requireAdmin, async (req, res) => {
  const bookings = await Booking.find()
    .populate('user_id', 'name email phone')
    .populate('worker_id', 'name email phone')
    .sort({ created_at: -1 });
  
  res.json(bookings);
});

app.get('/api/admin/complaints', authenticateToken, requireAdmin, async (req, res) => {
  const complaints = await Complaint.find()
    .populate('complainant_id', 'name email phone')
    .populate('respondent_id', 'name email')
    .populate('booking_id')
    .sort({ created_at: -1 });
  
  res.json(complaints);
});

app.get('/api/admin/complaints/:id', authenticateToken, requireAdmin, async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('complainant_id', 'name email phone')
    .populate('respondent_id', 'name email')
    .populate('booking_id');
  
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  
  res.json(complaint);
});

app.put('/api/admin/complaints/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { status, resolution_notes } = req.body;
  
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  
  complaint.status = status || complaint.status;
  complaint.resolution_notes = resolution_notes || complaint.resolution_notes;
  
  if (status === 'resolved') {
    complaint.resolved_at = new Date();
  }
  
  await complaint.save();
  
  await createAuditLog(req.user.id, 'update_complaint', complaint.complainant_id, complaint.respondent_id, `Complaint status changed to ${status}`);
  
  res.json({ message: 'Complaint updated successfully', complaint });
});

app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const serviceStats = await Booking.aggregate([
      { $group: { _id: '$service_type', count: { $sum: 1 }, revenue: { $sum: '$total_price' } } },
      { $sort: { count: -1 } }
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const bookingTrends = await Booking.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
          revenue: { $sum: '$total_price' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const statusBreakdown = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const topWorkers = await Booking.aggregate([
      { $group: { _id: '$worker_id', bookings: { $sum: 1 }, revenue: { $sum: '$total_price' } } },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: '_id',
          as: 'worker'
        }
      },
      { $unwind: '$worker' },
      {
        $project: {
          worker_id: '$_id',
          worker_name: '$worker.name',
          bookings: 1,
          revenue: 1
        }
      }
    ]);

    const topCustomers = await Booking.aggregate([
      { $group: { _id: '$user_id', bookings: { $sum: 1 }, spent: { $sum: '$total_price' } } },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          user_id: '$_id',
          customer_name: '$customer.name',
          customer_email: '$customer.email',
          bookings: 1,
          spent: 1
        }
      }
    ]);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyRevenue = await Booking.aggregate([
      { $match: { status: 'completed', created_at: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
          revenue: { $sum: '$total_price' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      serviceStats,
      bookingTrends,
      statusBreakdown,
      topWorkers,
      topCustomers,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
  const payments = await Payment.find()
    .populate('user_id', 'name email phone')
    .populate('worker_id', 'name email')
    .populate('booking_id')
    .sort({ created_at: -1 });
  
  res.json(payments);
});

app.get('/api/admin/payments/stats', authenticateToken, requireAdmin, async (req, res) => {
  const totalCollected = await Payment.aggregate([
    { $match: { payment_status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalCommission = await Payment.aggregate([
    { $match: { payment_status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$platform_commission' } } }
  ]);

  const totalWorkerEarnings = await Payment.aggregate([
    { $match: { payment_status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$worker_earnings' } } }
  ]);

  const pendingPayments = await Payment.countDocuments({ payment_status: 'pending' });

  const paymentStatusBreakdown = await Payment.aggregate([
    { $group: { _id: '$payment_status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
  ]);

  res.json({
    totalCollected: totalCollected[0]?.total || 0,
    totalCommission: totalCommission[0]?.total || 0,
    totalWorkerEarnings: totalWorkerEarnings[0]?.total || 0,
    pendingPayments,
    paymentStatusBreakdown
  });
});

app.post('/api/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
  const { booking_id, payment_status } = req.body;
  
  const booking = await Booking.findById(booking_id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const commissionRate = 0.15;
  const platformCommission = Math.round(booking.total_price * commissionRate);
  const workerEarnings = booking.total_price - platformCommission;

  const existingPayment = await Payment.findOne({ booking_id });
  if (existingPayment) {
    existingPayment.payment_status = payment_status || existingPayment.payment_status;
    await existingPayment.save();
    return res.json({ message: 'Payment updated successfully', payment: existingPayment });
  }

  const payment = await Payment.create({
    booking_id: booking._id,
    user_id: booking.user_id,
    worker_id: booking.worker_id,
    amount: booking.total_price,
    platform_commission: platformCommission,
    worker_earnings: workerEarnings,
    payment_status: payment_status || 'pending',
    payment_method: 'simulated',
    transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  });

  await createAuditLog(req.user.id, 'create_payment', booking.user_id, booking.worker_id, `Payment created for booking ${booking_id}`);

  res.status(201).json({ message: 'Payment created successfully', payment });
});

app.put('/api/admin/payments/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { payment_status } = req.body;
  
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  payment.payment_status = payment_status;
  await payment.save();

  await createAuditLog(req.user.id, 'update_payment', payment.user_id, payment.worker_id, `Payment status changed to ${payment_status}`);

  res.json({ message: 'Payment updated successfully', payment });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ 
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

app.post('/api/upload/multiple', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  const files = req.files.map(file => ({
    url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  }));
  
  res.json({ files });
});

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log('Client joined admin room');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Function to emit events to admin dashboard
const emitToAdmin = (event, data) => {
  io.to('admin_room').emit(event, data);
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Make io accessible to routes
app.set('io', io);

// ==================== RAZORPAY PAYMENT ENDPOINTS ====================

// GET Razorpay key for frontend
app.get('/api/payments/key', (req, res) => {
  res.json({ key_id: process.env.RAZORPAY_KEY_ID });
});

// Create Razorpay order
app.post('/api/payments/create-order', authenticateToken, async (req, res) => {
  try {
    const { booking_id, amount } = req.body;

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.user_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (booking.payment_status === 'paid') {
      return res.status(400).json({ error: 'Booking already paid' });
    }

    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Short receipt - max 40 chars (Razorpay limit)
    const shortId = booking_id.toString().slice(-8);
    const timestamp = Date.now().toString(36).slice(-4);
    const receipt = `MM${shortId}${timestamp}`;
    
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      notes: { booking_id: booking_id.toString(), user_id: req.user.id }
    });

    booking.razorpay_order_id = order.id;
    await booking.save();

    res.json({ order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment
app.post('/api/payments/verify', authenticateToken, async (req, res) => {
  try {
    const { booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.user_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (booking.payment_verified) {
      return res.status(400).json({ error: 'Payment already verified' });
    }

    if (booking.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({ error: 'Order ID mismatch' });
    }

    const crypto = await import('crypto');
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      booking.payment_status = 'failed';
      booking.razorpay_payment_id = razorpay_payment_id;
      booking.razorpay_signature = razorpay_signature;
      await booking.save();
      return res.status(400).json({ error: ' Invalid payment signature' });
    }

    const commissionAmount = Math.round(booking.total_price * COMMISSION_RATE);
    const workerPayoutAmount = booking.total_price - commissionAmount;

    booking.razorpay_payment_id = razorpay_payment_id;
    booking.razorpay_signature = razorpay_signature;
    booking.payment_status = 'paid';
    booking.status = 'paid';
    booking.booking_status = 'pending_worker_acceptance';
    booking.payment_verified = true;
    booking.commission_amount = commissionAmount;
    booking.worker_payout_amount = workerPayoutAmount;
    await booking.save();

    const io = app.get('io');
    if (io) {
      io.to('admin_room').emit('payment_completed', {
        booking: { 
          _id: booking._id, 
          service_type: booking.service_type, 
          booking_status: booking.booking_status, 
          payment_status: booking.payment_status, 
          date: booking.date, 
          total_price: booking.total_price 
        }
      });
    }

    res.json({ success: true, message: 'Payment verified successfully', booking_status: booking.booking_status, payment_status: booking.payment_status });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Process refund
app.post('/api/payments/refund', authenticateToken, async (req, res) => {
  try {
    const { booking_id } = req.body;

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.type !== 'admin' && booking.user_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (booking.payment_status !== 'paid') {
      return res.status(400).json({ error: 'No payment found for this booking' });
    }

    if (booking.payment_status === 'refunded') {
      return res.status(400).json({ error: 'Booking already refunded' });
    }

    if (booking.razorpay_payment_id) {
      try {
        const refund = await razorpay.payments.refund(booking.razorpay_payment_id, {
          amount: Math.round(booking.total_price * 100),
          notes: { reason: 'Booking rejected by worker', booking_id: booking_id.toString() }
        });
        console.log('Refund processed:', refund.id);
      } catch (refundError) {
        console.error('Refund error:', refundError);
      }
    }

    booking.payment_status = 'refunded';
    booking.booking_status = 'rejected';
    await booking.save();

    res.json({ success: true, message: 'Refund processed successfully', refund_amount: booking.total_price });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Refund processing failed' });
  }
});

// Get booking payment status
app.get('/api/payments/booking/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.type !== 'admin' && booking.user_id.toString() !== req.user.id && booking.worker_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({
      booking_id: booking._id, 
      payment_status: booking.payment_status, 
      booking_status: booking.booking_status,
      razorpay_order_id: booking.razorpay_order_id, 
      razorpay_payment_id: booking.razorpay_payment_id,
      total_price: booking.total_price, 
      commission_amount: booking.commission_amount,
      worker_payout_amount: booking.worker_payout_amount, 
      payment_verified: booking.payment_verified
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

// ==================== END RAZORPAY PAYMENT ENDPOINTS ====================

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return initializeAdmin();
  })
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
