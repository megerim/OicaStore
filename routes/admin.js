const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ensureAuthenticated } = require('../middlewares/auth');
const { ensureAdmin } = require('../middlewares/admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const csrf = require('csurf');

// CSRF Protection Middleware
const csrfProtection = csrf();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images'); // Save images to public/images folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file with current timestamp
  },
});
const upload = multer({ storage: storage });

// Admin Dashboard
router.get('/dashboard', ensureAuthenticated, ensureAdmin, csrfProtection, async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 }).limit(10).populate('products.product');
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.user,
      orders,
      productCount,
      orderCount,
      csrfToken: req.csrfToken(), // Pass CSRF token
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// Add Product Page
router.get('/products/add', ensureAuthenticated, ensureAdmin, csrfProtection, (req, res) => {
  res.render('admin/add-product', {
    title: 'Add Product',
    errors: [],
    product: {},
    csrfToken: req.csrfToken(), // Pass CSRF token
  });
});

// Add Product Handle with Image Upload
router.post('/products/add', ensureAuthenticated, ensureAdmin, csrfProtection, upload.single('image'), async (req, res) => {
  const { name, price, description } = req.body;
  const errors = [];

  // Validation
  if (!name || !price || !description) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  if (errors.length > 0) {
    return res.render('admin/add-product', {
      title: 'Add Product',
      errors,
      product: { name, price, description },
      csrfToken: req.csrfToken(), // Re-pass CSRF token on error
    });
  }

  try {
    const newProduct = new Product({
      name,
      price,
      description,
      image: req.file ? req.file.filename : 'default.jpg', // Handle image upload or default
    });
    await newProduct.save();
    req.flash('success', 'Product added successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard');
  }
});

// Edit Product Page
router.get('/products/edit/:id', ensureAuthenticated, ensureAdmin, csrfProtection, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.render('admin/edit-product', {
      title: 'Edit Product',
      errors: [],
      product,
      csrfToken: req.csrfToken(), // Pass CSRF token for form security
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/products');
  }
});

// Edit Product Handle with Image Upload
router.post('/products/edit/:id', ensureAuthenticated, ensureAdmin, csrfProtection, upload.single('newImage'), async (req, res) => {
  const { name, price, description } = req.body;
  const errors = [];

  // Validation
  if (!name || !price || !description) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  if (errors.length > 0) {
    const product = await Product.findById(req.params.id);
    return res.render('admin/edit-product', {
      title: 'Edit Product',
      errors,
      product,
      csrfToken: req.csrfToken(), // Re-pass CSRF token if validation fails
    });
  }

  try {
    // Find existing product
    const product = await Product.findById(req.params.id);

    // If a new image is uploaded, use that image; otherwise, keep the existing image
    const image = req.file ? req.file.filename : product.image;

    await Product.findByIdAndUpdate(req.params.id, {
      name,
      price,
      description,
      image,  // Keep old image if not changed
    });

    req.flash('success', 'Product updated successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/products');
  }
});

// View All Products
router.get('/products', ensureAuthenticated, ensureAdmin, csrfProtection, async (req, res) => {
  try {
    const products = await Product.find();
    res.render('admin/products', {
      title: 'Manage Products',
      user: req.user,
      products,
      csrfToken: req.csrfToken(), // Pass CSRF token
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard');
  }
});

// Delete Product
router.post('/products/delete/:id', ensureAuthenticated, ensureAdmin, csrfProtection, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success', 'Product deleted successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/products');
  }
});

module.exports = router;