require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// File upload configuration
// REPLACE your multer configuration with this:
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const warrantyId = req.params.warrantyId;
    const uploadPath = path.join(__dirname, 'uploads', 'warranties', warrantyId);
    
    console.log('📁 Creating directory:', uploadPath);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    console.log('📄 Processing file:', file.originalname, 'mimetype:', file.mimetype);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = file.fieldname + '-' + uniqueSuffix + fileExtension;
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('🔍 File filter check:', file.mimetype);
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});



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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.post('/register',async(req,res)=>{
  console.log("in reg")
  const {firstname,lastname,email,password} = req.body

  // REMOVE THIS LINE - it's causing the error:
  // const warranties = await Warranty.find({ user: user._id });
  // console.log("User warranties:", warranties.map(w => w._id.toString()));

  const oldUser = await User.findOne({email:email})
  if (oldUser){
    return res.send({data:"User already exists!"})
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
    res.send({status:"error", data:"error"})
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


// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

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

// REPLACE your upload endpoint with this debug version:
app.post('/warranty/:warrantyId/upload-files', verifyToken, upload.array('files', 5), async (req, res) => {
  const { warrantyId } = req.params;
  
  console.log('🔍 Upload endpoint called');
  console.log('🔍 req.files:', req.files);
  console.log('🔍 req.body:', req.body);
  console.log('🔍 req.headers:', req.headers);
  
  if (req.files && req.files.length > 0) {
    req.files.forEach((file, index) => {
      console.log(`📄 File ${index} properties:`, Object.keys(file));
      console.log(`📄 File ${index} details:`, file);
    });
  } else {
    console.log('❌ No files received by multer');
  }
  
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const warranty = await Warranty.findOne({ _id: warrantyId, user: user._id });
    if (!warranty) return res.status(404).json({ error: 'Warranty not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files received' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream', // Fallback if mimetype is undefined
      size: file.size,
      uploadDate: new Date(),
      path: `/uploads/warranties/${warrantyId}/${file.filename}`
    }));

    console.log('📁 Processed uploadedFiles:', uploadedFiles);

    // Add files to warranty document
    if (!warranty.files) {
      warranty.files = [];
    }
    warranty.files.push(...uploadedFiles);
        
    await warranty.save();

    res.status(200).json({ 
      message: 'Files uploaded successfully', 
      files: uploadedFiles,
      totalFiles: warranty.files.length
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});
// 2. Get all files for a warranty/product
app.get('/warranty/:warrantyId/files', verifyToken, async (req, res) => {
  const { warrantyId } = req.params;
  
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const warranty = await Warranty.findOne({ _id: warrantyId, user: user._id });
    if (!warranty) return res.status(404).json({ error: 'Warranty not found' });

    const files = warranty.files || [];
    
    // Add full URL for each file
    const filesWithUrls = files.map(file => ({
      ...file.toObject(),
      downloadUrl: `${req.protocol}://${req.get('host')}${file.path}`
    }));

    res.status(200).json({ files: filesWithUrls });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// 3. Download a specific file
app.get('/warranty/:warrantyId/download/:filename', verifyToken, async (req, res) => {
  const { warrantyId, filename } = req.params;
  
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const warranty = await Warranty.findOne({ _id: warrantyId, user: user._id });
    if (!warranty) return res.status(404).json({ error: 'Warranty not found' });

    // Check if file exists in warranty files
    const fileInfo = warranty.files?.find(f => f.filename === filename);
    if (!fileInfo) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join(__dirname, 'uploads', 'warranties', warrantyId, filename);
    
    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
    const contentType = fileInfo.mimeType || fileInfo.mimetype || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// 4. Delete a specific file
app.delete('/warranty/:warrantyId/files/:filename', verifyToken, async (req, res) => {
  const { warrantyId, filename } = req.params;
  
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const warranty = await Warranty.findOne({ _id: warrantyId, user: user._id });
    if (!warranty) return res.status(404).json({ error: 'Warranty not found' });

    // Find and remove file from warranty document
    const fileIndex = warranty.files?.findIndex(f => f.filename === filename);
    if (fileIndex === -1) return res.status(404).json({ error: 'File not found' });

    const fileToDelete = warranty.files[fileIndex];
    warranty.files.splice(fileIndex, 1);
    await warranty.save();

    // Delete physical file
    const filePath = path.join(__dirname, 'uploads', 'warranties', warrantyId, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({ 
      message: 'File deleted successfully',
      deletedFile: fileToDelete,
      remainingFiles: warranty.files.length
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// 5. Delete all files for a warranty
app.delete('/warranty/:warrantyId/files', verifyToken, async (req, res) => {
  const { warrantyId } = req.params;
  
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const warranty = await Warranty.findOne({ _id: warrantyId, user: user._id });
    if (!warranty) return res.status(404).json({ error: 'Warranty not found' });

    const deletedCount = warranty.files?.length || 0;

    // Delete physical directory
    const warrantyDir = path.join(__dirname, 'uploads', 'warranties', warrantyId);
    if (fs.existsSync(warrantyDir)) {
      fs.rmSync(warrantyDir, { recursive: true, force: true });
    }

    // Clear files from warranty document
    warranty.files = [];
    await warranty.save();

    res.status(200).json({ 
      message: 'All files deleted successfully',
      deletedCount: deletedCount
    });
  } catch (error) {
    console.error('Delete all files error:', error);
    res.status(500).json({ error: 'Failed to delete files' });
  }
});

// 6. Get file info without downloading
app.get('/warranty/:warrantyId/files/:filename/info', verifyToken, async (req, res) => {
  const { warrantyId, filename } = req.params;
  
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const warranty = await Warranty.findOne({ _id: warrantyId, user: user._id });
    if (!warranty) return res.status(404).json({ error: 'Warranty not found' });

    const fileInfo = warranty.files?.find(f => f.filename === filename);
    if (!fileInfo) return res.status(404).json({ error: 'File not found' });

    const fileWithUrl = {
      ...fileInfo.toObject(),
      downloadUrl: `${req.protocol}://${req.get('host')}/warranty/${warrantyId}/download/${filename}`
    };

    res.status(200).json({ file: fileWithUrl });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files per upload.' });
    }
  }
  
  if (error.message === 'Only images (JPEG, PNG, GIF) and PDF files are allowed') {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

// [Include all your existing endpoints here - register, login, userdata, etc.]

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
  const {productId,salePrice,city,phoneNumber,description} = req.body
  console.log("add for sale board is  data is: ", req.body )
  
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
        phoneNumber,
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

// DELETE warranty by ID
app.delete('/delete-warranty/:warrantyId', async (req, res) => {
  const { warrantyId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Remove warranty from Warranty collection
    await Warranty.findByIdAndDelete(warrantyId);

    // Also remove from user's product list
    user.products = user.products.filter(p => p.toString() !== warrantyId);
    await user.save();

    res.status(200).json({ message: 'Warranty deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ error: 'Server error while deleting' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(3000, '0.0.0.0', () => {
  console.log(`Node.js server running on port ${PORT}`);
});
