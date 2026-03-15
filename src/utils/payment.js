/**
 * Razorpay Payment Integration for MaidMatch
 * This file handles payment checkout and verification on the frontend
 */

const API_URL = 'http://localhost:3001/api';

/**
 * Load Razorpay script dynamically
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
};

/**
 * Get Razorpay key from backend
 */
export const getRazorpayKey = async (token) => {
  const response = await fetch(`${API_URL}/payments/key`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get Razorpay key');
  }

  return response.json();
};

/**
 * Create a Razorpay order
 */
export const createRazorpayOrder = async (bookingId, amount, token) => {
  const response = await fetch(`${API_URL}/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      booking_id: bookingId,
      amount: amount
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create order');
  }

  return data;
};

/**
 * Verify payment with the backend
 */
export const verifyPayment = async (bookingId, paymentData, token) => {
  const response = await fetch(`${API_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      booking_id: bookingId,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_signature: paymentData.razorpay_signature
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Payment verification failed');
  }

  return data;
};

/**
 * Get booking payment status
 */
export const getPaymentStatus = async (bookingId, token) => {
  const response = await fetch(`${API_URL}/payments/booking/${bookingId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get payment status');
  }

  return response.json();
};

/**
 * Request refund for a booking
 */
export const requestRefund = async (bookingId, token) => {
  const response = await fetch(`${API_URL}/payments/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      booking_id: bookingId
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Refund request failed');
  }

  return data;
};

/**
 * Open Razorpay checkout
 */
export const openRazorpayCheckout = async (options) => {
  const {
    key_id,
    order_id,
    amount,
    name,
    description,
    bookingId,
    onSuccess,
    onFailure
  } = options;

  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const razorpayOptions = {
      key: key_id,
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      name: name || 'MaidMatch',
      description: description || 'Booking Payment',
      order_id: order_id,
      handler: async (response) => {
        try {
          await onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
          resolve(response);
        } catch (error) {
          reject(error);
        }
      },
      prefill: {
        name: options.customerName || '',
        email: options.customerEmail || '',
        contact: options.customerPhone || ''
      },
      theme: {
        color: '#22c55e' // Primary green color
      },
      modal: {
        ondismiss: () => {
          onFailure('Payment cancelled by user');
        }
      }
    };

    const rzp = new Razorpay(razorpayOptions);
    rzp.on('payment.failed', (response) => {
      onFailure(response.error.description || 'Payment failed');
    });

    rzp.open();
  });
};

/**
 * Complete payment flow
 */
export const processPayment = async (bookingId, amount, userData, token) => {
  try {
    // Get Razorpay key
    const { key_id } = await getRazorpayKey(token);

    // Create order
    const order = await createRazorpayOrder(bookingId, amount, token);

    // Open checkout
    await openRazorpayCheckout({
      key_id,
      order_id: order.order_id,
      amount: amount,
      name: 'MaidMatch',
      description: 'Service Booking Payment',
      bookingId,
      customerName: userData?.name,
      customerEmail: userData?.email,
      customerPhone: userData?.phone,
      onSuccess: async (paymentData) => {
        // Verify payment with backend
        await verifyPayment(bookingId, paymentData, token);
      },
      onFailure: (error) => {
        throw new Error(error);
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Payment error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  loadRazorpayScript,
  getRazorpayKey,
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,
  requestRefund,
  openRazorpayCheckout,
  processPayment
};
