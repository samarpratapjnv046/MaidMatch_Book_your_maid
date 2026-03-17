const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to DB (adjust connection string)
mongoose.connect('mongodb://localhost:27017/maidmatch');

// Sample worker with photos (will use placeholder images)
async function createSampleWorker() {
  const Worker = mongoose.model('Worker', new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: String,
    photo: String,
    aadhar_number: String,
    aadhar_photo: String,
    // ... other fields
  }));

  const hashedPassword = bcrypt.hashSync('worker123', 10);

  const sampleWorker = new Worker({
    name: 'Sample Maid Maria',
    email: 'maria@maidmatch.com',
    password: hashedPassword,
    phone: '9876543210',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
    aadhar_number: '123456789012',
    aadhar_photo: 'https://images.unsplash.com/photo-1620162401781-9bdecd8779b5?w=300&h=200&fit=crop', // Sample Aadhar-like image
    hourly_rate: 200,
    services: ['Cleaning', 'Cooking'],
    is_verified: false
  });

  await sampleWorker.save();
  console.log('✅ Sample worker created:');
  console.log('Name:', sampleWorker.name);
  console.log('ID:', sampleWorker._id);
  console.log('Photo:', sampleWorker.photo);
  console.log('Aadhar Photo:', sampleWorker.aadhar_photo);
  console.log('View photos at:');
  console.log(`http://localhost:3001/api/admin/workers/${sampleWorker._id}`);
  mongoose.disconnect();
}

createSampleWorker().catch(console.error);
