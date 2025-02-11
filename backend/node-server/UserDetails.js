const mongoose = require("mongoose");

const UserDetailsSchema = new mongoose.Schema({
  id: Number,
  firstname: String,
  lastname: String,
  email: { type: String, unique: true },
  password: String,
  state: String,
  city: String,
  address: String,
}, {
  collection: 'userInformation' 
});

mongoose.model("userInformation", UserDetailsSchema);