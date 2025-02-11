const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  // Reference the user who owns this product
  user: { type: mongoose.Schema.Types.ObjectId, ref: "userInformation", required: true },
  productName: { type: String, required: true },
  serviceCenter: String ,
  manufacturer: { type: String },
  store:  String ,
  model: String ,
  price:  Number ,
  purchaseDate: Date ,
  expirationDate: Date ,
  notes: String ,
  // We can store the image URL (or file path) where the image is saved
  imageUrl:  String 
}, {
  collection: 'warrantyInformation',
  timestamps: true
});

mongoose.model("warrantyInformation", ProductSchema);
