const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  carId: mongoose.Schema.Types.ObjectId,
  customerName: String,
  phoneNumber: String,
  pickupLocation: String,
  destination: String,
  serviceType: String,
  startDate: Date,
  endDate: Date,
  totalPrice: Number
});

module.exports = mongoose.model('Booking', bookingSchema);