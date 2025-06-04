require('dotenv').config();

const express = require('express');

const app = express();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

const cors = require('cors');
const mongoose =require("mongoose")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const fetch = require('node-fetch');

const pythonBackendURL = process.env.PYTHON_BACKEND_URL;
// const  = "http://172.20.10.5:5000";

console.log("🐍pythonBackendURL:" + pythonBackendURL);
const mongoUrl="mongodb+srv://ilanitber:12345679@cluster0.m4fkm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

//const mongoUrl="mongodb+srv://ranwurembrand:ShevShev12%21%40%23@cluster0.m4fkm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

mongoose
.connect(mongoUrl)
.then(()=>{
  console.log("connected to DataBase:",mongoose.connection.db.databaseName);
})
.catch((e)=>{
  console.log("connect to DataBase failed!")
  console.log(e)
})

JWT_SECRET="LJHDsBFGHSDB;FGIBSDHFBH"
require('./schemas/AdBoardSchema.js')
require('./schemas/WarrantyAd.js')
require('./schemas/product.js') 
require('./schemas/User.js')

const User = mongoose.model("userInformation")
const Warranty = mongoose.model('warrantyInformation')
const WarrantyAd = mongoose.model('Ad')
const AdBoard = require('./schemas/AdBoardSchema.js');

app.use(cors());
app.use(express.json()); // Middleware to parse JSON requests


app.post('/register',async(req,res)=>{
  console.log("in reg")
  const {firstname,lastname,email,password} = req.body

  const warranties = await Warranty.find({ user: user._id });
  console.log("User warranties:", warranties.map(w => w._id.toString()));


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
  const {token} = req.body
  try{
    const user = jwt.verify(token,JWT_SECRET)
    const useremail = user.email
    
    // Exclude password field
    User.findOne({email:useremail}).select('-password').then((data)=>{
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
//   console.log("in the problem req.headers is :",req.headers)
    console.log("In add-warranty");
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
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

    // Send to Python cache

    const payload = {
      warranty_id: newWarranty._id.toString(),
      user_id: user._id.toString(),
      productName,
      model,
      price,
      purchaseDate,
      expirationDate,
      store,
      serviceCenter,
      notes
    };

    console.log("🐍 Sending data to Python backend:", payload);

    const pythonResponse = await fetch(`${pythonBackendURL}/add_warranty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const pythonResponseBody = await pythonResponse.json(); // or .json() if you expect JSON
    console.log("🐍 Python backend responded with:", pythonResponse.status, pythonResponseBody);

    // Send a success response.
    res.status(201).json({ message: 'Warranty added successfully', warranty: newWarranty });
  } catch (error) {
    console.error('Error adding warranty:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/add-for-sale-board",async(req,res)=>{
  const {productId,salePrice,city,description} = req.body
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({email})
    if(!user) return res.status(404).json({error:"User Not Found"})
    
    const product = await Warranty.findOne({ _id: productId });
    if (!product) return res.status(404).json({ error: "Product not found" });
  
    const newAd = await WarrantyAd.create({
        user:user._id,
        product:productId,
        productName:product.productName,
        brand: product.manufacturer,
        model:product.model,
        salePrice,
        city,
        description,
    })
    const updatedBoard = await AdBoard.findOneAndUpdate(
      { name: "SaleBoard" }, // You can choose a filter that fits your needs
      { 
        $push: { 
          ads: { 
            $each: [newAd._id], 
            $position: 0 
          } 
        } 
      },
      { new: true, upsert: true } // Return the updated doc and create if not exists
    );
    res.status(200).json({ 
      message: "Warranty ad added to Boarding List", 
      warrantyAd: newAd,
      adBoard: updatedBoard // optionally return the updated board
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/ad-board/page/:page', async (req, res) => {
  console.log('In /ad-board/page/:page');
  const page = parseInt(req.params.page, 10) || 1; // Ensure page is a number
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  console.log('Page:', page, 'PageSize:', pageSize, 'Skip:', skip);
  try {
    // Find the adBoard document by name and use $slice to get the desired segment of ads.
    const board = await AdBoard.findOne(
      { name: 'SaleBoard' },
      { ads: { $slice: [skip, pageSize] } } // Slice from `skip` and return up to pageSize items
    ).populate('ads'); // Optionally populate the ad documents if you need their details

    if (!board) {
      console.log('AdBoard not found');
      return res.status(404).json({ error: 'AdBoard not found' });
    }
    
    res.status(200).json({ ads: board.ads });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this endpoint to your server.js

app.delete('/remove-from-sale-board/:productId', async(req, res) => {
  const { productId } = req.params;
  
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Find the ad for this product by this user
    const warrantyAd = await WarrantyAd.findOne({ 
      product: productId, 
      user: user._id 
    });
    
    if (!warrantyAd) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    
    console.log('Found ad to delete:', warrantyAd._id); // Debug log
    
    // Remove the ad from the AdBoard
    const boardUpdateResult = await AdBoard.updateOne(
      { name: "SaleBoard" },
      { $pull: { ads: warrantyAd._id } }
    );
    
    console.log('AdBoard update result:', boardUpdateResult); // Debug log
    
    // Delete the ad document
    const deleteResult = await WarrantyAd.findByIdAndDelete(warrantyAd._id);
    console.log('Ad delete result:', deleteResult); // Debug log
    
    res.status(200).json({ 
      message: 'Product removed from market list successfully',
      removedAdId: warrantyAd._id,
      boardUpdateResult,
      deleteResult
    });
  } catch (error) {
    console.error('Remove from market error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Check market status endpoint
app.get('/check-market-status/:productId', async(req, res) => {
  const { productId } = req.params;
  
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check if this product is already on the market by this user
    const existingAd = await WarrantyAd.findOne({ 
      product: productId, 
      user: user._id 
    });
    
    console.log(`Market status check for product ${productId}:`, {
      isOnMarket: !!existingAd,
      adId: existingAd?._id
    }); // Debug log
    
    res.status(200).json({ 
      isOnMarket: !!existingAd,
      adData: existingAd || null
    });
  } catch (error) {
    console.error('Check market status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/update-warranty/:warrantyId', async (req, res) => {
    console.log('🛠️ Received update request for warranty:', warrantyId);

  const { warrantyId } = req.params;
  const updateData = req.body;

  console.log("📦 In update: warranty id is: ", warrantyId);

  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const warranty = await Warranty.findOne({ _id: warrantyId, user: user._id });
    if (!warranty) return res.status(404).json({ error: 'Warranty not found' });

    // Update allowed fields only
    const allowedFields = ['productName', 'serviceCenter', 'store', 'model', 'price', 'purchaseDate', 'expirationDate', 'notes'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        warranty[field] = updateData[field];
      }
    });

    await warranty.save();

    // Notify Python backend of update
    // const payload = {
    //   warranty_id: warranty._id.toString(),
    //   user_id: user._id.toString(),
    //   ...updateData
    // };

    // try {
    //   const pythonRes = await fetch(`${pythonBackendURL}/update_warranty`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload)
    //   });

    //   const pythonResponse = await pythonRes.json();
    //   console.log("🐍 Python backend responded to update:", pythonResponse);
    // } catch (err) {
    //   console.warn("🐍 Could not reach Python backend:", err.message);
    // }

    return res.status(200).json({ message: 'Warranty updated successfully', warranty });
  } catch (error) {
    console.error('Error updating warranty:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Start the server
const PORT = process.env.PORT || 3000;

app.listen(3000, '0.0.0.0', () => {
  console.log(`Node.js server running on port ${PORT}`);
});
