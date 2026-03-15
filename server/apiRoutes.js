// API Routes for OTP, Messages, and Wallet
// These endpoints need to be added to server.js

/* 
To add these routes to server.js, add the following before mongoose.connect():

import apiRoutes from './apiRoutes.js';
app.use('/api', apiRoutes);

Or manually add each endpoint to server.js
*/

// OTP Configuration
const OTP_EXPIRY_MINUTES = 30;
const MAX_OTP_ATTEMPTS = 3;

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// OTP Endpoints
export const registerOtpRoutes = (app, { authenticateToken, Booking, Message, Wallet }) => {
  
  // Generate OTP
  app.post('/api/otp/generate', authenticateToken, async (req, res) => {
    try {
      const { booking_id } = req.body;

      const booking = await Booking.findById(booking_id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.user_id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (booking.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Payment must be completed before generating OTP' });
      }

      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      booking.otp = otp;
      booking.otp_expiry = otpExpiry;
      await booking.save();

      const message = await Message.create({
        user_id: booking.user_id,
        worker_id: booking.worker_id,
        booking_id: booking._id,
        type: 'otp',
        title: 'OTP for Service Completion',
        message: `Your OTP is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        otp: otp,
        otp_expiry: otpExpiry
      });

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

  // Verify OTP
  app.post('/api/otp/verify', authenticateToken, async (req, res) => {
    try {
      const { booking_id, otp } = req.body;

      if (req.user.type !== 'worker') {
        return res.status(403).json({ error: 'Only workers can verify OTP' });
      }

      const booking = await Booking.findById(booking_id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.worker_id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (booking.otp_verified) {
        return res.status(400).json({ error: 'OTP already verified' });
      }

      if (booking.otp_expiry && new Date() > booking.otp_expiry) {
        return res.status(400).json({ error: 'OTP has expired' });
      }

      if (booking.otp_attempts >= MAX_OTP_ATTEMPTS) {
        return res.status(400).json({ error: 'Max attempts exceeded' });
      }

      if (booking.otp !== otp) {
        booking.otp_attempts += 1;
        await booking.save();
        return res.status(400).json({ 
          error: 'Invalid OTP',
          attempts_remaining: MAX_OTP_ATTEMPTS - booking.otp_attempts
        });
      }

      // Success - complete booking and add to wallet
      booking.otp_verified = true;
      booking.otp_verified_at = new Date();
      booking.status = 'completed';
      booking.booking_status = 'completed';
      await booking.save();

      let wallet = await Wallet.findOne({ worker_id: booking.worker_id });
      if (!wallet) {
        wallet = await Wallet.create({
          worker_id: booking.worker_id,
          balance: 0,
          total_earned: 0,
          total_withdrawn: 0
        });
      }

      wallet.balance += booking.worker_payout_amount;
      wallet.total_earned += booking.worker_payout_amount;
      wallet.updated_at = new Date();
      await wallet.save();

      await Message.create({
        user_id: booking.user_id,
        worker_id: booking.worker_id,
        booking_id: booking._id,
        type: 'notification',
        title: 'Job Completed',
        message: `Job completed! ₹${booking.worker_payout_amount} added to wallet.`
      });

      res.json({ 
        success: true, 
        message: 'Job completed!',
        worker_payout: booking.worker_payout_amount,
        new_wallet_balance: wallet.balance
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  });

  // Get OTP status
  app.get('/api/otp/status/:booking_id', authenticateToken, async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.booking_id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.user_id.toString() !== req.user.id && 
          booking.worker_id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const isExpired = booking.otp_expiry && new Date() > booking.otp_expiry;

      res.json({
        otp_generated: !!booking.otp,
        otp_verified: booking.otp_verified,
        otp_expiry: booking.otp_expiry,
        is_expired: isExpired,
        attempts_remaining: MAX_OTP_ATTEMPTS - (booking.otp_attempts || 0)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get OTP status' });
    }
  });

  // Messages endpoints
  app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
      const messages = await Message.find({ user_id: req.user.id })
        .populate('worker_id', 'name photo')
        .populate('booking_id', 'service_type date')
        .sort({ created_at: -1 })
        .limit(50);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

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
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  });

  app.get('/api/messages/unread/count', authenticateToken, async (req, res) => {
    try {
      const count = await Message.countDocuments({ user_id: req.user.id, is_read: false });
      res.json({ unread_count: count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get count' });
    }
  });

  // Wallet endpoints
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
          total_withdrawn: 0
        });
      }

      const recentEarnings = await Booking.find({
        worker_id: req.user.id,
        status: 'completed'
      })
      .select('total_price worker_payout_amount created_at')
      .sort({ created_at: -1 })
      .limit(10);

      res.json({ wallet, recent_earnings: recentEarnings });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch wallet' });
    }
  });

  app.get('/api/wallet/balance', authenticateToken, async (req, res) => {
    try {
      if (req.user.type !== 'worker') {
        return res.status(403).json({ error: 'Only workers can check balance' });
      }
      const wallet = await Wallet.findOne({ worker_id: req.user.id });
      res.json({ balance: wallet ? wallet.balance : 0 });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get balance' });
    }
  });

  console.log('✅ API Routes registered');
};
