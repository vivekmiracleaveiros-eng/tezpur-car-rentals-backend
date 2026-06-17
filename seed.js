const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    brand: String,
    model: String,
    category: String,
    pricePerDay: Number,
    fuelType: String,
    seats: Number,
    imageUrl: String,
    location: String
});

const Car = mongoose.models.Car || mongoose.model('Car', carSchema);

async function seedDB() {
    try {
        // Using direct local IP to match our backend configurations
        await mongoose.connect('mongodb://127.0.0.1:27017/tezpur_rentals');
        console.log("Connected to MongoDB successfully...");

        const tezpurCars = [
            { 
                brand: "Mahindra", 
                model: "Thar", 
                category: "SUV", 
                pricePerDay: 3500, 
                fuelType: "Diesel", 
                seats: 4, 
                imageUrl: "/thar.jpg", 
                location: "Mission Chariali, Tezpur" 
            },
            { 
                brand: "Maruti", 
                model: "Swift", 
                category: "Hatchback", 
                pricePerDay: 1500, 
                fuelType: "Petrol", 
                seats: 5, 
                imageUrl: "swift.jpg", 
                location: "Tribeni, Tezpur" 
            },
            { 
                brand: "Toyota", 
                model: "Innova Crysta", 
                category: "SUV", 
                pricePerDay: 4500, 
                fuelType: "Diesel", 
                seats: 7, 
                imageUrl: "/innovacrysta.jpg", 
                location: "ASTC Station, Tezpur" 
            }
        ];

        // Clear the old entries to prevent duplicates or older key schemas
        await mongoose.connection.collection('cars').deleteMany({});
        await Car.insertMany(tezpurCars);

        console.log("Tezpur Fleet Re-Seeded Safely with Local Paths!");
        mongoose.connection.close();
    } catch (err) {
        console.error("Seeding Error:", err);
    }
}

seedDB();