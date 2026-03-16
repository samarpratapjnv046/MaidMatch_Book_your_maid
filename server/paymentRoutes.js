// ==================== RAZORPAY PAYMENT ENDPOINTS ====================
// This file contains the Razorpay payment endpoints that should be added to server.js

/* 
To integrate these routes into server.js, add the following before mongoose.connect():

import paymentRoutes from './paymentRoutes.js';
app.use('/api/payments', paymentRoutes);

Or copy these endpoints directly into server.js before the mongoose.connect() call.
*/

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

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `booking_${booking_id}_${Date.now()}`,
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
      return res.status(400).json({ error: 'Invalid payment signature' });
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
        booking: { _id: booking._id, service_type: booking.service_type, booking_status: booking.booking_status, payment_status: booking.payment_status, date: booking.date, total_price: booking.total_price }
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

// Webhook handler
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing webhook signature' });
    }

    const crypto = await import('crypto');
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(req.body).digest('hex');

    if (signature !== expectedSignature) {
      console.error('Webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body.toString());
    console.log('Webhook event received:', event.event);

    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity.id);
        break;
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity.id);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
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
      booking_id: booking._id, payment_status: booking.payment_status, booking_status: booking.booking_status,
      razorpay_order_id: booking.razorpay_order_id, razorpay_payment_id: booking.razorpay_payment_id,
      total_price: booking.total_price, commission_amount: booking.commission_amount,
      worker_payout_amount: booking.worker_payout_amount, payment_verified: booking.payment_verified
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

// ==================== END RAZORPAY PAYMENT ENDPOINTS ====================
