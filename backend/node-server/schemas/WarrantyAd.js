const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "warrantyInformation", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "userInformation", required: true },
  productName:String,
  manufacturer:String,
  salePrice: Number,
  city: String,
  description: String,
}, {
  collection: 'WarrantyAd',
  timestamps: true
});

mongoose.model("Ad", AdSchema);
