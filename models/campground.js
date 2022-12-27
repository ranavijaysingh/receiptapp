const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CampgroundSchema = new Schema({
    amount: String,
    name: String,
    upi: String,
    ref: String
});

module.exports = mongoose.model('Campground', CampgroundSchema);