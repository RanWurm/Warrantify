const mongoose = require("mongoose");

// File schema for storing file information
const FileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  // Reference the user who owns this product
  user: { type: mongoose.Schema.Types.ObjectId, ref: "userInformation", required: true },
  productName: { type: String, required: true },
  serviceCenter: String,
  manufacturer: { type: String },
  store: String,
  model: String,
  price: Number,
  purchaseDate: Date,
  expirationDate: Date,
  notes: String,
  // We can store the image URL (or file path) where the image is saved
  imageUrl: String,
  // Array of files (images/PDFs) associated with this product
  files: [FileSchema]
}, {
  collection: 'warrantyInformation',
  timestamps: true
});

mongoose.model("warrantyInformation", ProductSchema);