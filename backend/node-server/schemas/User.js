const mongoose = require("mongoose");

const UserDetailsSchema = new mongoose.Schema({
  id: Number,
  firstname: String,
  lastname: String,
  email: { type: String, unique: true },
  password: String,
  image: String,
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "warrantyInformation",
    default: []
  }]
}, {
  collection: 'userInformation'
});

mongoose.model("userInformation", UserDetailsSchema);