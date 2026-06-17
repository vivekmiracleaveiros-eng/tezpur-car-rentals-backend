const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = "tezpur_secret_key_123";

// Connect to MongoDB
// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tezpur_rentals';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected: Secured Schema Active'))
  .catch(err => console.error('Database connection error:', err));

// --- MONGOOSE SCHEMAS & MODELS ---
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'customer' }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const carSchema = new mongoose.Schema({
  brand: String,
  model: String,
  category: String,
  pricePerDay: Number,
  imageUrl: String,
  totalQuantity: { type: Number, default: 5 },
  bookedQuantity: { type: Number, default: 0 }
});
const Car = mongoose.models.Car || mongoose.model('Car', carSchema);

const bookingSchema = new mongoose.Schema({
  carId: mongoose.Schema.Types.ObjectId,
  customerName: String,
  phoneNumber: String,
  pickupLocation: String,
  destination: String,
  serviceType: String,
  startDate: Date,
  endDate: Date,
  totalPrice: Number,
  userEmail: String,
  paymentMethod: { type: String, default: 'Card' }, // Explicitly captured now
  paymentStatus: { type: String, default: 'Paid' }   // Explicitly captured now
});
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role: email === 'admin@tezpur.com' ? 'admin' : 'customer' });
    await newUser.save();
    res.status(201).json({ message: "Registration successful" });
  } catch (err) { res.status(500).json({ message: "Registration failed" }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ message: "Login failed" }); }
});

// --- CORE SYSTEM ROUTES ---
app.get('/api/cars', async (req, res) => {
  res.json(await Car.find());
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { 
      carId, customerName, phoneNumber, pickupLocation, destination, 
      serviceType, startDate, endDate, totalPrice, userEmail, paymentMethod, paymentStatus 
    } = req.body;

    const car = await Car.findById(carId);
    if (car.bookedQuantity < car.totalQuantity) {
      car.bookedQuantity += 1;
      await car.save();
      
      const newBooking = new Booking({ 
        carId, customerName, phoneNumber, pickupLocation, destination, 
        serviceType, startDate, endDate, totalPrice, userEmail, paymentMethod, paymentStatus 
      });
      
      await newBooking.save();
      res.status(200).json({ message: "Booking registered successfully" });
    } else {
      res.status(400).json({ message: "No vehicles available for this selection." });
    }
  } catch (err) { res.status(500).json({ message: "Server database write failure" }); }
});

app.get('/api/bookings', async (req, res) => {
  res.json(await Booking.find());
});

// Smart Restock: Only reset cars that are completely rented out (bookedQuantity >= totalQuantity)
app.put('/api/cars/restock', async (req, res) => {
  try {
    // Find cars where booked quantity matches or exceeds total quantity and reset them to 0
    const result = await Car.updateMany(
      { $expr: { $gte: ["$bookedQuantity", "$totalQuantity"] } },
      { $set: { bookedQuantity: 0 } }
    );
    
    res.json({ 
      message: "Restock complete!", 
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during fleet restocking" });
  }
});
// Admin Checkpoint: Settle Pending Cash collections
app.put('/api/bookings/:id/settle', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Record not found" });

    booking.paymentStatus = 'Paid'; 
    await booking.save();
    res.json({ message: "Payment settlement recorded successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Database patch failed" });
  }
});
app.listen(5000, () => console.log('Secure Fleet backend operational on port 5000'));
