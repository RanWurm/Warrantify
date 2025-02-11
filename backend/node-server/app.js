require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
const cors = require('cors');
const mongoose =require("mongoose")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const mongoUrl="mongodb+srv://ranwurembrand:ShevShev12%21%40%23@cluster0.m4fkm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongoose
.connect(mongoUrl)
.then(()=>{
  console.log("connected to DataBase")
})
.catch((e)=>{
  console.log("connect to DataBase failed!")
  console.log(e)
})

JWT_SECRET="LJHDsBFGHSDB;FGIBSDHFBH"

require('./schemas/WarrantyAd.js')
require('./schemas/product.js') 
require('./schemas/User.js')

const User = mongoose.model("userInformation")
const Warranty = mongoose.model('warrantyInformation')
const WarrantyAd = mongoose.model('Ad')
app.use(cors());
app.use(express.json()); // Middleware to parse JSON requests


app.post('/register',async(req,res)=>{
  console.log("in reg")
  const {firstname,lastname,email,password} = req.body
  const oldUser = await User.findOne({email:email})
  if (oldUser){
    return res.send({data:"User alreadt exsists!"})
  }
 
  try{
    const encryptedPassword = await bcrypt.hash(password,10);
    const lastUser = await User.findOne({}).sort({ id: -1 });
    const newId = lastUser ? lastUser.id + 1 :  1
    console.log("newId is ", newId)
    await User.create(
      {
        id: newId,
        firstname:firstname,
        lastname:lastname,
        email:email,
        password:encryptedPassword,
        products: []
      })
      res.send({status:"ok", data:"User Created"})
  } catch(error){
    console.log(error); 
    res.send({status:"eFrror", data:"error"})
  }
  
})

app.post("/login",async(req,res)=>{
  console.log("hey")
  const{email,password} = req.body
  const oldUser = await User.findOne({email:email})
  if(!oldUser){
    return res.send({data:"User dosent exist!"})
  }
  if (await bcrypt.compare(password,oldUser.password)) {
    const token = jwt.sign({email:oldUser.email},JWT_SECRET)
    if(res.status(201)){
      return res.status(201).send({ status: "ok", data: token });
    }else{
      console.log("error occured")
      return res.send({error: "error"})
    }
  }
})


app.post("/userdata",async(req,res)=>{
  console.log("in /userdata")
  const {token} = req.body
  try{
    const user = jwt.verify(token,JWT_SECRET)
    const useremail = user.email
    User.findOne({email:useremail}).then((data)=>{
      console.log("user data is:",data)
      return res.send({Status:"Ok",data:data})
    })
  }catch(error){
    console.log(error)
    return res.send({error: "error"})
  }
})



app.post("/user-warranties",async(req,res)=>{
  const{token} = req.body
  try{
    const user = jwt.verify(token,JWT_SECRET)
    const useremail = user.email
    const userWithProducts = await User.findOne({email:useremail}).populate("products")
    if( !userWithProducts){
      return res.status(404).json({error:"User Not Found!"})
    }
    console.log("products are:",userWithProducts.products)
    res.status(200).json({ data: userWithProducts.products });
  }catch(error){
    console.log(error)
    res.status(500).json({error:"Internal server Error!"})
  }
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Node.js server is running!');
});

// Modified update-user endpoint in server.js
app.post('/update-user', async(req, res) => {
  const { firstname, lastname, password, image } = req.body;
  
  try {
    // Get user email from token
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const updateFields = {};
    
    // Only add fields that are provided
    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;
    if (image) updateFields.image = image;
    
    // Handle password update separately
    if (password) {
      const encryptedPassword = await bcrypt.hash(password, 10);
      updateFields.password = encryptedPassword;
    }

    await User.updateOne(
      { email: email },
      { $set: updateFields }
    );

    res.json({ status: "Ok", message: "Profile updated successfully" });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ status: "Error", message: "Failed to update profile" });
  }
});



app.post('/add-warranty', async(req, res) => {
  const { productName, serviceCenter, store, model,price, purchaseDate,expirationDate,notes} = req.body;
  console.log("in the problem req.headers is :",req.headers)
  try {
    // Get user email from token
    const token = req.headers.authorization?.split(' ')[1];
    console.log(token)
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log(user.products)
    const newWarranty = await Warranty.create({
      user: user._id, // Associate the warranty with the user
      productName,
      serviceCenter,
      store,
      model,
      price,
      purchaseDate,
      expirationDate,
      notes
    });
    user.products.push(newWarranty._id);
    await user.save();
    // 4. Send a success response.
    res.status(201).json({ message: 'Warranty added successfully', warranty: newWarranty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/add-for-sale-board",async(req,res)=>{
  const {userId,productId,salePrice,city,description} = req.body
  try {
    // Get user email from token
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({email})
    if(!user) return res.status(404).json({error:"User Not Found"})
      
    if (user._id.toString() !== userId){
      return res.status(403).json({ error: "Invalid User id" });
    }
    
    const product = await Warranty.findOne({ _id: productId });
    if (!product) return res.status(404).json({ error: "Product not found" });
    

      
    const newAd = await WarrantyAd.create({
        user:user._id,
        product:productId,
        salePrice,
        city,
        description,
    })
    res.status(200).json({ message: 'Warranty added to Boarding List', warrantyAd: newAd });
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(3000, '0.0.0.0', () => {
  console.log(`Node.js server running on port ${PORT}`);
});
