const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/transaction-receipt', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];
const amountArr= [4000, 3000, 5000];
const nameArr = ['nikhil','akhil','prakhil'];
const upiArr = ['wanihdfc@hdfcbank','akhilicici@icicibank','prakhilicici@icicibank']

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 3; i++) {
        const camp = new Campground({
            amount:amountArr[i],
            name:nameArr[i],
            upi:upiArr[i],
            ref:''
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})