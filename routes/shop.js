// routes/shop.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const { ensureAuthenticated } = require('../middlewares/auth');

// Load environment variables from .env file
require('dotenv').config();

// Middleware to Initialize Cart in Session
router.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

// Display Products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.render('shop/index', {
      products,
      csrfToken: req.csrfToken(),
      title: 'Our Products',
      user: req.user, // Use req.user from Passport authentication
      errors: [],
      errorMsg: null,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Server Error');
  }
});

// Add to Cart
router.post('/add-to-cart', async (req, res) => {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10);
  
    try {
      const product = await Product.findById(productId);
      if (!product) {
        req.flash('error', 'Product not found.');
        return res.redirect('/');
      }
  
      // Check if product is already in cart
      const existingProductIndex = req.session.cart.findIndex(
        (item) => item.productId === productId
      );
  
      if (existingProductIndex >= 0) {
        // Update quantity
        req.session.cart[existingProductIndex].quantity += qty;
      } else {
        // Add new product to cart
        req.session.cart.push({
          productId: productId,
          name: product.name,
          price: product.price,
          quantity: qty,
          image: product.image,
        });
      }
  
      req.flash('success', `${product.name} has been added to your cart.`);
      res.redirect('/');
    } catch (error) {
      console.error('Error adding to cart:', error);
      req.flash('error', 'An error occurred while adding the product to the cart.');
      res.redirect('/');
    }
  });

// View Cart
router.get('/cart', (req, res) => {
  const cartItems = req.session.cart;
  res.render('shop/cart', {
    cartItems,
    csrfToken: req.csrfToken(),
    title: 'Your Cart',
    user: req.user,
  });
});

// Remove from Cart
router.post('/cart/remove', (req, res) => {
  const { productId } = req.body;
  req.session.cart = req.session.cart.filter((item) => item.productId !== productId);
  res.redirect('/cart');
});

// Update Cart Quantities
router.post('/cart/update', (req, res) => {
    const { productId, change } = req.body;
  
    const cart = req.session.cart;
    const product = cart.find((item) => item.productId === productId);
  
    if (product) {
      product.quantity += change;
      if (product.quantity <= 0) {
        req.session.cart = cart.filter((item) => item.productId !== productId);
      }
    }
  
    res.status(200).send({ success: true });
  });

// Proceed to Checkout
router.get('/checkout', (req, res) => {
  const cartItems = req.session.cart;
  if (!cartItems || cartItems.length === 0) {
    return res.redirect('/cart');
  }
  res.render('shop/checkout', {
    cartItems,
    csrfToken: req.csrfToken(),
    title: 'Checkout',
    user: req.user,
    errors: [],
    errorMsg: null,
  });
});

// Handle Order Submission from Checkout
router.post(
    '/checkout',
    [
      body('name').notEmpty().withMessage('Name is required').trim().escape(),
      body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
      body('address').notEmpty().withMessage('Address is required').trim().escape(),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      const cartItems = req.session.cart;
  
      if (!errors.isEmpty()) {
        return res.status(422).render('shop/checkout', {
          cartItems,
          csrfToken: req.csrfToken(),
          errors: errors.array(),
          errorMsg: null,
          title: 'Checkout',
          user: req.user,
        });
      }
  
      if (!cartItems || cartItems.length === 0) {
        return res.redirect('/cart');
      }
  
      const { name, email, address } = req.body;
  
      const totalPrice = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
  
      try {
        // Save Order
        const order = new Order({
          customerName: name,
          email,
          address,
          products: cartItems.map((item) => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          totalPrice,
        });
        await order.save();
  
        // Send Confirmation Email
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
  
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Order Confirmation',
          text: `Thank you for your order! Your total is $${totalPrice.toFixed(2)}.`,
        };
  
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
            // Re-render the checkout page with an error message
            return res.status(500).render('shop/checkout', {
              cartItems,
              csrfToken: req.csrfToken(),
              errors: [],
              errorMsg: 'There was an error processing your order. Please try again later.',
              title: 'Checkout',
              user: req.user,
            });
          } else {
            // Clear the cart
            req.session.cart = [];
            res.redirect('/thank-you');
          }
        });
      } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).send('Server Error');
      }
    }
  );

router.get('/orders', ensureAuthenticated, async (req, res) => {
    try {
      const orders = await Order.find({ email: req.user.email })
        .sort({ date: -1 })
        .populate('products.product'); // Populate product details
      res.render('shop/orders', {
        title: 'Your Orders',
        user: req.user,
        orders,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).send('Server Error');
    }
  });

  // Product Details Route
router.get('/product/:id', async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.redirect('/');
      }
      res.render('shop/product-detail', {
        product,
        csrfToken: req.csrfToken(), // If you are using CSRF protection
        user: req.user, // If you are using authentication
        title: product.name, // Pass the product name as the title
      });
    } catch (error) {
      console.error('Error fetching product details:', error);
      res.redirect('/');
    }
  });

// Thank You Page
router.get('/thank-you', (req, res) => {
  res.render('shop/thank-you', {
    title: 'Thank You',
    user: req.user,
    errors: [],
    errorMsg: null,
  });
});

module.exports = router;