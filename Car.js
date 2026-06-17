const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  brand: String,
  model: String,
  category: String,
  pricePerDay: Number,
  fuelType: String,
  seats: Number,
  imageUrl: String,
  location: String,
  // These fields must be defined here to be saved to MongoDB
  totalQuantity: { type: Number, default: 5 },
  bookedQuantity: { type: Number, default: 0 }
});

module.exports = mongoose.model('Car', carSchema);